import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new course
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    companyName: v.string(),
    industry: v.string(),
    targetAudience: v.string(),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    estimatedDuration: v.string(),
    createdBy: v.string(),
    orgId: v.optional(v.id("organizations")),
    isComplianceTemplate: v.optional(v.boolean()),
    complianceCategory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const courseId = await ctx.db.insert("courses", {
      ...args,
      status: "generating",
      coverImage: undefined,
      createdAt: now,
      updatedAt: now,
    });
    return courseId;
  },
});

// Update course status
export const updateStatus = mutation({
  args: {
    courseId: v.id("courses"),
    status: v.union(v.literal("draft"), v.literal("generating"), v.literal("published"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.courseId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Get all courses for a user
export const getByCreator = query({
  args: { createdBy: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_creator", (q) => q.eq("createdBy", args.createdBy))
      .order("desc")
      .collect();
  },
});

// Get a single course with all its data
export const getById = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;

    const modules = await ctx.db
      .query("modules")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    const sortedModules = modules.sort((a, b) => a.order - b.order);

    const modulesWithLessons = await Promise.all(
      sortedModules.map(async (module) => {
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("by_module", (q) => q.eq("moduleId", module._id))
          .collect();
        return {
          ...module,
          lessons: lessons.sort((a, b) => a.order - b.order),
        };
      })
    );

    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    return { ...course, modules: modulesWithLessons, quizzes };
  },
});

// Get all courses for an organization
export const getByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .collect();
  },
});

// Duplicate a course with all modules, lessons, and quizzes
export const duplicate = mutation({
  args: {
    courseId: v.id("courses"),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    const now = Date.now();

    // Create new course as draft
    const newCourseId = await ctx.db.insert("courses", {
      title: `${course.title} (Copy)`,
      description: course.description,
      companyName: course.companyName,
      industry: course.industry,
      targetAudience: course.targetAudience,
      difficulty: course.difficulty,
      estimatedDuration: course.estimatedDuration,
      coverImage: course.coverImage,
      status: "draft",
      createdBy: args.createdBy,
      orgId: course.orgId,
      isComplianceTemplate: course.isComplianceTemplate,
      complianceCategory: course.complianceCategory,
      createdAt: now,
      updatedAt: now,
    });

    // Copy modules
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    const sortedModules = modules.sort((a, b) => a.order - b.order);

    for (const module of sortedModules) {
      const newModuleId = await ctx.db.insert("modules", {
        courseId: newCourseId,
        title: module.title,
        description: module.description,
        order: module.order,
        estimatedDuration: module.estimatedDuration,
      });

      // Copy lessons for this module
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_module", (q) => q.eq("moduleId", module._id))
        .collect();
      const sortedLessons = lessons.sort((a, b) => a.order - b.order);

      for (const lesson of sortedLessons) {
        await ctx.db.insert("lessons", {
          moduleId: newModuleId,
          courseId: newCourseId,
          title: lesson.title,
          content: lesson.content,
          keyTakeaways: lesson.keyTakeaways,
          order: lesson.order,
          estimatedDuration: lesson.estimatedDuration,
        });
      }

      // Copy module quizzes
      const moduleQuizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_module", (q) => q.eq("moduleId", module._id))
        .collect();
      for (const quiz of moduleQuizzes) {
        await ctx.db.insert("quizzes", {
          courseId: newCourseId,
          moduleId: newModuleId,
          lessonId: undefined,
          title: quiz.title,
          type: quiz.type,
          passingScore: quiz.passingScore,
          questions: quiz.questions,
        });
      }
    }

    // Copy final exam
    const finalQuizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    for (const quiz of finalQuizzes) {
      if (quiz.type === "final") {
        await ctx.db.insert("quizzes", {
          courseId: newCourseId,
          moduleId: undefined,
          lessonId: undefined,
          title: quiz.title,
          type: quiz.type,
          passingScore: quiz.passingScore,
          questions: quiz.questions,
        });
      }
    }

    return newCourseId;
  },
});

// Delete a course and all related data
export const deleteCourse = mutation({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    // Delete all course assignments
    const courseAssignments = await ctx.db
      .query("courseAssignments")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    for (const assignment of courseAssignments) {
      await ctx.db.delete(assignment._id);
    }

    // Delete all certificates
    const certificates = await ctx.db
      .query("certificates")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    for (const cert of certificates) {
      await ctx.db.delete(cert._id);
    }

    // Delete all quiz attempts
    const quizAttempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    for (const attempt of quizAttempts) {
      await ctx.db.delete(attempt._id);
    }

    // Delete all user progress
    const progressRecords = await ctx.db
      .query("userProgress")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    for (const progress of progressRecords) {
      await ctx.db.delete(progress._id);
    }

    // Delete all lessons
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    for (const lesson of lessons) {
      await ctx.db.delete(lesson._id);
    }

    // Delete all quizzes
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    for (const quiz of quizzes) {
      await ctx.db.delete(quiz._id);
    }

    // Delete all modules
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    for (const module of modules) {
      await ctx.db.delete(module._id);
    }

    // Delete the course
    await ctx.db.delete(args.courseId);
  },
});

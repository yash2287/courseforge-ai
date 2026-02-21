import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Start or get progress for a course
export const getOrCreate = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProgress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { lastAccessedAt: Date.now() });
      return existing._id;
    }

    const progressId = await ctx.db.insert("userProgress", {
      userId: args.userId,
      courseId: args.courseId,
      completedLessons: [],
      currentLessonId: undefined,
      overallProgress: 0,
      startedAt: Date.now(),
      lastAccessedAt: Date.now(),
      completedAt: undefined,
    });

    // Auto-update any course assignment to "in_progress"
    const assignments = await ctx.db
      .query("courseAssignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const assignment = assignments.find((a) => a.courseId === args.courseId && a.status === "assigned");
    if (assignment) {
      await ctx.db.patch(assignment._id, { status: "in_progress" });
    }

    return progressId;
  },
});

// Mark a lesson as completed
export const completeLesson = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    lessonId: v.id("lessons"),
    totalLessons: v.number(),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();

    if (!progress) return;

    const completedLessons = progress.completedLessons.includes(args.lessonId)
      ? progress.completedLessons
      : [...progress.completedLessons, args.lessonId];

    const overallProgress = Math.round(
      (completedLessons.length / args.totalLessons) * 100
    );

    await ctx.db.patch(progress._id, {
      completedLessons,
      overallProgress,
      lastAccessedAt: Date.now(),
      completedAt: overallProgress === 100 ? Date.now() : undefined,
    });

    // Auto-update course assignment status when all lessons completed
    if (overallProgress === 100) {
      const assignments = await ctx.db
        .query("courseAssignments")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      const assignment = assignments.find(
        (a) => a.courseId === args.courseId && a.status !== "completed"
      );
      if (assignment) {
        await ctx.db.patch(assignment._id, {
          status: "completed",
          completedAt: Date.now(),
        });
      }

      // Dispatch course.completed webhook
      const course = await ctx.db.get(args.courseId);
      if (course?.orgId) {
        await ctx.scheduler.runAfter(0, internal.webhooks.dispatchEvent, {
          orgId: course.orgId,
          event: "course.completed",
          payload: JSON.stringify({
            event: "course.completed",
            timestamp: new Date().toISOString(),
            data: {
              userId: args.userId,
              courseId: args.courseId,
              courseTitle: course.title,
              completedAt: Date.now(),
            },
          }),
        });
      }
    }
  },
});

// Get progress for a user's course
export const getProgress = query({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProgress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();
  },
});

// Get all progress for a user
export const getUserProgress = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Submit a quiz attempt
export const submitQuizAttempt = mutation({
  args: {
    userId: v.string(),
    quizId: v.id("quizzes"),
    courseId: v.id("courses"),
    score: v.number(),
    passed: v.boolean(),
    answers: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const attemptId = await ctx.db.insert("quizAttempts", {
      ...args,
      attemptedAt: Date.now(),
    });

    // Dispatch quiz.passed webhook if passed
    if (args.passed) {
      const course = await ctx.db.get(args.courseId);
      if (course?.orgId) {
        const quiz = await ctx.db.get(args.quizId);
        await ctx.scheduler.runAfter(0, internal.webhooks.dispatchEvent, {
          orgId: course.orgId,
          event: "quiz.passed",
          payload: JSON.stringify({
            event: "quiz.passed",
            timestamp: new Date().toISOString(),
            data: {
              userId: args.userId,
              courseId: args.courseId,
              courseTitle: course.title,
              quizId: args.quizId,
              quizTitle: quiz?.title ?? "Quiz",
              score: args.score,
            },
          }),
        });
      }
    }

    return attemptId;
  },
});

// Get quiz attempts
export const getQuizAttempts = query({
  args: {
    userId: v.string(),
    quizId: v.id("quizzes"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizAttempts")
      .withIndex("by_user_quiz", (q) =>
        q.eq("userId", args.userId).eq("quizId", args.quizId)
      )
      .collect();
  },
});

// Get the final exam quiz for a course
export const getFinalExamForCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    return quizzes.find((q) => q.type === "final") ?? null;
  },
});

// Get user's best final exam attempt for a course
export const getBestFinalExamScore = query({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    const finalExam = quizzes.find((q) => q.type === "final");
    if (!finalExam) return null;

    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user_quiz", (q) =>
        q.eq("userId", args.userId).eq("quizId", finalExam._id)
      )
      .collect();

    if (attempts.length === 0) return null;

    return attempts.reduce((best, current) =>
      current.score > best.score ? current : best
    );
  },
});

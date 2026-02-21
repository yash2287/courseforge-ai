import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all system templates + org templates
export const list = query({
  args: {
    orgId: v.optional(v.id("organizations")),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let templates = await ctx.db
      .query("courseTemplates")
      .withIndex("by_system", (q) => q.eq("isSystem", true))
      .collect();

    // Also get org-specific templates if orgId provided
    if (args.orgId) {
      const orgTemplates = await ctx.db
        .query("courseTemplates")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
        .collect();
      templates = [...templates, ...orgTemplates];
    }

    if (args.category && args.category !== "all") {
      templates = templates.filter((t) => t.category === args.category);
    }

    return templates.sort((a, b) => b.usageCount - a.usageCount);
  },
});

// Get a single template by ID
export const getById = query({
  args: { templateId: v.id("courseTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

// Increment usage count when a template is used
export const recordUsage = mutation({
  args: { templateId: v.id("courseTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (template) {
      await ctx.db.patch(args.templateId, {
        usageCount: template.usageCount + 1,
      });
    }
  },
});

// Save a course as a template (org admins only)
export const saveFromCourse = mutation({
  args: {
    courseId: v.id("courses"),
    orgId: v.id("organizations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    const modules = await ctx.db
      .query("modules")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    const lessonsPerModule = modules.length > 0
      ? Math.round(lessons.length / modules.length)
      : 3;

    return await ctx.db.insert("courseTemplates", {
      title: course.title,
      description: course.description,
      category: "custom",
      icon: "FileText",
      difficulty: course.difficulty,
      estimatedDuration: course.estimatedDuration,
      moduleCount: modules.length,
      lessonCount: lessons.length,
      tags: [course.industry.toLowerCase(), course.difficulty],
      formData: {
        courseTitle: course.title,
        courseDescription: course.description,
        industry: course.industry,
        targetAudience: course.targetAudience,
        difficultyLevel: course.difficulty,
        numModules: String(modules.length),
        lessonsPerModule: String(lessonsPerModule),
        additionalInstructions: "",
      },
      isSystem: false,
      createdBy: args.userId,
      orgId: args.orgId,
      usageCount: 0,
      createdAt: Date.now(),
    });
  },
});

// Delete an org template (not system templates)
export const remove = mutation({
  args: { templateId: v.id("courseTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");
    if (template.isSystem) throw new Error("Cannot delete system templates");
    await ctx.db.delete(args.templateId);
  },
});

// Seed system templates
export const seedSystemTemplates = mutation({
  args: {
    templates: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        category: v.string(),
        icon: v.string(),
        difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
        estimatedDuration: v.string(),
        moduleCount: v.number(),
        lessonCount: v.number(),
        tags: v.array(v.string()),
        formData: v.object({
          courseTitle: v.string(),
          courseDescription: v.string(),
          industry: v.string(),
          targetAudience: v.string(),
          difficultyLevel: v.string(),
          numModules: v.string(),
          lessonsPerModule: v.string(),
          additionalInstructions: v.string(),
        }),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if already seeded
    const existing = await ctx.db
      .query("courseTemplates")
      .withIndex("by_system", (q) => q.eq("isSystem", true))
      .first();

    if (existing) return { seeded: false, message: "Already seeded" };

    for (const template of args.templates) {
      await ctx.db.insert("courseTemplates", {
        ...template,
        isSystem: true,
        usageCount: 0,
        createdAt: Date.now(),
      });
    }

    return { seeded: true, count: args.templates.length };
  },
});

// Check if system templates have been seeded
export const isSeeded = query({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("courseTemplates")
      .withIndex("by_system", (q) => q.eq("isSystem", true))
      .first();
    return !!existing;
  },
});

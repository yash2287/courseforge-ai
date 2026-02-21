import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add a module to a course
export const create = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.string(),
    description: v.string(),
    order: v.number(),
    estimatedDuration: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("modules", args);
  },
});

// Batch create modules
export const batchCreate = mutation({
  args: {
    modules: v.array(
      v.object({
        courseId: v.id("courses"),
        title: v.string(),
        description: v.string(),
        order: v.number(),
        estimatedDuration: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const module of args.modules) {
      const id = await ctx.db.insert("modules", module);
      ids.push(id);
    }
    return ids;
  },
});

// Update a module
export const update = mutation({
  args: {
    moduleId: v.id("modules"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    estimatedDuration: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { moduleId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(moduleId, filtered);
  },
});

// Reorder modules within a course
export const reorder = mutation({
  args: {
    moduleIds: v.array(v.id("modules")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.moduleIds.length; i++) {
      await ctx.db.patch(args.moduleIds[i], { order: i });
    }
  },
});

// Delete a module and its lessons
export const remove = mutation({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .collect();
    for (const lesson of lessons) {
      await ctx.db.delete(lesson._id);
    }
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .collect();
    for (const quiz of quizzes) {
      await ctx.db.delete(quiz._id);
    }
    await ctx.db.delete(args.moduleId);
  },
});

// Get module by ID
export const getById = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.moduleId);
  },
});

export const getByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    return modules.sort((a, b) => a.order - b.order);
  },
});

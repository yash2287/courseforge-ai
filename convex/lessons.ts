import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a lesson
export const create = mutation({
  args: {
    moduleId: v.id("modules"),
    courseId: v.id("courses"),
    title: v.string(),
    content: v.string(),
    keyTakeaways: v.array(v.string()),
    order: v.number(),
    estimatedDuration: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("lessons", args);
  },
});

// Batch create lessons
export const batchCreate = mutation({
  args: {
    lessons: v.array(
      v.object({
        moduleId: v.id("modules"),
        courseId: v.id("courses"),
        title: v.string(),
        content: v.string(),
        keyTakeaways: v.array(v.string()),
        order: v.number(),
        estimatedDuration: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const lesson of args.lessons) {
      const id = await ctx.db.insert("lessons", lesson);
      ids.push(id);
    }
    return ids;
  },
});

// Get a single lesson
export const getById = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.lessonId);
  },
});

export const getByModule = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .collect();
    return lessons.sort((a, b) => a.order - b.order);
  },
});

// Update a lesson
export const update = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    keyTakeaways: v.optional(v.array(v.string())),
    estimatedDuration: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { lessonId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(lessonId, filtered);
  },
});

// Reorder lessons within a module
export const reorder = mutation({
  args: {
    lessonIds: v.array(v.id("lessons")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.lessonIds.length; i++) {
      await ctx.db.patch(args.lessonIds[i], { order: i });
    }
  },
});

// Delete a lesson
export const remove = mutation({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    // Delete associated quizzes
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();
    for (const quiz of quizzes) {
      await ctx.db.delete(quiz._id);
    }
    await ctx.db.delete(args.lessonId);
  },
});

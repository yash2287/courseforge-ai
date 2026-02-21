import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get chat history for a user in a course
export const getHistory = query({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .order("asc")
      .take(limit);
  },
});

// Save a chat message
export const saveMessage = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    lessonId: v.optional(v.id("lessons")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessages", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Clear chat history
export const clearHistory = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
  },
});

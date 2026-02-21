import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a quiz
export const create = mutation({
  args: {
    courseId: v.id("courses"),
    moduleId: v.optional(v.id("modules")),
    lessonId: v.optional(v.id("lessons")),
    title: v.string(),
    type: v.union(v.literal("lesson"), v.literal("module"), v.literal("final")),
    passingScore: v.number(),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctAnswer: v.number(),
        explanation: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("quizzes", args);
  },
});

// Batch create quizzes
export const batchCreate = mutation({
  args: {
    quizzes: v.array(
      v.object({
        courseId: v.id("courses"),
        moduleId: v.optional(v.id("modules")),
        lessonId: v.optional(v.id("lessons")),
        title: v.string(),
        type: v.union(v.literal("lesson"), v.literal("module"), v.literal("final")),
        passingScore: v.number(),
        questions: v.array(
          v.object({
            question: v.string(),
            options: v.array(v.string()),
            correctAnswer: v.number(),
            explanation: v.string(),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const quiz of args.quizzes) {
      const id = await ctx.db.insert("quizzes", quiz);
      ids.push(id);
    }
    return ids;
  },
});

// Get quizzes for a course
export const getByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

// Update a quiz
export const update = mutation({
  args: {
    quizId: v.id("quizzes"),
    title: v.optional(v.string()),
    passingScore: v.optional(v.number()),
    questions: v.optional(v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctAnswer: v.number(),
        explanation: v.string(),
      })
    )),
  },
  handler: async (ctx, args) => {
    const { quizId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(quizId, filtered);
  },
});

// Delete a quiz
export const remove = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    // Delete associated attempts
    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();
    for (const attempt of attempts) {
      await ctx.db.delete(attempt._id);
    }
    await ctx.db.delete(args.quizId);
  },
});

// Get quiz by lesson
export const getByLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizzes")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .first();
  },
});

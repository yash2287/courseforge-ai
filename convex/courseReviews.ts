import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get reviews for a course
export const getByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("courseReviews")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    // Calculate stats
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
      reviews,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    };
  },
});

// Get a user's review for a course
export const getUserReview = query({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courseReviews")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();
  },
});

// Submit or update a review
export const submit = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    rating: v.number(),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const existing = await ctx.db
      .query("courseReviews")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        rating: args.rating,
        feedback: args.feedback,
      });
      return existing._id;
    }

    return await ctx.db.insert("courseReviews", {
      userId: args.userId,
      courseId: args.courseId,
      rating: args.rating,
      feedback: args.feedback,
      createdAt: Date.now(),
    });
  },
});

// Delete a review
export const remove = mutation({
  args: { reviewId: v.id("courseReviews") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.reviewId);
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getState = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("onboardingState")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
  },
});

export const createOrUpdate = mutation({
  args: {
    currentStep: v.number(),
    completedSteps: v.array(v.string()),
    role: v.optional(v.string()),
    companyName: v.optional(v.string()),
    companySize: v.optional(v.string()),
    industry: v.optional(v.string()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("onboardingState")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        currentStep: args.currentStep,
        completedSteps: args.completedSteps,
        role: args.role ?? existing.role,
        companyName: args.companyName ?? existing.companyName,
        companySize: args.companySize ?? existing.companySize,
        industry: args.industry ?? existing.industry,
        completed: args.completed ?? existing.completed,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("onboardingState", {
        userId: identity.subject,
        currentStep: args.currentStep,
        completedSteps: args.completedSteps,
        role: args.role,
        companyName: args.companyName,
        companySize: args.companySize,
        industry: args.industry,
        completed: args.completed ?? false,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const skip = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("onboardingState")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: true,
        skippedAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("onboardingState", {
        userId: identity.subject,
        currentStep: 0,
        completedSteps: [],
        completed: true,
        skippedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

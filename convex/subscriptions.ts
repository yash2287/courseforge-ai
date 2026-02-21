import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get subscription for an organization
export const getByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    return sub;
  },
});

// Get subscription for the current user's org (by user)
export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return subs;
  },
});

// Create a free subscription for a new org
export const createFreeSubscription = mutation({
  args: {
    orgId: v.id("organizations"),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if subscription already exists
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (existing) return existing._id;

    const now = Date.now();
    return await ctx.db.insert("subscriptions", {
      orgId: args.orgId,
      userId: identity.subject,
      stripeCustomerId: args.stripeCustomerId,
      planId: "free",
      billingInterval: "monthly",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update subscription after Stripe webhook
export const updateFromStripe = mutation({
  args: {
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    planId: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("professional"),
      v.literal("enterprise")
    ),
    billingInterval: v.union(v.literal("monthly"), v.literal("annual")),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("incomplete"),
      v.literal("unpaid")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();

    if (!sub) {
      throw new Error(
        `No subscription found for Stripe customer: ${args.stripeCustomerId}`
      );
    }

    await ctx.db.patch(sub._id, {
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      planId: args.planId,
      billingInterval: args.billingInterval,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd ?? false,
      updatedAt: Date.now(),
    });
  },
});

// Cancel subscription (mark for end of period)
export const cancelSubscription = mutation({
  args: {
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();

    if (!sub) return;

    await ctx.db.patch(sub._id, {
      cancelAtPeriodEnd: true,
      updatedAt: Date.now(),
    });
  },
});

// Get usage for an org
export const getUsage = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const records = await ctx.db
      .query("usageRecords")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    return records;
  },
});

// Increment usage counter
export const incrementUsage = mutation({
  args: {
    orgId: v.id("organizations"),
    metric: v.union(
      v.literal("courses_created"),
      v.literal("members_added"),
      v.literal("ai_generations"),
      v.literal("orgs_created")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Get current billing period (approximate: start of month)
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const existing = await ctx.db
      .query("usageRecords")
      .withIndex("by_org_metric_period", (q) =>
        q
          .eq("orgId", args.orgId)
          .eq("metric", args.metric)
          .gte("periodStart", periodStart.getTime())
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
    } else {
      await ctx.db.insert("usageRecords", {
        orgId: args.orgId,
        metric: args.metric,
        count: 1,
        periodStart: periodStart.getTime(),
        periodEnd: periodEnd.getTime(),
      });
    }
  },
});

// Check if usage is within plan limits
export const checkUsageLimit = query({
  args: {
    orgId: v.id("organizations"),
    metric: v.union(
      v.literal("courses_created"),
      v.literal("members_added"),
      v.literal("ai_generations"),
      v.literal("orgs_created")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get subscription
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    const planId = sub?.planId ?? "free";

    // Get current usage
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    const usage = await ctx.db
      .query("usageRecords")
      .withIndex("by_org_metric_period", (q) =>
        q
          .eq("orgId", args.orgId)
          .eq("metric", args.metric)
          .gte("periodStart", periodStart.getTime())
      )
      .first();

    const currentCount = usage?.count ?? 0;

    // Plan limits mapping
    const limitMap: Record<string, Record<string, number>> = {
      free: { courses_created: 2, members_added: 1, ai_generations: 5, orgs_created: 1 },
      starter: { courses_created: 20, members_added: 10, ai_generations: 50, orgs_created: 5 },
      professional: { courses_created: -1, members_added: 50, ai_generations: -1, orgs_created: -1 },
      enterprise: { courses_created: -1, members_added: -1, ai_generations: -1, orgs_created: -1 },
    };

    const limit = limitMap[planId]?.[args.metric] ?? 0;
    const withinLimit = limit === -1 || currentCount < limit;

    return {
      planId,
      metric: args.metric,
      currentCount,
      limit,
      withinLimit,
    };
  },
});

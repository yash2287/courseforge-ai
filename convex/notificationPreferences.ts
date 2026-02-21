import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get notification preferences for a user
export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Return defaults if no preferences saved
    if (!prefs) {
      return {
        userId: args.userId,
        emailAssignments: true,
        emailReminders: true,
        emailCompletions: true,
        emailDigest: true,
      };
    }

    return prefs;
  },
});

// Update notification preferences
export const update = mutation({
  args: {
    userId: v.string(),
    emailAssignments: v.boolean(),
    emailReminders: v.boolean(),
    emailCompletions: v.boolean(),
    emailDigest: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        emailAssignments: args.emailAssignments,
        emailReminders: args.emailReminders,
        emailCompletions: args.emailCompletions,
        emailDigest: args.emailDigest,
      });
      return existing._id;
    }

    return await ctx.db.insert("notificationPreferences", {
      userId: args.userId,
      emailAssignments: args.emailAssignments,
      emailReminders: args.emailReminders,
      emailCompletions: args.emailCompletions,
      emailDigest: args.emailDigest,
    });
  },
});

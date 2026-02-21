import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get notifications for a user
export const getByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get unread count
export const getUnreadCount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();
    return unread.length;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

// Mark all notifications as read for a user
export const markAllAsRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();
    for (const notification of unread) {
      await ctx.db.patch(notification._id, { read: true });
    }
  },
});

// Create a notification
export const create = mutation({
  args: {
    userId: v.string(),
    orgId: v.optional(v.id("organizations")),
    type: v.union(
      v.literal("course_assigned"),
      v.literal("course_completed"),
      v.literal("deadline_reminder"),
      v.literal("certificate_earned"),
      v.literal("org_invite"),
      v.literal("general")
    ),
    title: v.string(),
    message: v.string(),
    linkUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      read: false,
      createdAt: Date.now(),
    });
  },
});

// Create notifications for multiple users
export const notifyMany = mutation({
  args: {
    userIds: v.array(v.string()),
    orgId: v.optional(v.id("organizations")),
    type: v.union(
      v.literal("course_assigned"),
      v.literal("course_completed"),
      v.literal("deadline_reminder"),
      v.literal("certificate_earned"),
      v.literal("org_invite"),
      v.literal("general")
    ),
    title: v.string(),
    message: v.string(),
    linkUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userIds, ...rest } = args;
    for (const userId of userIds) {
      await ctx.db.insert("notifications", {
        userId,
        ...rest,
        read: false,
        createdAt: Date.now(),
      });
    }
  },
});

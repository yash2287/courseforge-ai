import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all members of an organization
export const getByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orgMembers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

// Get a single membership
export const getMembership = query({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.userId)
      )
      .first();
  },
});

// Get user's role in an organization
export const getRole = query({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.userId)
      )
      .first();

    return membership?.role ?? null;
  },
});

// Update a member's role
export const updateRole = mutation({
  args: {
    orgId: v.id("organizations"),
    targetUserId: v.string(),
    newRole: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("learner")
    ),
    callerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify caller is owner or admin
    const callerMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.callerUserId)
      )
      .first();

    if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
      throw new Error("Only owners and admins can change member roles");
    }

    // Find target membership
    const targetMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.targetUserId)
      )
      .first();

    if (!targetMembership) {
      throw new Error("Member not found");
    }

    if (targetMembership.role === "owner") {
      throw new Error("Cannot change the owner's role");
    }

    await ctx.db.patch(targetMembership._id, { role: args.newRole });
  },
});

// Remove a member from the organization
export const removeMember = mutation({
  args: {
    orgId: v.id("organizations"),
    targetUserId: v.string(),
    callerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const targetMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.targetUserId)
      )
      .first();

    if (!targetMembership) {
      throw new Error("Member not found");
    }

    if (targetMembership.role === "owner") {
      throw new Error("Cannot remove the organization owner");
    }

    // Allow self-leave or admin/owner action
    const isSelf = args.callerUserId === args.targetUserId;
    if (!isSelf) {
      const callerMembership = await ctx.db
        .query("orgMembers")
        .withIndex("by_org_user", (q) =>
          q.eq("orgId", args.orgId).eq("userId", args.callerUserId)
        )
        .first();

      if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
        throw new Error("Only owners and admins can remove members");
      }
    }

    // Delete member
    await ctx.db.delete(targetMembership._id);

    // Delete their course assignments in this org
    const assignments = await ctx.db
      .query("courseAssignments")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.targetUserId)
      )
      .collect();

    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }
  },
});

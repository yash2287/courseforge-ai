import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all departments for an organization
export const getByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const departments = await ctx.db
      .query("departments")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Enrich with member counts and manager info
    const enriched = await Promise.all(
      departments.map(async (dept) => {
        const members = await ctx.db
          .query("orgMembers")
          .withIndex("by_department", (q) => q.eq("departmentId", dept._id))
          .collect();

        let managerName: string | undefined;
        if (dept.managerId) {
          const manager = await ctx.db
            .query("orgMembers")
            .withIndex("by_org_user", (q) =>
              q.eq("orgId", args.orgId).eq("userId", dept.managerId!)
            )
            .first();
          managerName = manager?.name ?? manager?.email;
        }

        return {
          ...dept,
          memberCount: members.length,
          managerName,
        };
      })
    );

    return enriched;
  },
});

// Get members in a department
export const getMembers = query({
  args: { departmentId: v.id("departments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orgMembers")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .collect();
  },
});

// Create a department
export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    managerId: v.optional(v.string()),
    parentDepartmentId: v.optional(v.id("departments")),
    callerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check caller is admin/owner
    const caller = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.callerUserId)
      )
      .first();

    if (!caller || !["owner", "admin"].includes(caller.role)) {
      throw new Error("Only owners and admins can create departments");
    }

    return await ctx.db.insert("departments", {
      orgId: args.orgId,
      name: args.name,
      description: args.description,
      managerId: args.managerId,
      parentDepartmentId: args.parentDepartmentId,
      createdAt: Date.now(),
    });
  },
});

// Update a department
export const update = mutation({
  args: {
    departmentId: v.id("departments"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    managerId: v.optional(v.string()),
    callerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const dept = await ctx.db.get(args.departmentId);
    if (!dept) throw new Error("Department not found");

    const caller = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", dept.orgId).eq("userId", args.callerUserId)
      )
      .first();

    if (!caller || !["owner", "admin"].includes(caller.role)) {
      throw new Error("Only owners and admins can update departments");
    }

    const updates: Record<string, any> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.managerId !== undefined) updates.managerId = args.managerId;

    await ctx.db.patch(args.departmentId, updates);
  },
});

// Delete a department (unassigns all members from it)
export const remove = mutation({
  args: {
    departmentId: v.id("departments"),
    callerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const dept = await ctx.db.get(args.departmentId);
    if (!dept) throw new Error("Department not found");

    const caller = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", dept.orgId).eq("userId", args.callerUserId)
      )
      .first();

    if (!caller || !["owner", "admin"].includes(caller.role)) {
      throw new Error("Only owners and admins can delete departments");
    }

    // Unassign all members from this department
    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .collect();

    for (const member of members) {
      await ctx.db.patch(member._id, { departmentId: undefined });
    }

    // Delete child departments
    const children = await ctx.db
      .query("departments")
      .withIndex("by_parent", (q) => q.eq("parentDepartmentId", args.departmentId))
      .collect();

    for (const child of children) {
      await ctx.db.patch(child._id, { parentDepartmentId: undefined });
    }

    await ctx.db.delete(args.departmentId);
  },
});

// Assign a member to a department
export const assignMember = mutation({
  args: {
    memberId: v.id("orgMembers"),
    departmentId: v.optional(v.id("departments")),
    callerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    const caller = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", member.orgId).eq("userId", args.callerUserId)
      )
      .first();

    if (!caller || !["owner", "admin", "manager"].includes(caller.role)) {
      throw new Error("Only owners, admins, and managers can assign departments");
    }

    await ctx.db.patch(args.memberId, { departmentId: args.departmentId });
  },
});

// Bulk assign members to a department
export const bulkAssignMembers = mutation({
  args: {
    memberIds: v.array(v.id("orgMembers")),
    departmentId: v.id("departments"),
    callerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify permissions once
    if (args.memberIds.length === 0) return 0;

    const firstMember = await ctx.db.get(args.memberIds[0]);
    if (!firstMember) throw new Error("Member not found");

    const caller = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", firstMember.orgId).eq("userId", args.callerUserId)
      )
      .first();

    if (!caller || !["owner", "admin", "manager"].includes(caller.role)) {
      throw new Error("Only owners, admins, and managers can assign departments");
    }

    for (const memberId of args.memberIds) {
      await ctx.db.patch(memberId, { departmentId: args.departmentId });
    }

    return args.memberIds.length;
  },
});

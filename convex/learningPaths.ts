import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all learning paths for an org
export const getByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const paths = await ctx.db
      .query("learningPaths")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const enriched = await Promise.all(
      paths.map(async (path) => {
        // Get course details
        const courses = await Promise.all(
          path.courseIds.map(async (courseId) => {
            const course = await ctx.db.get(courseId);
            return course
              ? { _id: course._id, title: course.title, difficulty: course.difficulty }
              : null;
          })
        );

        // Count assignments
        const assignments = await ctx.db
          .query("learningPathAssignments")
          .withIndex("by_path", (q) => q.eq("pathId", path._id))
          .collect();

        const completedCount = assignments.filter((a) => a.status === "completed").length;

        return {
          ...path,
          courses: courses.filter(Boolean),
          assignedCount: assignments.length,
          completedCount,
        };
      })
    );

    return enriched;
  },
});

// Get a single learning path with full details
export const getById = query({
  args: { pathId: v.id("learningPaths") },
  handler: async (ctx, args) => {
    const path = await ctx.db.get(args.pathId);
    if (!path) return null;

    const courses = await Promise.all(
      path.courseIds.map(async (courseId) => {
        const course = await ctx.db.get(courseId);
        return course;
      })
    );

    return {
      ...path,
      courses: courses.filter(Boolean),
    };
  },
});

// Get learning path assignments for a user
export const getAssignmentsByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("learningPathAssignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const path = await ctx.db.get(assignment.pathId);
        if (!path) return null;

        // Calculate progress across all courses in path
        let totalProgress = 0;
        for (const courseId of path.courseIds) {
          const progress = await ctx.db
            .query("userProgress")
            .withIndex("by_user_course", (q) =>
              q.eq("userId", args.userId).eq("courseId", courseId)
            )
            .first();
          totalProgress += progress?.overallProgress ?? 0;
        }

        const avgProgress = path.courseIds.length > 0
          ? Math.round(totalProgress / path.courseIds.length)
          : 0;

        return {
          ...assignment,
          pathTitle: path.title,
          pathDescription: path.description,
          courseCount: path.courseIds.length,
          progress: avgProgress,
        };
      })
    );

    return enriched.filter(Boolean);
  },
});

// Create a learning path
export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    courseIds: v.array(v.id("courses")),
    callerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.callerUserId)
      )
      .first();

    if (!caller || !["owner", "admin", "manager"].includes(caller.role)) {
      throw new Error("Only owners, admins, and managers can create learning paths");
    }

    return await ctx.db.insert("learningPaths", {
      orgId: args.orgId,
      title: args.title,
      description: args.description,
      courseIds: args.courseIds,
      status: "draft",
      createdBy: args.callerUserId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update a learning path
export const update = mutation({
  args: {
    pathId: v.id("learningPaths"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    courseIds: v.optional(v.array(v.id("courses"))),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.courseIds !== undefined) updates.courseIds = args.courseIds;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.pathId, updates);
  },
});

// Delete a learning path
export const remove = mutation({
  args: { pathId: v.id("learningPaths") },
  handler: async (ctx, args) => {
    // Delete all assignments for this path
    const assignments = await ctx.db
      .query("learningPathAssignments")
      .withIndex("by_path", (q) => q.eq("pathId", args.pathId))
      .collect();

    for (const a of assignments) {
      await ctx.db.delete(a._id);
    }

    await ctx.db.delete(args.pathId);
  },
});

// Assign a learning path to a user
export const assignToUser = mutation({
  args: {
    pathId: v.id("learningPaths"),
    orgId: v.id("organizations"),
    userId: v.string(),
    assignedBy: v.string(),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check for existing assignment
    const existing = await ctx.db
      .query("learningPathAssignments")
      .withIndex("by_path_user", (q) =>
        q.eq("pathId", args.pathId).eq("userId", args.userId)
      )
      .first();

    if (existing) throw new Error("This learning path is already assigned to this user");

    return await ctx.db.insert("learningPathAssignments", {
      pathId: args.pathId,
      orgId: args.orgId,
      userId: args.userId,
      assignedBy: args.assignedBy,
      dueDate: args.dueDate,
      status: "assigned",
      assignedAt: Date.now(),
    });
  },
});

// Assign learning path to all org members
export const assignToAll = mutation({
  args: {
    pathId: v.id("learningPaths"),
    orgId: v.id("organizations"),
    assignedBy: v.string(),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const existingAssignments = await ctx.db
      .query("learningPathAssignments")
      .withIndex("by_path", (q) => q.eq("pathId", args.pathId))
      .collect();

    const assignedUserIds = new Set(existingAssignments.map((a) => a.userId));
    let count = 0;

    for (const member of members) {
      if (!assignedUserIds.has(member.userId)) {
        await ctx.db.insert("learningPathAssignments", {
          pathId: args.pathId,
          orgId: args.orgId,
          userId: member.userId,
          assignedBy: args.assignedBy,
          dueDate: args.dueDate,
          status: "assigned",
          assignedAt: Date.now(),
        });
        count++;
      }
    }

    return count;
  },
});

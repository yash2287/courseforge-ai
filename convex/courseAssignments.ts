import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Get all assignments for an organization
export const getByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("courseAssignments")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Attach course title and user info
    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const course = await ctx.db.get(assignment.courseId);
        const member = await ctx.db
          .query("orgMembers")
          .withIndex("by_org_user", (q) =>
            q.eq("orgId", args.orgId).eq("userId", assignment.userId)
          )
          .first();

        return {
          ...assignment,
          courseTitle: course?.title ?? "Unknown Course",
          userName: member?.name ?? member?.email ?? "Unknown",
          userEmail: member?.email ?? "",
        };
      })
    );

    return enriched;
  },
});

// Get assignments for a specific user in an org
export const getByOrgUser = query({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("courseAssignments")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.userId)
      )
      .collect();

    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const course = await ctx.db.get(assignment.courseId);
        const progress = await ctx.db
          .query("userProgress")
          .withIndex("by_user_course", (q) =>
            q.eq("userId", args.userId).eq("courseId", assignment.courseId)
          )
          .first();

        return {
          ...assignment,
          courseTitle: course?.title ?? "Unknown Course",
          courseDescription: course?.description ?? "",
          courseDifficulty: course?.difficulty,
          courseStatus: course?.status,
          progress: progress?.overallProgress ?? 0,
        };
      })
    );

    return enriched;
  },
});

// Get all assignments for a specific course in an org
export const getByOrgCourse = query({
  args: {
    orgId: v.id("organizations"),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("courseAssignments")
      .withIndex("by_org_course", (q) =>
        q.eq("orgId", args.orgId).eq("courseId", args.courseId)
      )
      .collect();

    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const member = await ctx.db
          .query("orgMembers")
          .withIndex("by_org_user", (q) =>
            q.eq("orgId", args.orgId).eq("userId", assignment.userId)
          )
          .first();

        const progress = await ctx.db
          .query("userProgress")
          .withIndex("by_user_course", (q) =>
            q.eq("userId", assignment.userId).eq("courseId", args.courseId)
          )
          .first();

        return {
          ...assignment,
          userName: member?.name ?? member?.email ?? "Unknown",
          userEmail: member?.email ?? "",
          userRole: member?.role,
          progress: progress?.overallProgress ?? 0,
        };
      })
    );

    return enriched;
  },
});

// Get all assignments for a user across all orgs
export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("courseAssignments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const course = await ctx.db.get(assignment.courseId);
        const org = await ctx.db.get(assignment.orgId);
        const progress = await ctx.db
          .query("userProgress")
          .withIndex("by_user_course", (q) =>
            q.eq("userId", args.userId).eq("courseId", assignment.courseId)
          )
          .first();

        return {
          ...assignment,
          courseTitle: course?.title ?? "Unknown Course",
          courseDescription: course?.description ?? "",
          courseDifficulty: course?.difficulty,
          orgName: org?.name ?? "Unknown",
          progress: progress?.overallProgress ?? 0,
        };
      })
    );

    return enriched;
  },
});

// Assign a course to a specific user
export const assignToUser = mutation({
  args: {
    orgId: v.id("organizations"),
    courseId: v.id("courses"),
    userId: v.string(),
    assignedBy: v.string(),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check caller is admin/manager/owner
    const callerMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.assignedBy)
      )
      .first();

    if (!callerMembership || !["owner", "admin", "manager"].includes(callerMembership.role)) {
      throw new Error("Only owners, admins, and managers can assign courses");
    }

    // Check for duplicate assignment
    const existing = await ctx.db
      .query("courseAssignments")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.userId)
      )
      .collect();

    const duplicate = existing.find((a) => a.courseId === args.courseId);
    if (duplicate) {
      throw new Error("This course is already assigned to this user");
    }

    const assignmentId = await ctx.db.insert("courseAssignments", {
      orgId: args.orgId,
      courseId: args.courseId,
      userId: args.userId,
      assignedBy: args.assignedBy,
      dueDate: args.dueDate,
      status: "assigned",
      assignedAt: Date.now(),
      completedAt: undefined,
    });

    // Create notification for the assigned user
    const course = await ctx.db.get(args.courseId);
    const org = await ctx.db.get(args.orgId);
    if (course && org) {
      const dueDateStr = args.dueDate
        ? ` Due ${new Date(args.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.`
        : '';
      await ctx.db.insert("notifications", {
        userId: args.userId,
        orgId: args.orgId,
        type: "course_assigned",
        title: `New course: ${course.title}`,
        message: `You've been assigned "${course.title}" by ${org.name}.${dueDateStr}`,
        linkUrl: `/courses/${args.courseId}`,
        read: false,
        createdAt: Date.now(),
      });

      // Schedule email notification
      const member = await ctx.db
        .query("orgMembers")
        .withIndex("by_org_user", (q) =>
          q.eq("orgId", args.orgId).eq("userId", args.userId)
        )
        .first();

      if (member) {
        await ctx.scheduler.runAfter(0, api.emails.sendEmail, {
          type: "course_assigned",
          to: member.email,
          data: {
            userName: member.name ?? member.email,
            courseTitle: course.title,
            orgName: org.name,
            dueDate: args.dueDate
              ? new Date(args.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : undefined,
            courseUrl: `/courses/${args.courseId}`,
          },
        });
      }

      // Dispatch webhook event
      await ctx.scheduler.runAfter(0, internal.webhooks.dispatchEvent, {
        orgId: args.orgId,
        event: "course.assigned",
        payload: JSON.stringify({
          event: "course.assigned",
          timestamp: new Date().toISOString(),
          data: {
            assignmentId,
            courseId: args.courseId,
            courseTitle: course.title,
            userId: args.userId,
            assignedBy: args.assignedBy,
            dueDate: args.dueDate ?? null,
          },
        }),
      });
    }

    return assignmentId;
  },
});

// Assign a course to all org members
export const assignToAll = mutation({
  args: {
    orgId: v.id("organizations"),
    courseId: v.id("courses"),
    assignedBy: v.string(),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check caller is admin/manager/owner
    const callerMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.assignedBy)
      )
      .first();

    if (!callerMembership || !["owner", "admin", "manager"].includes(callerMembership.role)) {
      throw new Error("Only owners, admins, and managers can assign courses");
    }

    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const existingAssignments = await ctx.db
      .query("courseAssignments")
      .withIndex("by_org_course", (q) =>
        q.eq("orgId", args.orgId).eq("courseId", args.courseId)
      )
      .collect();

    const assignedUserIds = new Set(existingAssignments.map((a) => a.userId));
    let count = 0;

    for (const member of members) {
      if (!assignedUserIds.has(member.userId)) {
        await ctx.db.insert("courseAssignments", {
          orgId: args.orgId,
          courseId: args.courseId,
          userId: member.userId,
          assignedBy: args.assignedBy,
          dueDate: args.dueDate,
          status: "assigned",
          assignedAt: Date.now(),
          completedAt: undefined,
        });
        count++;
      }
    }

    return count;
  },
});

// Update assignment status
export const updateStatus = mutation({
  args: {
    assignmentId: v.id("courseAssignments"),
    status: v.union(
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("overdue")
    ),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, any> = { status: args.status };
    if (args.status === "completed") {
      updates.completedAt = Date.now();
    }
    await ctx.db.patch(args.assignmentId, updates);
  },
});

// Remove an assignment
export const removeAssignment = mutation({
  args: {
    assignmentId: v.id("courseAssignments"),
    callerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    // Verify caller is admin/manager/owner
    const callerMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", assignment.orgId).eq("userId", args.callerUserId)
      )
      .first();

    if (!callerMembership || !["owner", "admin", "manager"].includes(callerMembership.role)) {
      throw new Error("Only owners, admins, and managers can remove assignments");
    }

    await ctx.db.delete(args.assignmentId);
  },
});

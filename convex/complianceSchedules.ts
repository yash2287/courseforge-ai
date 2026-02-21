import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all compliance schedules for an org
export const getByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const schedules = await ctx.db
      .query("complianceSchedules")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Enrich with course info and status
    const enriched = await Promise.all(
      schedules.map(async (schedule) => {
        const course = await ctx.db.get(schedule.courseId);

        // Get all assignments for this course in the org
        const assignments = await ctx.db
          .query("courseAssignments")
          .withIndex("by_org_course", (q) =>
            q.eq("orgId", args.orgId).eq("courseId", schedule.courseId)
          )
          .collect();

        // Get certificates for this course
        const orgMembers = await ctx.db
          .query("orgMembers")
          .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
          .collect();

        const now = Date.now();
        const periodMs = schedule.recertificationPeriodDays * 24 * 60 * 60 * 1000;

        let compliant = 0;
        let expiringSoon = 0;
        let expired = 0;
        let notCertified = 0;

        for (const member of orgMembers) {
          const certs = await ctx.db
            .query("certificates")
            .withIndex("by_user_course", (q) =>
              q.eq("userId", member.userId).eq("courseId", schedule.courseId)
            )
            .collect();

          if (certs.length === 0) {
            notCertified++;
            continue;
          }

          // Get most recent certificate
          const latestCert = certs.sort((a, b) => b.completionDate - a.completionDate)[0];
          const expiresAt = latestCert.completionDate + periodMs;
          const daysUntilExpiry = Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000));

          if (daysUntilExpiry <= 0) {
            expired++;
          } else if (daysUntilExpiry <= 30) {
            expiringSoon++;
          } else {
            compliant++;
          }
        }

        return {
          ...schedule,
          courseTitle: course?.title ?? "Unknown Course",
          courseCategory: course?.complianceCategory,
          totalMembers: orgMembers.length,
          compliant,
          expiringSoon,
          expired,
          notCertified,
        };
      })
    );

    return enriched;
  },
});

// Create a compliance schedule
export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    courseId: v.id("courses"),
    recertificationPeriodDays: v.number(),
    autoReassign: v.boolean(),
    reminderDaysBefore: v.array(v.number()),
    callerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.callerUserId)
      )
      .first();

    if (!caller || !["owner", "admin"].includes(caller.role)) {
      throw new Error("Only owners and admins can manage compliance schedules");
    }

    // Check for duplicate
    const existing = await ctx.db
      .query("complianceSchedules")
      .withIndex("by_org_course", (q) =>
        q.eq("orgId", args.orgId).eq("courseId", args.courseId)
      )
      .first();

    if (existing) throw new Error("A compliance schedule already exists for this course");

    return await ctx.db.insert("complianceSchedules", {
      orgId: args.orgId,
      courseId: args.courseId,
      recertificationPeriodDays: args.recertificationPeriodDays,
      autoReassign: args.autoReassign,
      reminderDaysBefore: args.reminderDaysBefore,
      createdAt: Date.now(),
    });
  },
});

// Update a compliance schedule
export const update = mutation({
  args: {
    scheduleId: v.id("complianceSchedules"),
    recertificationPeriodDays: v.optional(v.number()),
    autoReassign: v.optional(v.boolean()),
    reminderDaysBefore: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, any> = {};
    if (args.recertificationPeriodDays !== undefined) updates.recertificationPeriodDays = args.recertificationPeriodDays;
    if (args.autoReassign !== undefined) updates.autoReassign = args.autoReassign;
    if (args.reminderDaysBefore !== undefined) updates.reminderDaysBefore = args.reminderDaysBefore;

    await ctx.db.patch(args.scheduleId, updates);
  },
});

// Remove a compliance schedule
export const remove = mutation({
  args: { scheduleId: v.id("complianceSchedules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.scheduleId);
  },
});

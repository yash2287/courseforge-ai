import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Issue a certificate
export const issue = mutation({
  args: {
    userId: v.string(),
    userName: v.string(),
    courseId: v.id("courses"),
    courseTitle: v.string(),
    companyName: v.string(),
    finalScore: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if certificate already exists
    const existing = await ctx.db
      .query("certificates")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();

    if (existing) return existing._id;

    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const certDocId = await ctx.db.insert("certificates", {
      ...args,
      completionDate: Date.now(),
      certificateId,
    });

    // Create notification for the user
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "certificate_earned",
      title: `Certificate earned!`,
      message: `You earned a certificate for "${args.courseTitle}" with a score of ${args.finalScore}%.`,
      linkUrl: `/courses/${args.courseId}/certificate`,
      read: false,
      createdAt: Date.now(),
    });

    // Notify org managers/admins via email about completion
    const course = await ctx.db.get(args.courseId);
    if (course?.orgId) {
      const org = await ctx.db.get(course.orgId);
      const managers = await ctx.db
        .query("orgMembers")
        .withIndex("by_org", (q) => q.eq("orgId", course.orgId!))
        .collect();

      const adminManagers = managers.filter((m) =>
        ["owner", "admin", "manager"].includes(m.role)
      );

      for (const manager of adminManagers) {
        await ctx.scheduler.runAfter(0, api.emails.sendEmail, {
          type: "course_completed",
          to: manager.email,
          data: {
            managerName: manager.name ?? manager.email,
            memberName: args.userName,
            courseTitle: args.courseTitle,
            score: args.finalScore,
            orgName: org?.name ?? args.companyName,
            dashboardUrl: `/org/${org?.slug}/analytics`,
          },
        });
      }

      // Dispatch webhook event
      await ctx.scheduler.runAfter(0, internal.webhooks.dispatchEvent, {
        orgId: course.orgId!,
        event: "certificate.issued",
        payload: JSON.stringify({
          event: "certificate.issued",
          timestamp: new Date().toISOString(),
          data: {
            certificateId,
            userId: args.userId,
            userName: args.userName,
            courseId: args.courseId,
            courseTitle: args.courseTitle,
            finalScore: args.finalScore,
            completionDate: Date.now(),
          },
        }),
      });
    }

    return certDocId;
  },
});

// Get certificates for a user
export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("certificates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get all certificates for an organization's courses
export const getByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    // Get all org courses
    const orgCourses = await ctx.db
      .query("courses")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const courseIds = new Set(orgCourses.map((c) => c._id));

    // Get all org members
    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Get certificates for each member, filtered to org courses
    const allCerts = [];
    for (const member of members) {
      const certs = await ctx.db
        .query("certificates")
        .withIndex("by_user", (q) => q.eq("userId", member.userId))
        .collect();

      for (const cert of certs) {
        if (courseIds.has(cert.courseId)) {
          allCerts.push({
            ...cert,
            memberName: member.name ?? member.email,
            memberEmail: member.email,
          });
        }
      }
    }

    return allCerts;
  },
});

// Verify a certificate
export const verify = query({
  args: { certificateId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("certificates")
      .withIndex("by_certificate_id", (q) =>
        q.eq("certificateId", args.certificateId)
      )
      .first();
  },
});

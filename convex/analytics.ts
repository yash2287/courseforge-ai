import { v } from "convex/values";
import { query } from "./_generated/server";

// Get organization overview stats
export const getOrgOverview = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const courses = await ctx.db
      .query("courses")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const assignments = await ctx.db
      .query("courseAssignments")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const certificates = await ctx.db
      .query("certificates")
      .collect();

    // Filter certificates for org courses
    const orgCourseIds = new Set(courses.map((c) => c._id));
    const orgCertificates = certificates.filter((c) =>
      orgCourseIds.has(c.courseId)
    );

    const completedAssignments = assignments.filter(
      (a) => a.status === "completed"
    ).length;
    const overdueAssignments = assignments.filter(
      (a) => a.status !== "completed" && a.dueDate && a.dueDate < Date.now()
    ).length;
    const inProgressAssignments = assignments.filter(
      (a) => a.status === "in_progress"
    ).length;
    const totalAssignments = assignments.length;

    // Active learners (members with in_progress assignments)
    const activeUserIds = new Set(
      assignments
        .filter((a) => a.status === "in_progress")
        .map((a) => a.userId)
    );

    // Average completion percentage
    const avgCompletion =
      totalAssignments > 0
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : 0;

    // Calculate average score from certificates
    const avgScore =
      orgCertificates.length > 0
        ? Math.round(
            orgCertificates.reduce((sum, c) => sum + c.finalScore, 0) /
              orgCertificates.length
          )
        : 0;

    // Certificates this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const certificatesThisMonth = orgCertificates.filter(
      (c) => c.completionDate >= monthStart.getTime()
    ).length;

    return {
      totalMembers: members.length,
      totalCourses: courses.filter((c) => c.status === "published").length,
      totalAssignments,
      completedAssignments,
      inProgressAssignments,
      overdueAssignments,
      activeLearners: activeUserIds.size,
      avgCompletion,
      avgScore,
      totalCertificates: orgCertificates.length,
      certificatesThisMonth,
    };
  },
});

// Get per-member progress report for the org
export const getMemberReports = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const assignments = await ctx.db
      .query("courseAssignments")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const courses = await ctx.db
      .query("courses")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const orgCourseIds = new Set(courses.map((c) => c._id));
    const certificates = (await ctx.db.query("certificates").collect()).filter(
      (c) => orgCourseIds.has(c.courseId)
    );

    return members.map((member) => {
      const memberAssignments = assignments.filter(
        (a) => a.userId === member.userId
      );
      const completed = memberAssignments.filter(
        (a) => a.status === "completed"
      ).length;
      const overdue = memberAssignments.filter(
        (a) =>
          a.status !== "completed" && a.dueDate && a.dueDate < Date.now()
      ).length;
      const memberCerts = certificates.filter(
        (c) => c.userId === member.userId
      );
      const avgScore =
        memberCerts.length > 0
          ? Math.round(
              memberCerts.reduce((sum, c) => sum + c.finalScore, 0) /
                memberCerts.length
            )
          : null;

      return {
        userId: member.userId,
        name: member.name || member.email,
        email: member.email,
        role: member.role,
        totalAssigned: memberAssignments.length,
        completed,
        inProgress: memberAssignments.filter(
          (a) => a.status === "in_progress"
        ).length,
        overdue,
        certificates: memberCerts.length,
        avgScore,
        completionRate:
          memberAssignments.length > 0
            ? Math.round((completed / memberAssignments.length) * 100)
            : 0,
      };
    });
  },
});

// Get course performance analytics
export const getCoursePerformance = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const assignments = await ctx.db
      .query("courseAssignments")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const allCertificates = await ctx.db.query("certificates").collect();

    return courses
      .filter((c) => c.status === "published")
      .map((course) => {
        const courseAssignments = assignments.filter(
          (a) => a.courseId === course._id
        );
        const completed = courseAssignments.filter(
          (a) => a.status === "completed"
        ).length;
        const courseCerts = allCertificates.filter(
          (c) => c.courseId === course._id
        );
        const avgScore =
          courseCerts.length > 0
            ? Math.round(
                courseCerts.reduce((sum, c) => sum + c.finalScore, 0) /
                  courseCerts.length
              )
            : null;

        return {
          courseId: course._id,
          title: course.title,
          difficulty: course.difficulty,
          totalAssigned: courseAssignments.length,
          completed,
          inProgress: courseAssignments.filter(
            (a) => a.status === "in_progress"
          ).length,
          overdue: courseAssignments.filter(
            (a) =>
              a.status !== "completed" &&
              a.dueDate &&
              a.dueDate < Date.now()
          ).length,
          completionRate:
            courseAssignments.length > 0
              ? Math.round((completed / courseAssignments.length) * 100)
              : 0,
          avgScore,
          certificates: courseCerts.length,
          isCompliance: course.isComplianceTemplate || false,
          complianceCategory: course.complianceCategory,
        };
      });
  },
});

// Get compliance status overview
export const getComplianceStatus = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const complianceCourses = courses.filter((c) => c.isComplianceTemplate);

    const assignments = await ctx.db
      .query("courseAssignments")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    return complianceCourses.map((course) => {
      const courseAssignments = assignments.filter(
        (a) => a.courseId === course._id
      );
      const completed = courseAssignments.filter(
        (a) => a.status === "completed"
      ).length;
      const overdue = courseAssignments.filter(
        (a) =>
          a.status !== "completed" && a.dueDate && a.dueDate < Date.now()
      ).length;

      return {
        courseId: course._id,
        title: course.title,
        category: course.complianceCategory || "Other",
        totalMembers: members.length,
        assigned: courseAssignments.length,
        completed,
        overdue,
        notAssigned: members.length - courseAssignments.length,
        completionRate:
          courseAssignments.length > 0
            ? Math.round((completed / courseAssignments.length) * 100)
            : 0,
      };
    });
  },
});

// Get audit log entries
export const getAuditLog = query({
  args: {
    orgId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_org_timestamp", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(limit);
  },
});

import { v } from "convex/values";
import { action, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// Internal query to check user's notification preferences
export const getUserPreferences = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return prefs || {
      emailAssignments: true,
      emailReminders: true,
      emailCompletions: true,
      emailDigest: true,
    };
  },
});

// Internal query to get overdue/upcoming assignments for reminders
export const getUpcomingDeadlines = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    const assignments = await ctx.db
      .query("courseAssignments")
      .withIndex("by_status", (q) => q.eq("status", "assigned"))
      .collect();

    const inProgressAssignments = await ctx.db
      .query("courseAssignments")
      .withIndex("by_status", (q) => q.eq("status", "in_progress"))
      .collect();

    const allActive = [...assignments, ...inProgressAssignments];

    const upcoming = allActive.filter((a) => {
      if (!a.dueDate) return false;
      return a.dueDate <= sevenDaysFromNow;
    });

    const enriched = [];
    for (const assignment of upcoming) {
      const course = await ctx.db.get(assignment.courseId);
      const member = await ctx.db
        .query("orgMembers")
        .withIndex("by_org_user", (q) =>
          q.eq("orgId", assignment.orgId).eq("userId", assignment.userId)
        )
        .first();
      const org = await ctx.db.get(assignment.orgId);

      if (course && member && org) {
        const daysLeft = Math.ceil((assignment.dueDate! - now) / (24 * 60 * 60 * 1000));
        enriched.push({
          assignmentId: assignment._id,
          userId: assignment.userId,
          userEmail: member.email,
          userName: member.name ?? member.email,
          courseId: assignment.courseId,
          courseTitle: course.title,
          orgName: org.name,
          orgSlug: org.slug,
          dueDate: assignment.dueDate!,
          daysLeft,
        });
      }
    }

    return enriched;
  },
});

// Internal query to get org digest data
export const getOrgDigestData = internalQuery({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) return null;

    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const allAssignments = await ctx.db
      .query("courseAssignments")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const completedThisWeek = allAssignments.filter(
      (a) => a.status === "completed" && a.completedAt && a.completedAt >= sevenDaysAgo
    ).length;

    const newThisWeek = allAssignments.filter(
      (a) => a.assignedAt >= sevenDaysAgo
    ).length;

    const overdueCount = allAssignments.filter(
      (a) => a.dueDate && a.dueDate < Date.now() && a.status !== "completed"
    ).length;

    const activeLearners = new Set<string>();
    for (const member of members) {
      const progress = await ctx.db
        .query("userProgress")
        .withIndex("by_user", (q) => q.eq("userId", member.userId))
        .collect();
      if (progress.some((p) => p.lastAccessedAt >= sevenDaysAgo)) {
        activeLearners.add(member.userId);
      }
    }

    let totalScore = 0;
    let scoreCount = 0;
    for (const member of members) {
      const attempts = await ctx.db
        .query("quizAttempts")
        .withIndex("by_user_course", (q) => q.eq("userId", member.userId))
        .collect();
      const recentAttempts = attempts.filter((a) => a.attemptedAt >= sevenDaysAgo);
      for (const attempt of recentAttempts) {
        totalScore += attempt.score;
        scoreCount++;
      }
    }

    const admins = members.filter((m) => ["owner", "admin"].includes(m.role));

    return {
      org,
      admins,
      stats: {
        totalMembers: members.length,
        activeLearners: activeLearners.size,
        coursesCompleted: completedThisWeek,
        newAssignments: newThisWeek,
        overdueCount,
        avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
      },
    };
  },
});

// Internal query to list all org IDs
export const getAllOrgIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query("organizations").collect();
    return orgs.map((o) => ({ id: o._id, slug: o.slug }));
  },
});

// Helper to call email API
async function callEmailApi(type: string, to: string | string[], data: any) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";

  const response = await fetch(`${siteUrl}/api/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, to, data }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Email API error:", error);
    return { success: false, error: error.error };
  }

  return await response.json();
}

// Public action: Send email (callable from client for immediate triggers)
export const sendEmail = action({
  args: {
    type: v.string(),
    to: v.union(v.string(), v.array(v.string())),
    data: v.any(),
  },
  handler: async (_ctx, args) => {
    return await callEmailApi(args.type, args.to, args.data);
  },
});

// Internal action: Check deadlines and send reminder emails (called by cron)
export const checkDeadlinesAndNotify: ReturnType<typeof internalAction> = internalAction({
  args: {},
  handler: async (ctx) => {
    const deadlines = await ctx.runQuery(internal.emails.getUpcomingDeadlines);
    let sent = 0;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";

    for (const deadline of deadlines) {
      const shouldNotify = [7, 3, 1, 0].includes(deadline.daysLeft) || deadline.daysLeft < 0;
      if (!shouldNotify) continue;

      const prefs = await ctx.runQuery(internal.emails.getUserPreferences, {
        userId: deadline.userId,
      });
      if (!prefs.emailReminders) continue;

      const dueDateStr = new Date(deadline.dueDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      await callEmailApi("deadline_reminder", deadline.userEmail, {
        userName: deadline.userName,
        courseTitle: deadline.courseTitle,
        orgName: deadline.orgName,
        daysLeft: Math.max(0, deadline.daysLeft),
        dueDate: dueDateStr,
        courseUrl: `${siteUrl}/courses/${deadline.courseId}/learn`,
      });
      sent++;
    }

    return { checked: deadlines.length, sent };
  },
});

// Internal action: Send weekly digest to all org admins (called by cron)
export const sendWeeklyDigests: ReturnType<typeof internalAction> = internalAction({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.runQuery(internal.emails.getAllOrgIds);
    let sent = 0;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";

    for (const org of orgs) {
      const digestData = await ctx.runQuery(internal.emails.getOrgDigestData, {
        orgId: org.id,
      });
      if (!digestData || digestData.admins.length === 0) continue;

      const weekOf = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      for (const admin of digestData.admins) {
        const prefs = await ctx.runQuery(internal.emails.getUserPreferences, {
          userId: admin.userId,
        });
        if (!prefs.emailDigest) continue;

        await callEmailApi("weekly_digest", admin.email, {
          adminName: admin.name ?? admin.email,
          orgName: digestData.org.name,
          weekOf,
          stats: digestData.stats,
          dashboardUrl: `${siteUrl}/org/${org.slug}/analytics`,
        });
        sent++;
      }
    }

    return { orgs: orgs.length, sent };
  },
});

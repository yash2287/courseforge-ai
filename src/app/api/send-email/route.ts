import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import CourseAssignedEmail from "@/emails/CourseAssigned";
import DeadlineReminderEmail from "@/emails/DeadlineReminder";
import CourseCompletedEmail from "@/emails/CourseCompleted";
import WeeklyDigestEmail from "@/emails/WeeklyDigest";
import OrgInviteEmail from "@/emails/OrgInvite";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}
const resend = new Proxy({} as Resend, {
  get(_, prop) {
    return (getResend() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "CourseForge <noreply@courseforge.ai>";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, data } = body;

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — skipping email send");
      return NextResponse.json({ success: true, skipped: true });
    }

    if (!type || !to) {
      return NextResponse.json(
        { error: "Missing required fields: type, to" },
        { status: 400 }
      );
    }

    let subject: string;
    let react: React.ReactElement;

    switch (type) {
      case "course_assigned":
        subject = `New course assigned: ${data.courseTitle}`;
        react = CourseAssignedEmail({
          userName: data.userName,
          courseTitle: data.courseTitle,
          orgName: data.orgName,
          dueDate: data.dueDate,
          courseUrl: data.courseUrl,
        });
        break;

      case "deadline_reminder":
        subject = data.daysLeft <= 0
          ? `OVERDUE: ${data.courseTitle}`
          : `Reminder: ${data.courseTitle} due in ${data.daysLeft} day${data.daysLeft === 1 ? "" : "s"}`;
        react = DeadlineReminderEmail({
          userName: data.userName,
          courseTitle: data.courseTitle,
          orgName: data.orgName,
          daysLeft: data.daysLeft,
          dueDate: data.dueDate,
          courseUrl: data.courseUrl,
        });
        break;

      case "course_completed":
        subject = `${data.memberName} completed "${data.courseTitle}"`;
        react = CourseCompletedEmail({
          managerName: data.managerName,
          memberName: data.memberName,
          courseTitle: data.courseTitle,
          score: data.score,
          orgName: data.orgName,
          dashboardUrl: data.dashboardUrl,
        });
        break;

      case "weekly_digest":
        subject = `Weekly Training Report — ${data.orgName}`;
        react = WeeklyDigestEmail({
          adminName: data.adminName,
          orgName: data.orgName,
          weekOf: data.weekOf,
          stats: data.stats,
          dashboardUrl: data.dashboardUrl,
        });
        break;

      case "org_invite":
        subject = `You're invited to join ${data.orgName} on CourseForge`;
        react = OrgInviteEmail({
          inviteeName: data.inviteeName,
          inviterName: data.inviterName,
          orgName: data.orgName,
          role: data.role,
          acceptUrl: data.acceptUrl,
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        );
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}

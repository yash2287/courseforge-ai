import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import Papa from "papaparse";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const orgSlug = searchParams.get("org");
  const reportType = searchParams.get("type") || "members";

  if (!orgSlug) {
    return NextResponse.json({ error: "Missing org parameter" }, { status: 400 });
  }

  try {
    // Look up org by slug
    const org = await convex.query(api.organizations.getBySlug, { slug: orgSlug });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    let csvData: string;
    let filename: string;

    switch (reportType) {
      case "members": {
        const reports = await convex.query(api.analytics.getMemberReports, { orgId: org._id });
        const rows = reports.map((r: Record<string, unknown>) => ({
          Name: r.name,
          Email: r.email,
          Role: r.role,
          "Courses Assigned": r.totalAssigned,
          Completed: r.completed,
          "In Progress": r.inProgress,
          Overdue: r.overdue,
          Certificates: r.certificates,
          "Avg Score": r.avgScore ?? "N/A",
          "Completion Rate (%)": r.completionRate,
        }));
        csvData = Papa.unparse(rows);
        filename = `${orgSlug}-member-reports.csv`;
        break;
      }
      case "courses": {
        const reports = await convex.query(api.analytics.getCoursePerformance, { orgId: org._id });
        const rows = reports.map((r: Record<string, unknown>) => ({
          Title: r.title,
          Difficulty: r.difficulty,
          "Total Assigned": r.totalAssigned,
          Completed: r.completed,
          "In Progress": r.inProgress,
          Overdue: r.overdue,
          "Completion Rate (%)": r.completionRate,
          "Avg Score": r.avgScore ?? "N/A",
          Certificates: r.certificates,
          Compliance: r.isCompliance ? "Yes" : "No",
          Category: r.complianceCategory ?? "",
        }));
        csvData = Papa.unparse(rows);
        filename = `${orgSlug}-course-performance.csv`;
        break;
      }
      case "compliance": {
        const reports = await convex.query(api.analytics.getComplianceStatus, { orgId: org._id });
        const rows = reports.map((r: Record<string, unknown>) => ({
          Title: r.title,
          Category: r.category,
          "Total Members": r.totalMembers,
          Assigned: r.assigned,
          Completed: r.completed,
          Overdue: r.overdue,
          "Not Assigned": r.notAssigned,
          "Completion Rate (%)": r.completionRate,
        }));
        csvData = Papa.unparse(rows);
        filename = `${orgSlug}-compliance-status.csv`;
        break;
      }
      case "audit": {
        const logs = await convex.query(api.analytics.getAuditLog, { orgId: org._id, limit: 500 });
        const rows = logs.map((r: Record<string, unknown>) => ({
          Timestamp: new Date(r.timestamp as number).toISOString(),
          "User ID": r.userId,
          Action: r.action,
          "Resource Type": r.resourceType,
          "Resource ID": r.resourceId,
          Metadata: r.metadata ?? "",
        }));
        csvData = Papa.unparse(rows);
        filename = `${orgSlug}-audit-log.csv`;
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Analytics export error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

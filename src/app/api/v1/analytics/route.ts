import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgSlug = searchParams.get("org");

    if (!orgSlug) {
      return NextResponse.json(
        { error: "Missing required parameter: org (organization slug)" },
        { status: 400 }
      );
    }

    const org = await convex.query(api.organizations.getBySlug, { slug: orgSlug });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const overview = await convex.query(api.analytics.getOrgOverview, { orgId: org._id });
    const coursePerformance = await convex.query(api.analytics.getCoursePerformance, { orgId: org._id });

    return NextResponse.json({
      overview,
      coursePerformance: coursePerformance.map((c: any) => ({
        courseId: c.courseId,
        courseTitle: c.courseTitle,
        completionRate: c.completionRate,
        avgScore: c.avgScore,
        assignedCount: c.assignedCount,
        completedCount: c.completedCount,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

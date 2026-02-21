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

    const certificates = await convex.query(api.certificates.getByOrg, { orgId: org._id });

    return NextResponse.json({
      data: certificates.map((c: any) => ({
        id: c._id,
        certificateId: c.certificateId,
        userId: c.userId,
        userName: c.userName ?? c.memberName,
        courseTitle: c.courseTitle,
        finalScore: c.finalScore,
        completionDate: c.completionDate,
        memberEmail: c.memberEmail,
      })),
      total: certificates.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

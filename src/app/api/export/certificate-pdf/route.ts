import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import ReactPDF from "@react-pdf/renderer";
import { CertificateDocument } from "@/lib/certificate-pdf";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const certificateId = searchParams.get("id");

  if (!certificateId) {
    return NextResponse.json({ error: "Missing certificate id" }, { status: 400 });
  }

  try {
    const certificate = await convex.query(api.certificates.verify, {
      certificateId,
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const pdfStream = await ReactPDF.renderToStream(
      CertificateDocument({
        userName: certificate.userName,
        courseTitle: certificate.courseTitle,
        companyName: certificate.companyName,
        completionDate: new Date(certificate.completionDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        finalScore: Math.round(certificate.finalScore),
        certificateId: certificate.certificateId,
      })
    );

    // Convert readable stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${certificateId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Certificate PDF error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}

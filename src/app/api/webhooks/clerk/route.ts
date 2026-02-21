import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { NextRequest } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const email = evt.data.email_addresses?.[0]?.email_address;
      if (!email) {
        return new Response("OK", { status: 200 });
      }

      const domain = email.split("@")[1];
      if (!domain) {
        return new Response("OK", { status: 200 });
      }

      // Look up org by email domain
      const org = await convex.query(api.sso.getOrgByDomain, { domain });
      if (!org || !org.ssoConfig?.enabled || !org.ssoConfig?.autoProvision) {
        return new Response("OK", { status: 200 });
      }

      // Check if already a member
      const existing = await convex.query(api.orgMembers.getMembership, {
        orgId: org._id,
        userId: evt.data.id,
      });

      if (existing) {
        return new Response("OK", { status: 200 });
      }

      // Auto-provision the user into the org
      const name =
        `${evt.data.first_name ?? ""} ${evt.data.last_name ?? ""}`.trim() ||
        undefined;

      await convex.mutation(api.sso.autoProvisionMember, {
        orgId: org._id,
        userId: evt.data.id,
        email,
        name,
      });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }
}

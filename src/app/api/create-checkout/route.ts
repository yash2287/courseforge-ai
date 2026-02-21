import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId, orgId, stripeCustomerId, successUrl, cancelUrl } =
      await req.json();

    if (!priceId || !orgId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const sessionParams: Record<string, unknown> = {
      mode: "subscription" as const,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url:
        successUrl ||
        `${process.env.NEXT_PUBLIC_SITE_URL}/billing?success=true`,
      cancel_url:
        cancelUrl ||
        `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
      metadata: { orgId, userId },
      allow_promotion_codes: true,
    };

    // Attach existing customer or create new
    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    } else {
      sessionParams.customer_creation = "always";
      sessionParams.customer_email = undefined; // Clerk will handle
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Create checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

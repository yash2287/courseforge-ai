import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type Stripe from "stripe";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const PRICE_TO_PLAN: Record<string, { planId: "starter" | "professional"; interval: "monthly" | "annual" }> = {
  [process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID || ""]: { planId: "starter", interval: "monthly" },
  [process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID || ""]: { planId: "starter", interval: "annual" },
  [process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || ""]: { planId: "professional", interval: "monthly" },
  [process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID || ""]: { planId: "professional", interval: "annual" },
};

// Helper to safely extract period timestamps from subscription
// Stripe v20 changed the shape - use type-safe access
function getPeriodTimestamps(subscription: Stripe.Subscription) {
  const sub = subscription as unknown as Record<string, unknown>;
  const start = (sub.current_period_start as number) ?? Math.floor(Date.now() / 1000);
  const end = (sub.current_period_end as number) ?? Math.floor(Date.now() / 1000) + 30 * 86400;
  return { start: start * 1000, end: end * 1000 };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription && session.customer) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await handleSubscriptionUpdate(subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const period = getPeriodTimestamps(subscription);
        await convex.mutation(api.subscriptions.updateFromStripe, {
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price.id || "",
          planId: "free",
          billingInterval: "monthly",
          status: "canceled",
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
          cancelAtPeriodEnd: false,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceAny = invoice as unknown as Record<string, unknown>;
        const invoiceSubId = invoiceAny.subscription as string | null;
        if (invoiceSubId) {
          const subscription = await stripe.subscriptions.retrieve(
            invoiceSubId
          );
          const period = getPeriodTimestamps(subscription);
          await convex.mutation(api.subscriptions.updateFromStripe, {
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0]?.price.id || "",
            planId: resolvePlanId(subscription.items.data[0]?.price.id || ""),
            billingInterval: resolveInterval(subscription.items.data[0]?.price.id || ""),
            status: "past_due",
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id || "";
  const planId = resolvePlanId(priceId);
  const interval = resolveInterval(priceId);
  const period = getPeriodTimestamps(subscription);

  const statusMap: Record<string, "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "unpaid"> = {
    active: "active",
    canceled: "canceled",
    past_due: "past_due",
    trialing: "trialing",
    incomplete: "incomplete",
    unpaid: "unpaid",
    incomplete_expired: "canceled",
    paused: "canceled",
  };

  await convex.mutation(api.subscriptions.updateFromStripe, {
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    planId,
    billingInterval: interval,
    status: statusMap[subscription.status] || "active",
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

function resolvePlanId(priceId: string): "free" | "starter" | "professional" | "enterprise" {
  return PRICE_TO_PLAN[priceId]?.planId || "free";
}

function resolveInterval(priceId: string): "monthly" | "annual" {
  return PRICE_TO_PLAN[priceId]?.interval || "monthly";
}

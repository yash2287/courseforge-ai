import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS, getEndpointGroup } from "@/lib/rate-limit";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/courses(.*)",
  "/org(.*)",
  "/billing(.*)",
  "/onboarding(.*)",
  "/settings(.*)",
  "/admin(.*)",
]);

const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)"]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Webhook routes must be public for external services (Clerk/Svix/Stripe) to reach them
  if (isWebhookRoute(req)) return;

  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Rate limiting for API routes
  if (isApiRoute(req)) {
    const group = getEndpointGroup(req.nextUrl.pathname);
    if (group) {
      // Use userId if authenticated, fall back to IP
      const { userId } = await auth();
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const identifier = userId || `ip:${ip}`;

      // Authenticated users get generous starter-tier limits at the middleware level;
      // unauthenticated requests get free-tier limits.
      const planId = userId ? "starter" : "free";
      const config = RATE_LIMITS[group]?.[planId];

      if (config && config.limit !== -1) {
        const key = `${group}:${identifier}`;
        const result = rateLimit(key, config);

        if (!result.allowed) {
          return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
              status: 429,
              headers: {
                "Retry-After": String(result.retryAfterSeconds),
                "X-RateLimit-Limit": String(result.limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
              },
            }
          );
        }

        // Attach rate limit headers to the response
        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", String(result.limit));
        response.headers.set("X-RateLimit-Remaining", String(result.remaining));
        response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
        return response;
      }
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Clean expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000);

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: now + config.windowMs,
      retryAfterSeconds: 0,
    };
  }

  if (entry.count >= config.limit) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds,
    };
  }

  entry.count++;
  return {
    allowed: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
    retryAfterSeconds: 0,
  };
}

// Rate limit presets per endpoint group and plan tier
// -1 means unlimited (no rate limiting applied)
export const RATE_LIMITS: Record<string, Record<string, RateLimitConfig>> = {
  "generate-course": {
    free: { limit: 5, windowMs: 86_400_000 },        // 5/day
    starter: { limit: 50, windowMs: 86_400_000 },     // 50/day
    professional: { limit: -1, windowMs: 0 },          // unlimited
    enterprise: { limit: -1, windowMs: 0 },            // unlimited
  },
  "generate-quiz": {
    free: { limit: 10, windowMs: 86_400_000 },        // 10/day
    starter: { limit: 100, windowMs: 86_400_000 },    // 100/day
    professional: { limit: -1, windowMs: 0 },
    enterprise: { limit: -1, windowMs: 0 },
  },
  "course-chat": {
    free: { limit: 20, windowMs: 3_600_000 },         // 20/hr
    starter: { limit: 200, windowMs: 3_600_000 },     // 200/hr
    professional: { limit: -1, windowMs: 0 },
    enterprise: { limit: -1, windowMs: 0 },
  },
  "api-v1": {
    free: { limit: 100, windowMs: 3_600_000 },        // 100/hr
    starter: { limit: 1000, windowMs: 3_600_000 },    // 1000/hr
    professional: { limit: 10_000, windowMs: 3_600_000 }, // 10000/hr
    enterprise: { limit: -1, windowMs: 0 },
  },
};

/** Map a URL pathname to a rate limit group */
export function getEndpointGroup(pathname: string): string | null {
  if (pathname.startsWith("/api/generate-course")) return "generate-course";
  if (pathname.startsWith("/api/generate-quiz")) return "generate-quiz";
  if (pathname.startsWith("/api/course-chat")) return "course-chat";
  if (pathname.startsWith("/api/v1/")) return "api-v1";
  return null;
}

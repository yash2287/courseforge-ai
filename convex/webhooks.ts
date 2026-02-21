import { v } from "convex/values";
import { mutation, query, internalQuery, internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ─── Queries ─────────────────────────────────────────────

export const listByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("webhookEndpoints")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

export const getById = query({
  args: { endpointId: v.id("webhookEndpoints") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.endpointId);
  },
});

export const getDeliveries = query({
  args: {
    endpointId: v.id("webhookEndpoints"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const deliveries = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_endpoint", (q) => q.eq("endpointId", args.endpointId))
      .order("desc")
      .take(args.limit ?? 50);
    return deliveries;
  },
});

export const getDeliveriesByOrg = query({
  args: {
    orgId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const deliveries = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(args.limit ?? 50);
    return deliveries;
  },
});

// ─── Mutations ───────────────────────────────────────────

export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    url: v.string(),
    events: v.array(v.string()),
    description: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate HMAC secret
    const secret = `whsec_${generateRandomHex(32)}`;
    const now = Date.now();

    return await ctx.db.insert("webhookEndpoints", {
      orgId: args.orgId,
      url: args.url,
      secret,
      events: args.events,
      active: true,
      description: args.description,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    endpointId: v.id("webhookEndpoints"),
    url: v.optional(v.string()),
    events: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { endpointId, ...updates } = args;
    const endpoint = await ctx.db.get(endpointId);
    if (!endpoint) throw new Error("Webhook endpoint not found");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.url !== undefined) patch.url = updates.url;
    if (updates.events !== undefined) patch.events = updates.events;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.active !== undefined) patch.active = updates.active;

    await ctx.db.patch(endpointId, patch);
  },
});

export const remove = mutation({
  args: { endpointId: v.id("webhookEndpoints") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.endpointId);
    // Clean up deliveries
    const deliveries = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_endpoint", (q) => q.eq("endpointId", args.endpointId))
      .collect();
    for (const d of deliveries) {
      await ctx.db.delete(d._id);
    }
  },
});

export const rotateSecret = mutation({
  args: { endpointId: v.id("webhookEndpoints") },
  handler: async (ctx, args) => {
    const newSecret = `whsec_${generateRandomHex(32)}`;
    await ctx.db.patch(args.endpointId, {
      secret: newSecret,
      updatedAt: Date.now(),
    });
    return newSecret;
  },
});

// ─── Event dispatch (called from other mutations) ────────

/** Queue a webhook event for all active endpoints subscribed to this event */
export const dispatchEvent = internalMutation({
  args: {
    orgId: v.id("organizations"),
    event: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    const endpoints = await ctx.db
      .query("webhookEndpoints")
      .withIndex("by_org_active", (q) =>
        q.eq("orgId", args.orgId).eq("active", true)
      )
      .collect();

    for (const endpoint of endpoints) {
      if (!endpoint.events.includes(args.event)) continue;

      const deliveryId = await ctx.db.insert("webhookDeliveries", {
        endpointId: endpoint._id,
        orgId: args.orgId,
        event: args.event,
        payload: args.payload,
        attempts: 0,
        status: "pending",
        createdAt: Date.now(),
      });

      // Schedule immediate delivery
      await ctx.scheduler.runAfter(0, internal.webhooks.deliver, {
        deliveryId,
      });
    }
  },
});

// ─── Delivery action (runs as internalAction to make HTTP calls) ─

export const deliver: ReturnType<typeof internalAction> = internalAction({
  args: { deliveryId: v.id("webhookDeliveries") },
  handler: async (ctx, args) => {
    // Read delivery record
    const delivery = await ctx.runQuery(internal.webhooks._getDelivery, {
      deliveryId: args.deliveryId,
    });
    if (!delivery || delivery.status === "delivered") return;

    // Read endpoint
    const endpoint = await ctx.runQuery(internal.webhooks._getEndpoint, {
      endpointId: delivery.endpointId,
    });
    if (!endpoint || !endpoint.active) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const body = delivery.payload;

    // HMAC signature: timestamp.body signed with secret
    const signature = await computeHmacSha256(
      endpoint.secret,
      `${timestamp}.${body}`
    );

    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": `t=${timestamp},v1=${signature}`,
          "X-Webhook-Event": delivery.event,
          "User-Agent": "CourseForge-Webhooks/1.0",
        },
        body,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      const responseText = await response.text().catch(() => "");
      const statusCode = response.status;

      if (statusCode >= 200 && statusCode < 300) {
        await ctx.runMutation(internal.webhooks._markDelivered, {
          deliveryId: args.deliveryId,
          statusCode,
          response: responseText.slice(0, 500),
        });
      } else {
        await ctx.runMutation(internal.webhooks._markRetry, {
          deliveryId: args.deliveryId,
          statusCode,
          response: responseText.slice(0, 500),
          attempt: delivery.attempts + 1,
        });
      }
    } catch (error: any) {
      await ctx.runMutation(internal.webhooks._markRetry, {
        deliveryId: args.deliveryId,
        statusCode: 0,
        response: error?.message?.slice(0, 500) ?? "Network error",
        attempt: delivery.attempts + 1,
      });
    }
  },
});

// ─── Internal helpers (queries/mutations for the action) ─

export const _getDelivery = internalQuery({
  args: { deliveryId: v.id("webhookDeliveries") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.deliveryId);
  },
});

export const _getEndpoint = internalQuery({
  args: { endpointId: v.id("webhookEndpoints") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.endpointId);
  },
});

export const _markDelivered = internalMutation({
  args: {
    deliveryId: v.id("webhookDeliveries"),
    statusCode: v.number(),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.deliveryId);
    if (!delivery) return;
    await ctx.db.patch(args.deliveryId, {
      status: "delivered",
      statusCode: args.statusCode,
      response: args.response,
      attempts: delivery.attempts + 1,
      deliveredAt: Date.now(),
    });
  },
});

export const _markRetry = internalMutation({
  args: {
    deliveryId: v.id("webhookDeliveries"),
    statusCode: v.number(),
    response: v.string(),
    attempt: v.number(),
  },
  handler: async (ctx, args) => {
    const MAX_ATTEMPTS = 3;
    // Exponential backoff: 1min, 5min, 30min
    const RETRY_DELAYS = [60_000, 300_000, 1_800_000];

    if (args.attempt >= MAX_ATTEMPTS) {
      await ctx.db.patch(args.deliveryId, {
        status: "failed",
        statusCode: args.statusCode,
        response: args.response,
        attempts: args.attempt,
      });
      return;
    }

    const nextRetryAt = Date.now() + (RETRY_DELAYS[args.attempt - 1] ?? 1_800_000);
    await ctx.db.patch(args.deliveryId, {
      statusCode: args.statusCode,
      response: args.response,
      attempts: args.attempt,
      nextRetryAt,
    });
  },
});

// Retry pending deliveries (called by cron)
export const retryPending = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    // Get pending deliveries that are due for retry
    const pending = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    for (const delivery of pending) {
      if (delivery.nextRetryAt && delivery.nextRetryAt <= now && delivery.attempts > 0) {
        await ctx.scheduler.runAfter(0, internal.webhooks.deliver, {
          deliveryId: delivery._id,
        });
      }
    }
  },
});

// ─── Test webhook (manual trigger for testing) ───────────

export const sendTestEvent = mutation({
  args: { endpointId: v.id("webhookEndpoints") },
  handler: async (ctx, args) => {
    const endpoint = await ctx.db.get(args.endpointId);
    if (!endpoint) throw new Error("Endpoint not found");

    const payload = JSON.stringify({
      event: "test.ping",
      timestamp: new Date().toISOString(),
      data: {
        message: "This is a test webhook from CourseForge.",
        endpointId: args.endpointId,
      },
    });

    const deliveryId = await ctx.db.insert("webhookDeliveries", {
      endpointId: args.endpointId,
      orgId: endpoint.orgId,
      event: "test.ping",
      payload,
      attempts: 0,
      status: "pending",
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.webhooks.deliver, {
      deliveryId,
    });

    return deliveryId;
  },
});

// ─── Utilities ───────────────────────────────────────────

function generateRandomHex(length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function computeHmacSha256(
  secret: string,
  message: string
): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

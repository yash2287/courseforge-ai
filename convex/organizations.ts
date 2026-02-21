import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get organization by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

// Get organization by ID
export const getById = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orgId);
  },
});

// Get all organizations a user belongs to
export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("orgMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const results = await Promise.all(
      memberships.map(async (membership) => {
        const org = await ctx.db.get(membership.orgId);
        return org ? { org, membership } : null;
      })
    );

    return results.filter(Boolean);
  },
});

// Create a new organization
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    industry: v.optional(v.string()),
    userId: v.string(),
    userEmail: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate slug uniqueness
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("An organization with this URL already exists");
    }

    const now = Date.now();
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      industry: args.industry,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    // Add creator as owner
    await ctx.db.insert("orgMembers", {
      orgId,
      userId: args.userId,
      email: args.userEmail.toLowerCase().trim(),
      name: args.userName,
      role: "owner",
      joinedAt: now,
    });

    return orgId;
  },
});

// Update organization details
export const update = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
    name: v.optional(v.string()),
    industry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify caller is owner or admin
    const membership = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.userId)
      )
      .first();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("Only owners and admins can update organization settings");
    }

    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.industry !== undefined) updates.industry = args.industry;

    await ctx.db.patch(args.orgId, updates);
  },
});

// Update organization branding
export const updateBranding = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
    branding: v.object({
      primaryColor: v.optional(v.string()),
      secondaryColor: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      companyUrl: v.optional(v.string()),
      certificateFooter: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.userId)
      )
      .first();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("Only owners and admins can update branding");
    }

    await ctx.db.patch(args.orgId, {
      branding: args.branding,
      updatedAt: Date.now(),
    });
  },
});

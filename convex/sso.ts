import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get SSO config for an organization
export const getSsoConfig = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    return org?.ssoConfig ?? null;
  },
});

// Get all SSO domains for an organization
export const getDomainsByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ssoDomains")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

// Find organization by email domain (used by webhook handler)
export const getOrgByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    const normalizedDomain = args.domain.toLowerCase().trim();
    const ssoDomain = await ctx.db
      .query("ssoDomains")
      .withIndex("by_domain", (q) => q.eq("domain", normalizedDomain))
      .first();

    if (!ssoDomain) return null;

    const org = await ctx.db.get(ssoDomain.orgId);
    return org;
  },
});

// Update SSO configuration for an organization
export const updateSsoConfig = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
    ssoConfig: v.object({
      enabled: v.boolean(),
      provider: v.optional(v.string()),
      defaultRole: v.union(
        v.literal("admin"),
        v.literal("manager"),
        v.literal("learner")
      ),
      autoProvision: v.boolean(),
      defaultDepartmentId: v.optional(v.id("departments")),
    }),
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
      throw new Error("Only owners and admins can update SSO settings");
    }

    await ctx.db.patch(args.orgId, {
      ssoConfig: args.ssoConfig,
      updatedAt: Date.now(),
    });

    // Audit log
    const action = args.ssoConfig.enabled ? "sso_enabled" : "sso_disabled";
    await ctx.db.insert("auditLogs", {
      orgId: args.orgId,
      userId: args.userId,
      action,
      resourceType: "sso",
      resourceId: args.orgId,
      metadata: JSON.stringify({
        provider: args.ssoConfig.provider,
        defaultRole: args.ssoConfig.defaultRole,
        autoProvision: args.ssoConfig.autoProvision,
      }),
      timestamp: Date.now(),
    });
  },
});

// Add an SSO domain to an organization
export const addDomain = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
    domain: v.string(),
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
      throw new Error("Only owners and admins can manage SSO domains");
    }

    const normalizedDomain = args.domain.toLowerCase().trim();

    // Validate domain format
    if (!normalizedDomain.includes(".") || normalizedDomain.includes("@")) {
      throw new Error("Invalid domain format. Use format: example.com");
    }

    // Check if domain is already claimed by any org
    const existing = await ctx.db
      .query("ssoDomains")
      .withIndex("by_domain", (q) => q.eq("domain", normalizedDomain))
      .first();

    if (existing) {
      throw new Error("This domain is already registered to an organization");
    }

    const domainId = await ctx.db.insert("ssoDomains", {
      orgId: args.orgId,
      domain: normalizedDomain,
      verified: false,
      createdAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      orgId: args.orgId,
      userId: args.userId,
      action: "sso_domain_added",
      resourceType: "sso",
      resourceId: domainId,
      metadata: JSON.stringify({ domain: normalizedDomain }),
      timestamp: Date.now(),
    });

    return domainId;
  },
});

// Remove an SSO domain from an organization
export const removeDomain = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
    domainId: v.id("ssoDomains"),
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
      throw new Error("Only owners and admins can manage SSO domains");
    }

    const domain = await ctx.db.get(args.domainId);
    if (!domain || domain.orgId !== args.orgId) {
      throw new Error("Domain not found in this organization");
    }

    await ctx.db.delete(args.domainId);

    // Audit log
    await ctx.db.insert("auditLogs", {
      orgId: args.orgId,
      userId: args.userId,
      action: "sso_domain_removed",
      resourceType: "sso",
      resourceId: args.domainId,
      metadata: JSON.stringify({ domain: domain.domain }),
      timestamp: Date.now(),
    });
  },
});

// Auto-provision a member via SSO (called by webhook handler)
export const autoProvisionMember = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim();

    // Check if already a member
    const existing = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.userId)
      )
      .first();

    if (existing) return existing._id;

    // Get org SSO config for default role
    const org = await ctx.db.get(args.orgId);
    if (!org?.ssoConfig?.enabled || !org.ssoConfig.autoProvision) {
      throw new Error("SSO auto-provisioning is not enabled for this organization");
    }

    let role = org.ssoConfig.defaultRole;

    // Check for pending invites — use invited role if higher privilege
    const pendingInvites = await ctx.db
      .query("orgInvites")
      .withIndex("by_email_status", (q) =>
        q.eq("email", normalizedEmail).eq("status", "pending")
      )
      .collect();

    const matchingInvite = pendingInvites.find((i) => i.orgId === args.orgId);
    if (matchingInvite) {
      // Use invite role if it's higher privilege
      const rolePriority: Record<string, number> = {
        admin: 3,
        manager: 2,
        learner: 1,
      };
      if ((rolePriority[matchingInvite.role] ?? 0) > (rolePriority[role] ?? 0)) {
        role = matchingInvite.role;
      }
      // Auto-accept the invite
      await ctx.db.patch(matchingInvite._id, { status: "accepted" });
    }

    // Create membership
    const memberId = await ctx.db.insert("orgMembers", {
      orgId: args.orgId,
      userId: args.userId,
      email: normalizedEmail,
      name: args.name,
      role,
      departmentId: org.ssoConfig.defaultDepartmentId,
      provisionedVia: "sso",
      joinedAt: Date.now(),
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      orgId: args.orgId,
      type: "general",
      title: "Welcome to " + org.name,
      message: `You've been automatically added to ${org.name} via SSO as a ${role}.`,
      linkUrl: `/org/${org.slug}/dashboard`,
      read: false,
      createdAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      orgId: args.orgId,
      userId: args.userId,
      action: "sso_member_provisioned",
      resourceType: "sso",
      resourceId: memberId,
      metadata: JSON.stringify({
        email: normalizedEmail,
        role,
        hadPendingInvite: !!matchingInvite,
      }),
      timestamp: Date.now(),
    });

    return memberId;
  },
});

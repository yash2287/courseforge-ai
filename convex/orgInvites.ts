import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Get all invites for an organization
export const getByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orgInvites")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

// Get pending invites for a specific email
export const getPendingForEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim();
    const invites = await ctx.db
      .query("orgInvites")
      .withIndex("by_email_status", (q) =>
        q.eq("email", normalizedEmail).eq("status", "pending")
      )
      .collect();

    // Filter out expired invites and attach org names
    const now = Date.now();
    const results = await Promise.all(
      invites
        .filter((invite) => invite.expiresAt > now)
        .map(async (invite) => {
          const org = await ctx.db.get(invite.orgId);
          return { invite, orgName: org?.name ?? "Unknown" };
        })
    );

    return results;
  },
});

// Create a new invite
export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("learner")
    ),
    invitedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim();

    // Check caller is admin/owner
    const callerMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.invitedBy)
      )
      .first();

    if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
      throw new Error("Only owners and admins can invite members");
    }

    // Check if already a member
    const existingMembers = await ctx.db
      .query("orgMembers")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .collect();

    const alreadyMember = existingMembers.some((m) => m.orgId === args.orgId);
    if (alreadyMember) {
      throw new Error("This person is already a member of the organization");
    }

    // Check for existing pending invite
    const existingInvites = await ctx.db
      .query("orgInvites")
      .withIndex("by_email_status", (q) =>
        q.eq("email", normalizedEmail).eq("status", "pending")
      )
      .collect();

    const existingInvite = existingInvites.find((i) => i.orgId === args.orgId);
    if (existingInvite) {
      throw new Error("A pending invite already exists for this email");
    }

    const now = Date.now();
    const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

    const inviteId = await ctx.db.insert("orgInvites", {
      orgId: args.orgId,
      email: normalizedEmail,
      role: args.role,
      invitedBy: args.invitedBy,
      status: "pending",
      createdAt: now,
      expiresAt: now + FOURTEEN_DAYS,
    });

    // Schedule invite email
    const org = await ctx.db.get(args.orgId);
    const inviter = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.invitedBy)
      )
      .first();

    if (org) {
      await ctx.scheduler.runAfter(0, api.emails.sendEmail, {
        type: "org_invite",
        to: normalizedEmail,
        data: {
          inviteeName: normalizedEmail.split("@")[0],
          inviterName: inviter?.name ?? inviter?.email ?? "A team member",
          orgName: org.name,
          role: args.role,
          acceptUrl: `/dashboard`,
        },
      });
    }

    return inviteId;
  },
});

// Accept an invite
export const accept = mutation({
  args: {
    inviteId: v.id("orgInvites"),
    userId: v.string(),
    userEmail: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    if (invite.status !== "pending") throw new Error("Invite is no longer pending");

    const normalizedEmail = args.userEmail.toLowerCase().trim();
    if (invite.email !== normalizedEmail) {
      throw new Error("Email does not match the invite");
    }

    if (invite.expiresAt < Date.now()) {
      await ctx.db.patch(args.inviteId, { status: "expired" });
      throw new Error("This invite has expired");
    }

    // Check not already a member
    const existing = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", invite.orgId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(args.inviteId, { status: "accepted" });
      return existing._id;
    }

    // Create membership
    const memberId = await ctx.db.insert("orgMembers", {
      orgId: invite.orgId,
      userId: args.userId,
      email: normalizedEmail,
      name: args.userName,
      role: invite.role,
      joinedAt: Date.now(),
    });

    // Mark invite as accepted
    await ctx.db.patch(args.inviteId, { status: "accepted" });

    // Dispatch member.added webhook
    await ctx.scheduler.runAfter(0, internal.webhooks.dispatchEvent, {
      orgId: invite.orgId,
      event: "member.added",
      payload: JSON.stringify({
        event: "member.added",
        timestamp: new Date().toISOString(),
        data: {
          memberId,
          userId: args.userId,
          email: normalizedEmail,
          name: args.userName ?? null,
          role: invite.role,
        },
      }),
    });

    return memberId;
  },
});

// Decline an invite
export const decline = mutation({
  args: { inviteId: v.id("orgInvites") },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    if (invite.status !== "pending") throw new Error("Invite is no longer pending");

    await ctx.db.patch(args.inviteId, { status: "declined" });
  },
});

// Bulk invite multiple members
export const bulkInvite = mutation({
  args: {
    orgId: v.id("organizations"),
    members: v.array(
      v.object({
        email: v.string(),
        name: v.optional(v.string()),
        role: v.union(v.literal("admin"), v.literal("manager"), v.literal("learner")),
      })
    ),
    invitedBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check caller is admin/owner
    const callerMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.invitedBy)
      )
      .first();

    if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
      throw new Error("Only owners and admins can invite members");
    }

    // Get existing members and pending invites for deduplication
    const existingMembers = await ctx.db
      .query("orgMembers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
    const existingEmails = new Set(existingMembers.map((m) => m.email.toLowerCase()));

    const pendingInvites = await ctx.db
      .query("orgInvites")
      .withIndex("by_org_status", (q) =>
        q.eq("orgId", args.orgId).eq("status", "pending")
      )
      .collect();
    const pendingEmails = new Set(pendingInvites.map((i) => i.email.toLowerCase()));

    const now = Date.now();
    const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
    let invited = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const member of args.members) {
      const normalizedEmail = member.email.toLowerCase().trim();

      if (existingEmails.has(normalizedEmail)) {
        skipped++;
        continue;
      }

      if (pendingEmails.has(normalizedEmail)) {
        skipped++;
        continue;
      }

      // Basic email validation
      if (!normalizedEmail.includes("@")) {
        errors.push(`Invalid email: ${member.email}`);
        continue;
      }

      await ctx.db.insert("orgInvites", {
        orgId: args.orgId,
        email: normalizedEmail,
        role: member.role,
        invitedBy: args.invitedBy,
        status: "pending",
        createdAt: now,
        expiresAt: now + FOURTEEN_DAYS,
      });

      pendingEmails.add(normalizedEmail);
      invited++;
    }

    return { invited, skipped, errors };
  },
});

// Revoke an invite (admin action)
export const revoke = mutation({
  args: {
    inviteId: v.id("orgInvites"),
    callerUserId: v.string(),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Verify caller is admin/owner
    const callerMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.callerUserId)
      )
      .first();

    if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
      throw new Error("Only owners and admins can revoke invites");
    }

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");

    await ctx.db.patch(args.inviteId, { status: "expired" });
  },
});

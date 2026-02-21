import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Generate a URL for uploading a file
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Save file metadata after upload
export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    type: v.union(v.literal("image"), v.literal("video"), v.literal("document"), v.literal("audio")),
    uploadedBy: v.string(),
    orgId: v.optional(v.id("organizations")),
    courseId: v.optional(v.id("courses")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("mediaFiles", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Get file URL from storage
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// List media for an org
export const listByOrg = query({
  args: {
    orgId: v.id("organizations"),
    type: v.optional(v.union(v.literal("image"), v.literal("video"), v.literal("document"), v.literal("audio"))),
  },
  handler: async (ctx, args) => {
    let files;
    if (args.type) {
      files = await ctx.db
        .query("mediaFiles")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
        .collect();
      files = files.filter((f) => f.type === args.type);
    } else {
      files = await ctx.db
        .query("mediaFiles")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
        .collect();
    }

    // Resolve URLs
    const filesWithUrls = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.storageId),
      }))
    );

    return filesWithUrls.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// List media for a course
export const listByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("mediaFiles")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    const filesWithUrls = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.storageId),
      }))
    );

    return filesWithUrls.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// List media uploaded by a user (for personal media library)
export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("mediaFiles")
      .withIndex("by_uploader", (q) => q.eq("uploadedBy", args.userId))
      .collect();

    const filesWithUrls = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.storageId),
      }))
    );

    return filesWithUrls.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Delete a media file
export const remove = mutation({
  args: { mediaId: v.id("mediaFiles") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.mediaId);
    if (!file) throw new Error("File not found");

    // Delete from storage
    await ctx.storage.delete(file.storageId);
    // Delete metadata
    await ctx.db.delete(args.mediaId);
  },
});

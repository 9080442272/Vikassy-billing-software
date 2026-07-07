import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

export const register = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    email: v.optional(v.string()),
    fullName: v.optional(v.string()),
    avatarPicture: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    if (existing) {
      throw new Error("Username already exists");
    }
    return await ctx.db.insert("users", {
      username: args.username,
      password: args.password,
      email: args.email,
      fullName: args.fullName,
      avatarPicture: args.avatarPicture,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    username: v.string(),
    password: v.string(),
    email: v.optional(v.string()),
    fullName: v.optional(v.string()),
    avatarPicture: v.optional(v.string()),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return id;
  },
});

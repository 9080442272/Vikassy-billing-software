import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("employees").collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.string(),
    subCategory: v.optional(v.string()),
    stitchRate: v.number(),
    salary: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("employees", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("employees"),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.string(),
    subCategory: v.optional(v.string()),
    stitchRate: v.number(),
    salary: v.number(),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

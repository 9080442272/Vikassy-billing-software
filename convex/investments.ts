import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("investments").collect();
  },
});

export const add = mutation({
  args: {
    date: v.string(),
    type: v.string(),
    amount: v.number(),
    linkedOrder: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("investments", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("investments"),
    date: v.string(),
    type: v.string(),
    amount: v.number(),
    linkedOrder: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("investments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

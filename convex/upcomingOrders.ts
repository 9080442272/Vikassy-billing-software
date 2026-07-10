import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("upcoming_orders").collect();
  },
});

export const add = mutation({
  args: {
    clientId: v.optional(v.string()),
    clientName: v.string(),
    orderTitle: v.string(),
    deliveryDate: v.string(),
    estimatedValue: v.number(),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("upcoming_orders", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("upcoming_orders"),
    clientId: v.optional(v.string()),
    clientName: v.string(),
    orderTitle: v.string(),
    deliveryDate: v.string(),
    estimatedValue: v.number(),
    status: v.string(),
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
  args: { id: v.id("upcoming_orders") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

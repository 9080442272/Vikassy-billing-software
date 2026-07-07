import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("fabrics").collect();
  },
});

export const add = mutation({
  args: {
    fabricType: v.string(),
    quantityReceived: v.number(),
    color: v.string(),
    receivedDate: v.string(),
    supplier: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("fabrics", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("fabrics"),
    fabricType: v.string(),
    quantityReceived: v.number(),
    color: v.string(),
    receivedDate: v.string(),
    supplier: v.string(),
    status: v.string(),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("fabrics") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

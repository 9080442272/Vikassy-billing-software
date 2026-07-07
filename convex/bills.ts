import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bills").collect();
  },
});

export const add = mutation({
  args: {
    clientId: v.string(),
    billNumber: v.string(),
    date: v.string(),
    billType: v.string(),
    items: v.array(v.object({
      name: v.string(),
      price: v.number(),
      qty: v.number(),
      gstRate: v.number(),
      gstAmount: v.number(),
      total: v.number(),
    })),
    discount: v.number(),
    subtotal: v.number(),
    totalGst: v.number(),
    totalAmount: v.number(),
    fileData: v.optional(v.string()),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bills", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("bills"),
    clientId: v.string(),
    billNumber: v.string(),
    date: v.string(),
    billType: v.string(),
    items: v.array(v.object({
      name: v.string(),
      price: v.number(),
      qty: v.number(),
      gstRate: v.number(),
      gstAmount: v.number(),
      total: v.number(),
    })),
    discount: v.number(),
    subtotal: v.number(),
    totalGst: v.number(),
    totalAmount: v.number(),
    fileData: v.optional(v.string()),
    fileName: v.optional(v.string()),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("bills") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

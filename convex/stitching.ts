import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("stitching").collect();
  },
});

export const add = mutation({
  args: {
    employeeId: v.string(),
    fabricId: v.string(),
    piecesStitched: v.number(),
    ratePerPiece: v.number(),
    totalPayment: v.number(),
    assignedDate: v.string(),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("stitching", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("stitching"),
    employeeId: v.string(),
    fabricId: v.string(),
    piecesStitched: v.number(),
    ratePerPiece: v.number(),
    totalPayment: v.number(),
    assignedDate: v.string(),
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
  args: { id: v.id("stitching") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("advance_records").collect();
  },
});

export const add = mutation({
  args: {
    employeeId: v.optional(v.string()),
    empName: v.string(),
    date: v.string(),
    type: v.string(),
    amount: v.number(),
    mode: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("advance_records", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("advance_records"),
    employeeId: v.optional(v.string()),
    empName: v.string(),
    date: v.string(),
    type: v.string(),
    amount: v.number(),
    mode: v.optional(v.string()),
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
  args: { id: v.id("advance_records") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

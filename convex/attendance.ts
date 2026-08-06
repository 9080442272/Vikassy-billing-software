import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("attendance").collect();
  },
});

export const add = mutation({
  args: {
    employeeId: v.optional(v.string()),
    empName: v.string(),
    date: v.string(),
    shift: v.string(),
    status: v.string(),
    overtimeHours: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("attendance", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("attendance"),
    employeeId: v.optional(v.string()),
    empName: v.string(),
    date: v.string(),
    shift: v.string(),
    status: v.string(),
    overtimeHours: v.number(),
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
  args: { id: v.id("attendance") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("payroll_records").collect();
  },
});

export const add = mutation({
  args: {
    employeeId: v.optional(v.string()),
    empName: v.string(),
    month: v.string(),
    baseSalary: v.number(),
    bonus: v.number(),
    deductions: v.number(),
    netPayable: v.number(),
    status: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("payroll_records", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("payroll_records"),
    employeeId: v.optional(v.string()),
    empName: v.string(),
    month: v.string(),
    baseSalary: v.number(),
    bonus: v.number(),
    deductions: v.number(),
    netPayable: v.number(),
    status: v.string(),
    date: v.string(),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("payroll_records") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

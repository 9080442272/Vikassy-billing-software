import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("ceo_activities").collect();
  },
});

export const add = mutation({
  args: {
    date: v.string(),
    focusArea: v.string(),
    description: v.string(),
    hoursSpent: v.number(),
    productivityLevel: v.string(),
    isCritical: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ceo_activities", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("ceo_activities"),
    date: v.string(),
    focusArea: v.string(),
    description: v.string(),
    hoursSpent: v.number(),
    productivityLevel: v.string(),
    isCritical: v.boolean(),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("ceo_activities") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

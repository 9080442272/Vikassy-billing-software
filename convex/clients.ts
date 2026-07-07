import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("clients").collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    companyName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    gstin: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clients", {
      name: args.name,
      companyName: args.companyName,
      email: args.email,
      phone: args.phone,
      gstin: args.gstin,
      address: args.address,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("clients"),
    name: v.string(),
    companyName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    gstin: v.optional(v.string()),
    address: v.optional(v.string()),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

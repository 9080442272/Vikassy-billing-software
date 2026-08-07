import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("job_orders").collect();
  },
});

export const add = mutation({
  args: {
    styleNumber: v.optional(v.string()),
    orderTitle: v.string(),
    product: v.optional(v.string()),
    clientName: v.string(),
    clientId: v.optional(v.string()),
    quantity: v.number(),
    orderQty: v.optional(v.number()),
    shipmentQty: v.optional(v.number()),
    deliveryDate: v.string(),
    priority: v.string(),
    productionUnit: v.optional(v.string()),
    estimatedValue: v.number(),
    assignedWorker: v.optional(v.string()),
    status: v.string(),
    stage: v.string(),
    notes: v.optional(v.string()),
    comboType: v.optional(v.string()),
    combos: v.optional(v.array(v.object({
      partName: v.string(),
      color: v.string(),
      pcsCount: v.optional(v.number()),
      powerTableRate: v.optional(v.number()),
      cuttingRate: v.optional(v.number()),
      singerRate: v.optional(v.number()),
      overlockRate: v.optional(v.number()),
      checkingRate: v.optional(v.number()),
      threadRate: v.optional(v.number()),
      ironingRate: v.optional(v.number()),
      packingRate: v.optional(v.number()),
      customRates: v.optional(v.array(v.object({
        name: v.string(),
        val: v.number()
      })))
    }))),
    powerTableRate: v.optional(v.number()),
    cuttingRate: v.optional(v.number()),
    singerRate: v.optional(v.number()),
    overlockRate: v.optional(v.number()),
    checkingRate: v.optional(v.number()),
    threadRate: v.optional(v.number()),
    ironingRate: v.optional(v.number()),
    packingRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("job_orders", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const updateStage = mutation({
  args: {
    id: v.id("job_orders"),
    stage: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("job_orders") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

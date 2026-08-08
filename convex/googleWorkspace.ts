import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";

// Query Google Workspace integration settings
export const getSettings = query({
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "googleworkspace"))
      .first();
    
    if (!setting) {
      return {
        key: "googleworkspace",
        googleClientId: "470877995175-98uq9m0k20l9eaf27p2j9r6r8r0j1qkr.apps.googleusercontent.com",
        googleClientSecret: "",
        googleWorkspaceDomain: "varahiexports.com",
        autoSyncDrive: true,
        autoSyncSheets: true,
        isDomainRestricted: false,
        isEnabled: true,
        updatedAt: new Date().toISOString()
      };
    }
    return setting;
  },
});

// Save or update Google Workspace credentials & options
export const saveSettings = mutation({
  args: {
    googleClientId: v.string(),
    googleClientSecret: v.optional(v.string()),
    googleWorkspaceDomain: v.optional(v.string()),
    autoSyncDrive: v.optional(v.boolean()),
    autoSyncSheets: v.optional(v.boolean()),
    isDomainRestricted: v.optional(v.boolean()),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "googleworkspace"))
      .first();

    const payload = {
      key: "googleworkspace",
      googleClientId: args.googleClientId.trim(),
      googleClientSecret: (args.googleClientSecret || "").trim(),
      googleWorkspaceDomain: (args.googleWorkspaceDomain || "").trim(),
      autoSyncDrive: args.autoSyncDrive ?? true,
      autoSyncSheets: args.autoSyncSheets ?? true,
      isDomainRestricted: args.isDomainRestricted ?? false,
      isEnabled: args.isEnabled,
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    } else {
      const newId = await ctx.db.insert("settings", payload);
      return newId;
    }
  },
});

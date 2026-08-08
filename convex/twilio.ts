import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";

// Query Twilio integration settings
export const getSettings = query({
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "twilio"))
      .first();
    
    if (!setting) {
      return {
        key: "twilio",
        accountSid: "",
        authToken: "",
        fromPhone: "",
        whatsappPhone: "",
        isEnabled: false,
        autoSendInvoices: true,
        autoSendAdvances: true,
        updatedAt: new Date().toISOString()
      };
    }
    return setting;
  },
});

// Save or update Twilio credentials & options
export const saveSettings = mutation({
  args: {
    accountSid: v.string(),
    authToken: v.string(),
    fromPhone: v.string(),
    whatsappPhone: v.optional(v.string()),
    isEnabled: v.boolean(),
    autoSendInvoices: v.optional(v.boolean()),
    autoSendAdvances: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "twilio"))
      .first();

    const payload = {
      key: "twilio",
      accountSid: args.accountSid.trim(),
      authToken: args.authToken.trim(),
      fromPhone: args.fromPhone.trim(),
      whatsappPhone: (args.whatsappPhone || "").trim(),
      isEnabled: args.isEnabled,
      autoSendInvoices: args.autoSendInvoices ?? true,
      autoSendAdvances: args.autoSendAdvances ?? true,
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

// Action to send SMS / WhatsApp alert via Twilio REST API
export const sendTwilioMessage = action({
  args: {
    to: v.string(),
    body: v.string(),
    isWhatsapp: v.optional(v.boolean()),
    accountSid: v.optional(v.string()),
    authToken: v.optional(v.string()),
    fromPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const accountSid = args.accountSid;
    const authToken = args.authToken;
    let from = args.fromPhone;

    if (!accountSid || !authToken || !from) {
      return { success: false, error: "Missing Twilio Account SID, Auth Token, or From Number." };
    }

    let recipient = args.to.trim();
    if (args.isWhatsapp) {
      if (!from.startsWith("whatsapp:")) from = `whatsapp:${from}`;
      if (!recipient.startsWith("whatsapp:")) recipient = `whatsapp:${recipient}`;
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const formData = new URLSearchParams();
    formData.append("To", recipient);
    formData.append("From", from);
    formData.append("Body", args.body);

    try {
      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.message || `Twilio Error ${data.code || response.status}`,
          data,
        };
      }

      return {
        success: true,
        messageId: data.sid,
        status: data.status,
        dateCreated: data.date_created,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to reach Twilio API",
      };
    }
  },
});

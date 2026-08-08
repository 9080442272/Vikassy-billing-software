import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";

// Query ElevenLabs integration settings
export const getSettings = query({
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "elevenlabs"))
      .first();
    
    if (!setting) {
      return {
        key: "elevenlabs",
        apiKey: "",
        voiceId: "21m00Tcm4TlvDq8ikWAM", // Default Rachel
        modelId: "eleven_multilingual_v2",
        isEnabled: false,
        updatedAt: new Date().toISOString()
      };
    }
    return setting;
  },
});

// Save or update ElevenLabs credentials & options
export const saveSettings = mutation({
  args: {
    apiKey: v.string(),
    voiceId: v.string(),
    modelId: v.optional(v.string()),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "elevenlabs"))
      .first();

    const payload = {
      key: "elevenlabs",
      apiKey: args.apiKey.trim(),
      voiceId: args.voiceId.trim(),
      modelId: args.modelId || "eleven_multilingual_v2",
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

// Action to generate text-to-speech audio via ElevenLabs API
export const generateSpeech = action({
  args: {
    text: v.string(),
    apiKey: v.optional(v.string()),
    voiceId: v.optional(v.string()),
    modelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = args.apiKey;
    const voiceId = args.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default Rachel
    const modelId = args.modelId || "eleven_multilingual_v2";

    if (!apiKey) {
      return { success: false, error: "Missing ElevenLabs API Key." };
    }

    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    try {
      const response = await fetch(elevenLabsUrl, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: args.text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.detail?.message || `ElevenLabs API Error HTTP ${response.status}`,
        };
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString("base64");

      return {
        success: true,
        audioData: `data:audio/mpeg;base64,${base64Audio}`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to reach ElevenLabs API",
      };
    }
  },
});

import { mutation } from "./_generated/server";

export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all records from data tables
    const tables = [
      "clients",
      "bills",
      "employees",
      "fabrics",
      "stitching",
      "ceo_activities",
      "expenses",
      "upcoming_orders"
    ] as const;

    for (const tableName of tables) {
      const records = await ctx.db.query(tableName).collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
    }
    return true;
  },
});

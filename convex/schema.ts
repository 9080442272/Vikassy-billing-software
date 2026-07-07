import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  clients: defineTable({
    name: v.string(),
    companyName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    gstin: v.optional(v.string()),
    address: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_name", ["name"]),

  bills: defineTable({
    clientId: v.string(), // References clients ID
    billNumber: v.string(),
    date: v.string(),
    billType: v.string(),
    items: v.array(v.object({
      name: v.string(),
      price: v.number(),
      qty: v.number(),
      gstRate: v.number(),
      gstAmount: v.number(),
      total: v.number(),
    })),
    discount: v.number(),
    subtotal: v.number(),
    totalGst: v.number(),
    totalAmount: v.number(),
    fileData: v.optional(v.string()), // base64 attachment
    fileName: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_clientId", ["clientId"]),

  employees: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.string(),
    subCategory: v.optional(v.string()),
    stitchRate: v.number(),
    salary: v.number(),
    createdAt: v.string(),
  }),

  fabrics: defineTable({
    fabricType: v.string(),
    quantityReceived: v.number(),
    color: v.string(),
    receivedDate: v.string(),
    supplier: v.string(),
    status: v.string(),
    createdAt: v.string(),
  }),

  stitching: defineTable({
    employeeId: v.string(), // References employees ID
    fabricId: v.string(), // References fabrics ID
    piecesStitched: v.number(),
    ratePerPiece: v.number(),
    totalPayment: v.number(),
    assignedDate: v.string(),
    status: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_employeeId", ["employeeId"]),

  ceo_activities: defineTable({
    date: v.string(),
    focusArea: v.string(),
    description: v.string(),
    hoursSpent: v.number(),
    productivityLevel: v.string(),
    isCritical: v.boolean(),
    createdAt: v.string(),
  }),

  users: defineTable({
    username: v.string(),
    password: v.string(),
    email: v.optional(v.string()),
    fullName: v.optional(v.string()),
    avatarPicture: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_username", ["username"]),
});

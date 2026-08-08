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
    paymentStatus: v.optional(v.string()),
    status: v.optional(v.string()),
    shipmentQty: v.optional(v.number()),
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

  expenses: defineTable({
    billId: v.optional(v.string()),
    category: v.string(),
    amount: v.number(),
    description: v.string(),
    date: v.string(),
    createdAt: v.string(),
  }).index("by_billId", ["billId"]),

  users: defineTable({
    username: v.string(),
    password: v.string(),
    email: v.optional(v.string()),
    fullName: v.optional(v.string()),
    avatarPicture: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_username", ["username"]),

  upcoming_orders: defineTable({
    clientId: v.optional(v.string()),
    clientName: v.string(),
    orderTitle: v.string(),
    deliveryDate: v.string(),
    estimatedValue: v.number(),
    status: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_deliveryDate", ["deliveryDate"]),

  attendance: defineTable({
    employeeId: v.optional(v.string()),
    empName: v.string(),
    date: v.string(),
    shift: v.string(),
    status: v.string(),
    overtimeHours: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_date", ["date"]),

  investments: defineTable({
    date: v.string(),
    type: v.string(),
    amount: v.number(),
    linkedOrder: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_date", ["date"]),

  advance_records: defineTable({
    employeeId: v.optional(v.string()),
    empName: v.string(),
    date: v.string(),
    type: v.string(),
    amount: v.number(),
    mode: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_date", ["date"]),

  payroll_records: defineTable({
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
  }).index("by_month", ["month"]),

  job_orders: defineTable({
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
    createdAt: v.string(),
  }).index("by_status", ["status"]).index("by_stage", ["stage"]),

  settings: defineTable({
    key: v.string(),
    accountSid: v.optional(v.string()),
    authToken: v.optional(v.string()),
    fromPhone: v.optional(v.string()),
    whatsappPhone: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    voiceId: v.optional(v.string()),
    modelId: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
    autoSendInvoices: v.optional(v.boolean()),
    autoSendAdvances: v.optional(v.boolean()),
    updatedAt: v.string(),
  }).index("by_key", ["key"]),
});

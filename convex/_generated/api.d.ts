/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as advances from "../advances.js";
import type * as attendance from "../attendance.js";
import type * as bills from "../bills.js";
import type * as ceoActivities from "../ceoActivities.js";
import type * as clients from "../clients.js";
import type * as employees from "../employees.js";
import type * as expenses from "../expenses.js";
import type * as fabrics from "../fabrics.js";
import type * as investments from "../investments.js";
import type * as payroll from "../payroll.js";
import type * as stitching from "../stitching.js";
import type * as system from "../system.js";
import type * as upcomingOrders from "../upcomingOrders.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  advances: typeof advances;
  attendance: typeof attendance;
  bills: typeof bills;
  ceoActivities: typeof ceoActivities;
  clients: typeof clients;
  employees: typeof employees;
  expenses: typeof expenses;
  fabrics: typeof fabrics;
  investments: typeof investments;
  payroll: typeof payroll;
  stitching: typeof stitching;
  system: typeof system;
  upcomingOrders: typeof upcomingOrders;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

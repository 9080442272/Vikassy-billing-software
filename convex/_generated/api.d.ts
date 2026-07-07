import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as bills from "../bills.js";
import type * as ceoActivities from "../ceoActivities.js";
import type * as clients from "../clients.js";
import type * as employees from "../employees.js";
import type * as fabrics from "../fabrics.js";
import type * as stitching from "../stitching.js";
import type * as users from "../users.js";

declare const fullApi: ApiFromModules<{
  bills: typeof bills;
  ceoActivities: typeof ceoActivities;
  clients: typeof clients;
  employees: typeof employees;
  fabrics: typeof fabrics;
  stitching: typeof stitching;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

import type {
  ApiPageSize,
  ListParams,
  Scope,
  Sort,
  VersionListParams,
  VersionPageSize,
} from "@prompty-tools/core";
import { z } from "zod";

const API_PAGE_SIZE_SCHEMA = z.union([
  z.literal(6),
  z.literal(12),
  z.literal(24),
  z.literal(48),
  z.literal(100),
]);

const VERSION_PAGE_SIZE_SCHEMA = z.union([
  z.literal(10),
  z.literal(20),
  z.literal(50),
]);

export const listParamsShape = {
  page: z.number().int().min(1).optional().describe("1-based page number. Default: 1."),
  pageSize: API_PAGE_SIZE_SCHEMA.optional().describe(
    "Items per page. The server only accepts these exact values. Default: 12.",
  ),
  sort: z
    .enum(["newest", "most-upvoted", "most-favorited"])
    .optional()
    .describe("Sort order. Default: newest."),
  scope: z
    .enum(["public", "mine", "favorites", "all"])
    .optional()
    .describe(
      "public = community items, mine = the user's own items, favorites = items the user favorited, all = everything accessible to the user. Default: public.",
    ),
  search: z
    .string()
    .max(200)
    .optional()
    .describe("Full-text search over title and description. Max 200 characters."),
  tag: z.string().optional().describe("Filter by a single tag (exact match)."),
};

export interface ListArgs {
  page?: number;
  pageSize?: ApiPageSize;
  sort?: Sort;
  scope?: Scope;
  search?: string;
  tag?: string;
}

export function toListParams(args: ListArgs): ListParams {
  const params: ListParams = {};
  if (args.page !== undefined) params.page = args.page;
  if (args.pageSize !== undefined) params.pageSize = args.pageSize;
  if (args.sort !== undefined) params.sort = args.sort;
  if (args.scope !== undefined) params.scope = args.scope;
  if (args.search !== undefined) params.search = args.search;
  if (args.tag !== undefined) params.tag = args.tag;
  return params;
}

export const versionListParamsShape = {
  page: z.number().int().min(1).optional().describe("1-based page number. Default: 1."),
  pageSize: VERSION_PAGE_SIZE_SCHEMA.optional().describe(
    "Items per page. The server only accepts these exact values. Default: 20.",
  ),
};

export interface VersionListArgs {
  page?: number;
  pageSize?: VersionPageSize;
}

export function toVersionListParams(args: VersionListArgs): VersionListParams {
  const params: VersionListParams = {};
  if (args.page !== undefined) params.page = args.page;
  if (args.pageSize !== undefined) params.pageSize = args.pageSize;
  return params;
}

export const tagsField = z
  .array(z.string())
  .optional()
  .describe("Tags for categorisation and tag-filtered search.");

export const isPublicField = z
  .boolean()
  .describe(
    "true publishes the item to the public community feed; false keeps it private to the user. Required: choose deliberately, server defaults are not applied.",
  );

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Page } from "@prompty-tools/core";
import {
  PromptyError,
  PromptyHttpError,
  PromptyRateLimitError,
} from "@prompty-tools/core";

export function toTextResult(data: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

export interface PageResult<T> {
  items: readonly T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function toPageResult<T>(page: Page<T>): PageResult<T> {
  return {
    items: page.items,
    total: page.total,
    page: page.page,
    pageSize: page.pageSize,
    hasNext: page.hasNext,
    hasPrev: page.hasPrev,
  };
}

const RATE_LIMIT_HINT =
  "Daily request quotas per subscription tier: free 20, pro 1,000, teams 10,000. " +
  "Requests are additionally limited to 30 per minute per action. Do not retry automatically.";

export function toErrorResult(err: unknown): CallToolResult {
  return { isError: true, content: [{ type: "text", text: errorText(err) }] };
}

function errorText(err: unknown): string {
  if (err instanceof PromptyRateLimitError) {
    const retryAfter = err.retryAfter !== undefined ? ` Retry-After: ${err.retryAfter}s.` : "";
    return `${err.name} (HTTP 429): ${err.message}.${retryAfter} ${RATE_LIMIT_HINT}`;
  }
  if (err instanceof PromptyHttpError) {
    const requestId = err.requestId !== undefined ? ` (requestId: ${err.requestId})` : "";
    return `${err.name} (HTTP ${err.status}): ${err.message}${requestId}`;
  }
  if (err instanceof PromptyError) {
    return `${err.name}: ${err.message}`;
  }
  return `Unexpected error: ${err instanceof Error ? err.message : String(err)}`;
}

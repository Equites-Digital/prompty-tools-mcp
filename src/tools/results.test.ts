import {
  PromptyAuthError,
  PromptyNetworkError,
  PromptyNotFoundError,
  PromptyRateLimitError,
  PromptyServerError,
} from "@prompty-tools/core";
import { describe, expect, it } from "vitest";
import { fakePage } from "../test-utils/prompty.js";
import { toErrorResult, toPageResult, toTextResult } from "./results.js";

function textOf(result: { content: { type: string; text?: string }[] }): string {
  const first = result.content[0];
  if (first?.type !== "text" || first.text === undefined) {
    throw new Error("expected a text content block");
  }
  return first.text;
}

describe("toTextResult", () => {
  it("serialises the data as pretty-printed JSON", () => {
    const result = toTextResult({ id: "p1", title: "Test" });
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(textOf(result))).toEqual({ id: "p1", title: "Test" });
  });
});

describe("toPageResult", () => {
  it("maps page fields and drops the navigation methods", () => {
    const page = fakePage([{ id: "a" }], {
      total: 30,
      page: 2,
      pageSize: 12,
      hasNext: true,
      hasPrev: true,
    });
    expect(toPageResult(page)).toEqual({
      items: [{ id: "a" }],
      total: 30,
      page: 2,
      pageSize: 12,
      hasNext: true,
      hasPrev: true,
    });
  });
});

describe("toErrorResult", () => {
  it("marks the result as an error", () => {
    expect(toErrorResult(new Error("boom")).isError).toBe(true);
  });

  it("includes status and message for HTTP errors", () => {
    const text = textOf(toErrorResult(new PromptyNotFoundError("Prompt not found", 404)));
    expect(text).toContain("PromptyNotFoundError");
    expect(text).toContain("HTTP 404");
    expect(text).toContain("Prompt not found");
  });

  it("includes the requestId when present", () => {
    const err = new PromptyServerError("Internal error", 500, { requestId: "corr-123" });
    expect(textOf(toErrorResult(err))).toContain("requestId: corr-123");
  });

  it("omits the requestId clause when absent", () => {
    const err = new PromptyAuthError("Unauthorized", 401);
    expect(textOf(toErrorResult(err))).not.toContain("requestId");
  });

  it("appends quota details and Retry-After on rate-limit errors", () => {
    const err = new PromptyRateLimitError("Rate limit exceeded", { retryAfter: 42 });
    const text = textOf(toErrorResult(err));
    expect(text).toContain("HTTP 429");
    expect(text).toContain("Retry-After: 42s");
    expect(text).toContain("free 20, pro 1,000, teams 10,000");
    expect(text).toContain("Do not retry automatically");
  });

  it("appends quota details without Retry-After when the header was missing", () => {
    const text = textOf(toErrorResult(new PromptyRateLimitError("Rate limit exceeded")));
    expect(text).not.toContain("Retry-After");
    expect(text).toContain("free 20, pro 1,000, teams 10,000");
  });

  it("formats non-HTTP prompty errors with their name", () => {
    const text = textOf(toErrorResult(new PromptyNetworkError("fetch failed")));
    expect(text).toBe("PromptyNetworkError: fetch failed");
  });

  it("falls back to the message for unexpected Error instances", () => {
    expect(textOf(toErrorResult(new Error("boom")))).toBe("Unexpected error: boom");
  });

  it("stringifies non-Error throwables", () => {
    expect(textOf(toErrorResult("boom"))).toBe("Unexpected error: boom");
  });
});

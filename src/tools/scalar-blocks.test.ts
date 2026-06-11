import { PromptyValidationError } from "@prompty-tools/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  callToolError,
  callToolOk,
  setupToolTest,
  type ToolTestContext,
} from "../test-utils/harness.js";
import { fakePage } from "../test-utils/prompty.js";

const RESOURCES = [
  { key: "tones", singular: "tone", valueField: "label" },
  { key: "outputs", singular: "output", valueField: "label" },
  { key: "constraints", singular: "constraint", valueField: "text" },
] as const;

describe.each(RESOURCES)("$singular tools", ({ key, singular, valueField }) => {
  let ctx: ToolTestContext;

  beforeEach(async () => {
    ctx = await setupToolTest();
  });

  afterEach(async () => {
    await ctx.server.close();
  });

  it(`search_${key} forwards list params and returns a page result`, async () => {
    ctx.stub[key].list.mockResolvedValue(fakePage([{ id: "b1" }]));
    const result = await callToolOk(ctx.mcp, `search_${key}`, { scope: "mine", search: "dir" });
    expect(ctx.stub[key].list).toHaveBeenCalledWith({ scope: "mine", search: "dir" });
    expect(result).toMatchObject({ items: [{ id: "b1" }] });
  });

  it(`get_${singular} returns the detail`, async () => {
    ctx.stub[key].get.mockResolvedValue({ id: "b1", [valueField]: "value" });
    const result = await callToolOk(ctx.mcp, `get_${singular}`, { id: "b1" });
    expect(ctx.stub[key].get).toHaveBeenCalledWith("b1");
    expect(result).toEqual({ id: "b1", [valueField]: "value" });
  });

  it(`create_${singular} sends only the provided fields`, async () => {
    ctx.stub[key].create.mockResolvedValue({ id: "b-new" });
    const result = await callToolOk(ctx.mcp, `create_${singular}`, {
      [valueField]: "direct",
      isPublic: false,
    });
    expect(ctx.stub[key].create).toHaveBeenCalledWith({ [valueField]: "direct", isPublic: false });
    expect(result).toEqual({ id: "b-new" });
  });

  it(`create_${singular} forwards tags`, async () => {
    ctx.stub[key].create.mockResolvedValue({ id: "b-new" });
    await callToolOk(ctx.mcp, `create_${singular}`, {
      [valueField]: "direct",
      isPublic: true,
      tags: ["style"],
    });
    expect(ctx.stub[key].create).toHaveBeenCalledWith({
      [valueField]: "direct",
      isPublic: true,
      tags: ["style"],
    });
  });

  it(`create_${singular} requires an explicit isPublic choice`, async () => {
    await expect(
      callToolOk(ctx.mcp, `create_${singular}`, { [valueField]: "direct" }),
    ).rejects.toThrowError(/invalid arguments|isPublic/i);
    expect(ctx.stub[key].create).not.toHaveBeenCalled();
  });

  it(`update_${singular} sends only the provided fields and confirms`, async () => {
    ctx.stub[key].update.mockResolvedValue(undefined);
    const result = await callToolOk(ctx.mcp, `update_${singular}`, {
      id: "b1",
      [valueField]: "sharper",
    });
    expect(ctx.stub[key].update).toHaveBeenCalledWith("b1", { [valueField]: "sharper" });
    expect(result).toEqual({ success: true, id: "b1" });
  });

  it(`update_${singular} forwards visibility and tags when set`, async () => {
    ctx.stub[key].update.mockResolvedValue(undefined);
    await callToolOk(ctx.mcp, `update_${singular}`, {
      id: "b1",
      [valueField]: "sharper",
      isPublic: false,
      tags: ["style"],
    });
    expect(ctx.stub[key].update).toHaveBeenCalledWith("b1", {
      [valueField]: "sharper",
      isPublic: false,
      tags: ["style"],
    });
  });

  it("surfaces platform errors as tool errors", async () => {
    ctx.stub[key].create.mockRejectedValue(new PromptyValidationError("Too long", 400));
    const text = await callToolError(ctx.mcp, `create_${singular}`, {
      [valueField]: "x",
      isPublic: true,
    });
    expect(text).toContain("HTTP 400");
    expect(text).toContain("Too long");
  });
});

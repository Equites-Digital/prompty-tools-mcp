import { PromptyNotFoundError } from "@prompty-tools/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  callToolError,
  callToolOk,
  setupToolTest,
  type ToolTestContext,
} from "../test-utils/harness.js";
import { fakePage } from "../test-utils/prompty.js";

describe("prompt tools", () => {
  let ctx: ToolTestContext;

  beforeEach(async () => {
    ctx = await setupToolTest();
  });

  afterEach(async () => {
    await ctx.server.close();
  });

  it("search_prompts forwards list params and returns a page result", async () => {
    ctx.stub.prompts.list.mockResolvedValue(
      fakePage([{ id: "p1", title: "A" }], { total: 40, page: 2, pageSize: 24, hasNext: true, hasPrev: true }),
    );
    const result = await callToolOk(ctx.mcp, "search_prompts", {
      page: 2,
      pageSize: 24,
      sort: "most-upvoted",
      scope: "mine",
      search: "react",
      tag: "frontend",
    });
    expect(ctx.stub.prompts.list).toHaveBeenCalledWith({
      page: 2,
      pageSize: 24,
      sort: "most-upvoted",
      scope: "mine",
      search: "react",
      tag: "frontend",
    });
    expect(result).toEqual({
      items: [{ id: "p1", title: "A" }],
      total: 40,
      page: 2,
      pageSize: 24,
      hasNext: true,
      hasPrev: true,
    });
  });

  it("get_prompt returns the prompt detail", async () => {
    ctx.stub.prompts.get.mockResolvedValue({ id: "p1", compiledPrompt: "You are X." });
    const result = await callToolOk(ctx.mcp, "get_prompt", { id: "p1" });
    expect(ctx.stub.prompts.get).toHaveBeenCalledWith("p1");
    expect(result).toEqual({ id: "p1", compiledPrompt: "You are X." });
  });

  it("list_prompt_versions forwards version list params", async () => {
    ctx.stub.prompts.listVersions.mockResolvedValue(fakePage([{ id: "v1", version: 1 }]));
    const result = await callToolOk(ctx.mcp, "list_prompt_versions", {
      id: "p1",
      page: 2,
      pageSize: 10,
    });
    expect(ctx.stub.prompts.listVersions).toHaveBeenCalledWith("p1", { page: 2, pageSize: 10 });
    expect(result).toMatchObject({ items: [{ id: "v1", version: 1 }] });
  });

  it("get_prompt_version fetches a specific version", async () => {
    ctx.stub.prompts.getVersion.mockResolvedValue({ id: "v2", version: 2 });
    const result = await callToolOk(ctx.mcp, "get_prompt_version", { id: "p1", versionId: "v2" });
    expect(ctx.stub.prompts.getVersion).toHaveBeenCalledWith("p1", "v2");
    expect(result).toEqual({ id: "v2", version: 2 });
  });

  it("create_prompt sends only the provided fields", async () => {
    ctx.stub.prompts.create.mockResolvedValue({ id: "p-new" });
    await callToolOk(ctx.mcp, "create_prompt", {
      title: "T",
      task: "Do it",
      isPublic: false,
    });
    expect(ctx.stub.prompts.create).toHaveBeenCalledWith({
      title: "T",
      task: "Do it",
      isPublic: false,
    });
  });

  it("create_prompt forwards building-block references, description, and tags", async () => {
    ctx.stub.prompts.create.mockResolvedValue({ id: "p-new" });
    const result = await callToolOk(ctx.mcp, "create_prompt", {
      title: "T",
      task: "Do it",
      isPublic: true,
      description: "About",
      personaVersionId: "pv1",
      outputId: "o1",
      toneIds: ["t1", "t2"],
      constraintIds: ["c1"],
      tags: ["dev"],
    });
    expect(ctx.stub.prompts.create).toHaveBeenCalledWith({
      title: "T",
      task: "Do it",
      isPublic: true,
      description: "About",
      personaVersionId: "pv1",
      outputId: "o1",
      toneIds: ["t1", "t2"],
      constraintIds: ["c1"],
      tags: ["dev"],
    });
    expect(result).toEqual({ id: "p-new" });
  });

  it("create_prompt requires an explicit isPublic choice", async () => {
    await expect(
      callToolOk(ctx.mcp, "create_prompt", { title: "T", task: "Do it" }),
    ).rejects.toThrowError(/invalid arguments|isPublic/i);
    expect(ctx.stub.prompts.create).not.toHaveBeenCalled();
  });

  it("update_prompt sends the full state with changelog and confirms", async () => {
    ctx.stub.prompts.update.mockResolvedValue(undefined);
    const result = await callToolOk(ctx.mcp, "update_prompt", {
      id: "p1",
      title: "T2",
      task: "Do it better",
      changelog: "Tightened task",
      toneIds: ["t9"],
    });
    expect(ctx.stub.prompts.update).toHaveBeenCalledWith("p1", {
      title: "T2",
      task: "Do it better",
      changelog: "Tightened task",
      toneIds: ["t9"],
    });
    expect(result).toEqual({ success: true, id: "p1" });
  });

  it("set_prompt_visibility toggles and confirms", async () => {
    ctx.stub.prompts.setVisibility.mockResolvedValue(undefined);
    const result = await callToolOk(ctx.mcp, "set_prompt_visibility", {
      id: "p1",
      isPublic: false,
    });
    expect(ctx.stub.prompts.setVisibility).toHaveBeenCalledWith("p1", false);
    expect(result).toEqual({ success: true, id: "p1", isPublic: false });
  });

  it("surfaces platform errors as tool errors", async () => {
    ctx.stub.prompts.get.mockRejectedValue(new PromptyNotFoundError("Prompt not found", 404));
    const text = await callToolError(ctx.mcp, "get_prompt", { id: "missing" });
    expect(text).toContain("HTTP 404");
    expect(text).toContain("Prompt not found");
  });
});

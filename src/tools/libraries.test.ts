import { PromptyNotFoundError } from "@prompty-tools/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  callToolError,
  callToolOk,
  setupToolTest,
  type ToolTestContext,
} from "../test-utils/harness.js";
import { fakePage } from "../test-utils/prompty.js";

describe("library tools", () => {
  let ctx: ToolTestContext;

  beforeEach(async () => {
    ctx = await setupToolTest();
  });

  afterEach(async () => {
    await ctx.server.close();
  });

  it("search_libraries forwards list params and returns a page result", async () => {
    ctx.stub.libraries.list.mockResolvedValue(fakePage([{ id: "l1", name: "Marketing" }]));
    const result = await callToolOk(ctx.mcp, "search_libraries", { scope: "mine" });
    expect(ctx.stub.libraries.list).toHaveBeenCalledWith({ scope: "mine" });
    expect(result).toMatchObject({ items: [{ id: "l1", name: "Marketing" }] });
  });

  it("get_library returns the detail", async () => {
    ctx.stub.libraries.get.mockResolvedValue({ id: "l1", promptCount: 3 });
    const result = await callToolOk(ctx.mcp, "get_library", { id: "l1" });
    expect(ctx.stub.libraries.get).toHaveBeenCalledWith("l1");
    expect(result).toEqual({ id: "l1", promptCount: 3 });
  });

  it("list_library_prompts forwards the library id and list params", async () => {
    ctx.stub.libraries.listPrompts.mockResolvedValue(fakePage([{ id: "p1" }]));
    const result = await callToolOk(ctx.mcp, "list_library_prompts", {
      id: "l1",
      search: "react",
      pageSize: 6,
    });
    expect(ctx.stub.libraries.listPrompts).toHaveBeenCalledWith("l1", {
      search: "react",
      pageSize: 6,
    });
    expect(result).toMatchObject({ items: [{ id: "p1" }] });
  });

  it("create_library sends only the provided fields", async () => {
    ctx.stub.libraries.create.mockResolvedValue({ id: "l-new", name: "Research" });
    const result = await callToolOk(ctx.mcp, "create_library", {
      name: "Research",
      isPublic: false,
    });
    expect(ctx.stub.libraries.create).toHaveBeenCalledWith({ name: "Research", isPublic: false });
    expect(result).toEqual({ id: "l-new", name: "Research" });
  });

  it("create_library forwards description and tags", async () => {
    ctx.stub.libraries.create.mockResolvedValue({ id: "l-new" });
    await callToolOk(ctx.mcp, "create_library", {
      name: "Research",
      isPublic: true,
      description: "Deep dives",
      tags: ["science"],
    });
    expect(ctx.stub.libraries.create).toHaveBeenCalledWith({
      name: "Research",
      isPublic: true,
      description: "Deep dives",
      tags: ["science"],
    });
  });

  it("create_library requires an explicit isPublic choice", async () => {
    await expect(callToolOk(ctx.mcp, "create_library", { name: "Research" })).rejects.toThrowError(
      /invalid arguments|isPublic/i,
    );
    expect(ctx.stub.libraries.create).not.toHaveBeenCalled();
  });

  it("update_library sends the full state and confirms", async () => {
    ctx.stub.libraries.update.mockResolvedValue(undefined);
    const result = await callToolOk(ctx.mcp, "update_library", {
      id: "l1",
      name: "Research v2",
      description: "Updated",
      isPublic: true,
      tags: ["science"],
    });
    expect(ctx.stub.libraries.update).toHaveBeenCalledWith("l1", {
      name: "Research v2",
      description: "Updated",
      isPublic: true,
      tags: ["science"],
    });
    expect(result).toEqual({ success: true, id: "l1" });
  });

  it("update_library works with just the required name", async () => {
    ctx.stub.libraries.update.mockResolvedValue(undefined);
    await callToolOk(ctx.mcp, "update_library", { id: "l1", name: "Research" });
    expect(ctx.stub.libraries.update).toHaveBeenCalledWith("l1", { name: "Research" });
  });

  it("add_prompt_to_library adds membership and confirms", async () => {
    ctx.stub.libraries.addPrompt.mockResolvedValue(undefined);
    const result = await callToolOk(ctx.mcp, "add_prompt_to_library", {
      id: "l1",
      promptId: "p1",
    });
    expect(ctx.stub.libraries.addPrompt).toHaveBeenCalledWith("l1", "p1");
    expect(result).toEqual({ success: true, id: "l1", promptId: "p1" });
  });

  it("remove_prompt_from_library removes membership and confirms", async () => {
    ctx.stub.libraries.removePrompt.mockResolvedValue(undefined);
    const result = await callToolOk(ctx.mcp, "remove_prompt_from_library", {
      id: "l1",
      promptId: "p1",
    });
    expect(ctx.stub.libraries.removePrompt).toHaveBeenCalledWith("l1", "p1");
    expect(result).toEqual({ success: true, id: "l1", promptId: "p1" });
  });

  it("surfaces platform errors as tool errors", async () => {
    ctx.stub.libraries.addPrompt.mockRejectedValue(
      new PromptyNotFoundError("Library not found", 404),
    );
    const text = await callToolError(ctx.mcp, "add_prompt_to_library", {
      id: "missing",
      promptId: "p1",
    });
    expect(text).toContain("HTTP 404");
    expect(text).toContain("Library not found");
  });
});

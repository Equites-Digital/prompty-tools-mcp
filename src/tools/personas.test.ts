import { PromptyHttpError } from "@prompty-tools/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  callToolError,
  callToolOk,
  setupToolTest,
  type ToolTestContext,
} from "../test-utils/harness.js";
import { fakePage } from "../test-utils/prompty.js";

describe("persona tools", () => {
  let ctx: ToolTestContext;

  beforeEach(async () => {
    ctx = await setupToolTest();
  });

  afterEach(async () => {
    await ctx.server.close();
  });

  it("search_personas forwards list params and returns a page result", async () => {
    ctx.stub.personas.list.mockResolvedValue(fakePage([{ id: "pe1", versionId: "pv1" }]));
    const result = await callToolOk(ctx.mcp, "search_personas", { scope: "favorites" });
    expect(ctx.stub.personas.list).toHaveBeenCalledWith({ scope: "favorites" });
    expect(result).toMatchObject({ items: [{ id: "pe1", versionId: "pv1" }] });
  });

  it("get_persona returns the persona detail", async () => {
    ctx.stub.personas.get.mockResolvedValue({ id: "pe1", latestVersionId: "pv9" });
    const result = await callToolOk(ctx.mcp, "get_persona", { id: "pe1" });
    expect(ctx.stub.personas.get).toHaveBeenCalledWith("pe1");
    expect(result).toEqual({ id: "pe1", latestVersionId: "pv9" });
  });

  it("list_persona_versions forwards version list params", async () => {
    ctx.stub.personas.listVersions.mockResolvedValue(fakePage([{ id: "pv1", version: 1 }]));
    const result = await callToolOk(ctx.mcp, "list_persona_versions", { id: "pe1", pageSize: 50 });
    expect(ctx.stub.personas.listVersions).toHaveBeenCalledWith("pe1", { pageSize: 50 });
    expect(result).toMatchObject({ items: [{ id: "pv1", version: 1 }] });
  });

  it("get_persona_version fetches a specific version", async () => {
    ctx.stub.personas.getVersion.mockResolvedValue({ id: "pv2", version: 2 });
    const result = await callToolOk(ctx.mcp, "get_persona_version", {
      id: "pe1",
      versionId: "pv2",
    });
    expect(ctx.stub.personas.getVersion).toHaveBeenCalledWith("pe1", "pv2");
    expect(result).toEqual({ id: "pv2", version: 2 });
  });

  it("create_persona sends only the provided fields", async () => {
    ctx.stub.personas.create.mockResolvedValue({ id: "pe-new", versionId: "pv-new" });
    const result = await callToolOk(ctx.mcp, "create_persona", {
      title: "a code reviewer",
      isPublic: false,
    });
    expect(ctx.stub.personas.create).toHaveBeenCalledWith({
      title: "a code reviewer",
      isPublic: false,
    });
    expect(result).toEqual({ id: "pe-new", versionId: "pv-new" });
  });

  it("create_persona forwards description and tags", async () => {
    ctx.stub.personas.create.mockResolvedValue({ id: "pe-new", versionId: "pv-new" });
    await callToolOk(ctx.mcp, "create_persona", {
      title: "a code reviewer",
      isPublic: true,
      description: "Thorough and direct.",
      tags: ["engineering"],
    });
    expect(ctx.stub.personas.create).toHaveBeenCalledWith({
      title: "a code reviewer",
      isPublic: true,
      description: "Thorough and direct.",
      tags: ["engineering"],
    });
  });

  it("create_persona requires an explicit isPublic choice", async () => {
    await expect(
      callToolOk(ctx.mcp, "create_persona", { title: "a code reviewer" }),
    ).rejects.toThrowError(/invalid arguments|isPublic/i);
    expect(ctx.stub.personas.create).not.toHaveBeenCalled();
  });

  it("update_persona sends the full state and confirms", async () => {
    ctx.stub.personas.update.mockResolvedValue(undefined);
    const result = await callToolOk(ctx.mcp, "update_persona", {
      id: "pe1",
      title: "a staff code reviewer",
      description: "More seniority.",
      changelog: "Raised seniority",
      tags: ["engineering"],
    });
    expect(ctx.stub.personas.update).toHaveBeenCalledWith("pe1", {
      title: "a staff code reviewer",
      description: "More seniority.",
      changelog: "Raised seniority",
      tags: ["engineering"],
    });
    expect(result).toEqual({ success: true, id: "pe1" });
  });

  it("update_persona works without the optional changelog", async () => {
    ctx.stub.personas.update.mockResolvedValue(undefined);
    await callToolOk(ctx.mcp, "update_persona", { id: "pe1", title: "renamed" });
    expect(ctx.stub.personas.update).toHaveBeenCalledWith("pe1", { title: "renamed" });
  });

  it("set_persona_visibility toggles and confirms", async () => {
    ctx.stub.personas.setVisibility.mockResolvedValue(undefined);
    const result = await callToolOk(ctx.mcp, "set_persona_visibility", {
      id: "pe1",
      isPublic: true,
    });
    expect(ctx.stub.personas.setVisibility).toHaveBeenCalledWith("pe1", true);
    expect(result).toEqual({ success: true, id: "pe1", isPublic: true });
  });

  it("surfaces platform errors as tool errors", async () => {
    ctx.stub.personas.setVisibility.mockRejectedValue(
      new PromptyHttpError("Not your persona", 403),
    );
    const text = await callToolError(ctx.mcp, "set_persona_visibility", {
      id: "pe1",
      isPublic: true,
    });
    expect(text).toContain("HTTP 403");
    expect(text).toContain("Not your persona");
  });
});

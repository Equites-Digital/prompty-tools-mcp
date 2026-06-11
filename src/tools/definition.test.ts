import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createClientStub } from "../test-utils/prompty.js";
import { defineTool, READ_ONLY } from "./definition.js";

describe("defineTool", () => {
  const tool = defineTool({
    name: "echo_title",
    description: "Echoes the title.",
    annotations: READ_ONLY,
    inputSchema: { title: z.string() },
    handler: (_client, args) => Promise.resolve({ echoed: args.title }),
  });

  it("exposes the definition fields", () => {
    expect(tool.name).toBe("echo_title");
    expect(tool.description).toBe("Echoes the title.");
    expect(tool.annotations).toEqual({ readOnlyHint: true });
    expect(Object.keys(tool.inputSchema)).toEqual(["title"]);
  });

  it("validates arguments before invoking the handler", async () => {
    const { client } = createClientStub();
    await expect(tool.invoke(client, { title: 42 })).rejects.toThrowError();
    await expect(tool.invoke(client, { title: "hi" })).resolves.toEqual({ echoed: "hi" });
  });

  it("passes the client through to the handler", async () => {
    const handler = vi.fn().mockResolvedValue("ok");
    const spied = defineTool({
      name: "spy",
      description: "Spy tool.",
      annotations: READ_ONLY,
      inputSchema: {},
      handler,
    });
    const { client } = createClientStub();
    await spied.invoke(client, {});
    expect(handler).toHaveBeenCalledWith(client, {});
  });
});

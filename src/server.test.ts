import { describe, expect, it } from "vitest";
import { connectTestClient } from "./test-utils/mcp.js";
import { createClientStub } from "./test-utils/prompty.js";
import { createServer, SERVER_INSTRUCTIONS } from "./server.js";
import { allTools } from "./tools/register.js";
import { VERSION } from "./version.js";

describe("createServer", () => {
  it("connects and reports name, version, and instructions", async () => {
    const { client: promptyClient } = createClientStub();
    const server = createServer(promptyClient);
    const mcpClient = await connectTestClient(server);

    expect(mcpClient.getServerVersion()).toMatchObject({
      name: "prompty-tools",
      version: VERSION,
    });
    expect(mcpClient.getInstructions()).toBe(SERVER_INSTRUCTIONS);
    await server.close();
  });

  it("exposes every defined tool exactly once, with annotations", async () => {
    const { client: promptyClient } = createClientStub();
    const server = createServer(promptyClient);
    const mcpClient = await connectTestClient(server);

    const listed = await mcpClient.listTools();
    const listedNames = listed.tools.map((tool) => tool.name).sort();
    const definedNames = allTools.map((tool) => tool.name).sort();
    expect(listedNames).toEqual(definedNames);
    expect(new Set(definedNames).size).toBe(definedNames.length);

    const searchPrompts = listed.tools.find((tool) => tool.name === "search_prompts");
    expect(searchPrompts?.annotations).toMatchObject({ readOnlyHint: true });
    expect(searchPrompts?.description).toBeTruthy();
    await server.close();
  });

  it("every tool has a description and every defined tool name is snake_case", () => {
    for (const tool of allTools) {
      expect(tool.description.length, tool.name).toBeGreaterThan(20);
      expect(tool.name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});

import { describe, expect, it } from "vitest";
import { connectTestClient } from "./test-utils/mcp.js";
import { createClientStub } from "./test-utils/prompty.js";
import { createServer, SERVER_INSTRUCTIONS } from "./server.js";
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
});

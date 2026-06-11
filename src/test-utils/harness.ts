import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createServer } from "../server.js";
import { connectTestClient } from "./mcp.js";
import { createClientStub, type ClientStub } from "./prompty.js";

export interface ToolTestContext {
  stub: ClientStub;
  mcp: Client;
  server: McpServer;
}

export async function setupToolTest(): Promise<ToolTestContext> {
  const { stub, client } = createClientStub();
  const server = createServer(client);
  const mcp = await connectTestClient(server);
  return { stub, mcp, server };
}

function narrowResult(result: unknown): { isError: boolean; text: string } {
  const { isError, content } = result as {
    isError?: boolean;
    content?: { type: string; text?: string }[];
  };
  const first = content?.[0];
  if (first?.type !== "text" || typeof first.text !== "string") {
    throw new Error("expected a text content block");
  }
  return { isError: isError === true, text: first.text };
}

export async function callToolOk(
  mcp: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const result = narrowResult(await mcp.callTool({ name, arguments: args }));
  if (result.isError) {
    throw new Error(`tool ${name} unexpectedly failed: ${result.text}`);
  }
  return JSON.parse(result.text);
}

export async function callToolError(
  mcp: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  const result = narrowResult(await mcp.callTool({ name, arguments: args }));
  if (!result.isError) {
    throw new Error(`tool ${name} unexpectedly succeeded`);
  }
  return result.text;
}

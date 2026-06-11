#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createPromptyClient } from "@prompty-tools/core";
import { loadConfig } from "./config.js";
import { createServer } from "./server.js";
import { VERSION } from "./version.js";

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const client = createPromptyClient({
    apiKey: config.apiKey,
    userAgent: `@prompty-tools/mcp/${VERSION}`,
    ...(config.baseUrl !== undefined && { baseUrl: config.baseUrl }),
    ...(config.timeoutMs !== undefined && { timeoutMs: config.timeoutMs }),
  });
  const server = createServer(client);

  const shutdown = (): void => {
    void server.close().finally(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await server.connect(new StdioServerTransport());
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PromptyClient } from "@prompty-tools/core";
import type { RegisteredTool } from "./definition.js";
import { toErrorResult, toTextResult } from "./results.js";

export const allTools: readonly RegisteredTool[] = [];

export function registerAllTools(server: McpServer, client: PromptyClient): void {
  for (const tool of allTools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        annotations: tool.annotations,
        inputSchema: tool.inputSchema,
      },
      async (args: unknown) => {
        try {
          return toTextResult(await tool.invoke(client, args));
        } catch (err) {
          return toErrorResult(err);
        }
      },
    );
  }
}

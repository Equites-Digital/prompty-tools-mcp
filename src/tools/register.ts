import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PromptyClient } from "@prompty-tools/core";
import { constraintTools } from "./constraints.js";
import type { RegisteredTool } from "./definition.js";
import { libraryTools } from "./libraries.js";
import { outputTools } from "./outputs.js";
import { personaTools } from "./personas.js";
import { promptTools } from "./prompts.js";
import { toErrorResult, toTextResult } from "./results.js";
import { toneTools } from "./tones.js";

export const allTools: readonly RegisteredTool[] = [
  ...promptTools,
  ...personaTools,
  ...toneTools,
  ...outputTools,
  ...constraintTools,
  ...libraryTools,
];

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

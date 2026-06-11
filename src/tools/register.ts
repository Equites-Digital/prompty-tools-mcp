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

export interface ToolGroup {
  slug: string;
  title: string;
  blurb: string;
  tools: readonly RegisteredTool[];
}

export const toolGroups: readonly ToolGroup[] = [
  {
    slug: "prompts",
    title: "Prompts",
    blurb:
      "Search, read, create, and version prompts. The platform compiles the final prompt text from the task and the referenced building blocks.",
    tools: promptTools,
  },
  {
    slug: "personas",
    title: "Personas",
    blurb:
      "Versioned identities a prompt can speak as. Prompts reference a persona VERSION id (personaVersionId).",
    tools: personaTools,
  },
  {
    slug: "tones",
    title: "Tones",
    blurb: "Short style descriptors referenced as toneIds in prompts.",
    tools: toneTools,
  },
  {
    slug: "outputs",
    title: "Outputs",
    blurb: "Output format descriptions referenced as outputId in prompts.",
    tools: outputTools,
  },
  {
    slug: "constraints",
    title: "Constraints",
    blurb: "Rules the output must follow, referenced as constraintIds in prompts.",
    tools: constraintTools,
  },
  {
    slug: "libraries",
    title: "Libraries",
    blurb: "Named collections of prompts, with membership management.",
    tools: libraryTools,
  },
];

export const allTools: readonly RegisteredTool[] = toolGroups.flatMap((group) => group.tools);

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

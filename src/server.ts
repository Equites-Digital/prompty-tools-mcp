import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PromptyClient } from "@prompty-tools/core";
import { registerAllTools } from "./tools/register.js";
import { VERSION } from "./version.js";

export const SERVER_INSTRUCTIONS = `Tools for prompty.tools, a platform where prompts are assembled from a task plus reusable building blocks (personas, tones, output formats, constraints) referenced by ID. The platform compiles the final prompt text server-side; get_prompt returns it as compiledPrompt.

Typical flows:
- Use an existing prompt: search_prompts (scope "mine" for the user's own, "public" for community prompts) -> get_prompt -> use its compiledPrompt.
- Create a prompt: collect building-block IDs first (search_tones, search_constraints, create_persona, ...) -> create_prompt with the task and those IDs -> get_prompt for the compiled text. Personas are referenced by persona VERSION id: use latestVersionId from get_persona, versionId from search_personas items, or versionId from create_persona.
- Update a prompt: update_prompt takes the full new state plus a changelog and creates a new version; earlier versions stay accessible via list_prompt_versions.

Notes:
- isPublic is required on every create tool: true publishes to the community, false keeps the item private. Ask the user if their intent is unclear.
- Every tool call counts against the user's daily API quota (free tier: 20 requests/day), so prefer targeted searches over broad listing.`;

export function createServer(client: PromptyClient): McpServer {
  const server = new McpServer(
    { name: "prompty-tools", version: VERSION },
    { capabilities: { tools: {} }, instructions: SERVER_INSTRUCTIONS },
  );
  registerAllTools(server, client);
  return server;
}

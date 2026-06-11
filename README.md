# @prompty-tools/mcp

Model Context Protocol (MCP) server for [prompty.tools](https://www.prompty.tools). Search, fetch, create, and version your prompts from any MCP-aware AI client - Claude Desktop, Claude Code, Cursor, and others.

Documentation: <https://mcp.prompty.tools>

## Quick start

1. Create an API key at <https://www.prompty.tools/dashboard/api-keys>. Keys start with `pk_` and can only be created in the dashboard.
2. Register the server with your client:

```sh
# Claude Code
claude mcp add prompty -e PROMPTY_API_KEY=pk_... -- npx -y @prompty-tools/mcp
```

```json
{
  "mcpServers": {
    "prompty": {
      "command": "npx",
      "args": ["-y", "@prompty-tools/mcp"],
      "env": { "PROMPTY_API_KEY": "pk_..." }
    }
  }
}
```

3. Ask your assistant: *"Search prompty for public prompts about code review."*

## What it does

On prompty.tools, a prompt is assembled from a **task** plus reusable building blocks - **personas** (versioned), **tones**, **outputs**, **constraints** - referenced by ID. The platform compiles the final prompt text server-side. This server exposes 33 tools across six resources:

| Resource | Tools |
| --- | --- |
| Prompts | `search_prompts`, `get_prompt`, `list_prompt_versions`, `get_prompt_version`, `create_prompt`, `update_prompt`, `set_prompt_visibility` |
| Personas | `search_personas`, `get_persona`, `list_persona_versions`, `get_persona_version`, `create_persona`, `update_persona`, `set_persona_visibility` |
| Tones | `search_tones`, `get_tone`, `create_tone`, `update_tone` |
| Outputs | `search_outputs`, `get_output`, `create_output`, `update_output` |
| Constraints | `search_constraints`, `get_constraint`, `create_constraint`, `update_constraint` |
| Libraries | `search_libraries`, `get_library`, `list_library_prompts`, `create_library`, `update_library`, `add_prompt_to_library`, `remove_prompt_from_library` |

Full input schemas per tool: <https://mcp.prompty.tools>

Deliberate omissions:

- **No delete tools.** Deletion stays in the dashboard; an assistant cannot destroy data through this server.
- **Explicit visibility.** Every create tool requires `isPublic` - nothing is published (or hidden) by a silent default.

## Configuration

| Environment variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PROMPTY_API_KEY` | yes | - | Bearer key (`pk_...`) from the dashboard. |
| `PROMPTY_BASE_URL` | no | `https://www.prompty.tools/api/v1` | Override for local development. |
| `PROMPTY_TIMEOUT_MS` | no | `30000` | Per-request HTTP timeout in milliseconds. |

## Rate limits

Every tool call is one API request. Daily quotas: **free 20**, **pro 1,000**, **teams 10,000** requests, plus 30 requests/minute per action. On HTTP 429 the tool error reports the quota and any `Retry-After`; the server never retries automatically. The free tier is sufficient to try the server, not for regular agentic use.

## Troubleshooting

- **`PROMPTY_API_KEY is required`** - the environment variable is missing from your client's MCP config.
- **`PromptyAuthError (HTTP 401)`** - the key is invalid or revoked; create a new one in the dashboard.
- **`PromptyNotFoundError (HTTP 404)` when creating a prompt** - a referenced building-block ID does not exist or is not accessible to your account. Note that prompts reference a persona *version* id (`personaVersionId`), not the persona id.
- **`PromptyRateLimitError (HTTP 429)`** - daily quota or per-minute limit reached; see the tier table above.

## Development

```sh
npm ci
npm test              # unit + tool tests (100% coverage enforced)
npm run lint && npm run typecheck
npm run build
npm run docs:serve    # docs site with generated tool reference at :4173
PROMPTY_TEST_API_KEY=pk_... npm run test:integration   # live API round-trip (~12 requests)
```

This package is a thin adapter over [`@prompty-tools/core`](https://www.npmjs.com/package/@prompty-tools/core), the typed TypeScript client for the same API.

## License

[MIT](./LICENSE) - prompty.tools

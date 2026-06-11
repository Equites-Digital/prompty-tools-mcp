# @prompty-tools/mcp

Model Context Protocol (MCP) server for [prompty.tools](https://www.prompty.tools). Search, fetch, create, and version prompts from any MCP-aware AI client (Claude Desktop, Claude Code, Cursor, ...).

Documentation: <https://mcp.prompty.tools>

## Quick start

1. Create an API key at <https://www.prompty.tools/dashboard/api-keys> (keys start with `pk_` and can only be created in the dashboard).
2. Add the server to your MCP client configuration:

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

Full setup, tool reference, and concepts: <https://mcp.prompty.tools>

## License

[MIT](./LICENSE) - prompty.tools

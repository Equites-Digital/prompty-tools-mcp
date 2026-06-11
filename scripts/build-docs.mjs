// Generates docs/tools/<group>.html from the tool definitions exported by the
// built package, so the documented surface always matches the registered one.
//
// Run via `npm run docs:build` (which depends on `npm run build`).

import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const distEntry = resolve(root, "dist/index.js");
const outDir = resolve(root, "docs/tools");

await ensureExists(distEntry, "Run `npm run build` first.");
const { toolGroups, VERSION } = await import(pathToFileURL(distEntry).href);

await mkdir(outDir, { recursive: true });
for (const group of toolGroups) {
  const path = resolve(outDir, `${group.slug}.html`);
  await writeFile(path, renderGroupPage(group), "utf8");
  console.log(`Generated ${path}`);
}
console.log(`Documented ${toolGroups.flatMap((g) => g.tools).length} tools for v${VERSION}.`);

function renderGroupPage(group) {
  const nav = toolGroups
    .map(
      (g) =>
        `<a href="./${g.slug}.html"${g.slug === group.slug ? ' class="active"' : ""}>${escapeHtml(g.title)}</a>`,
    )
    .join("\n          ");
  const sections = group.tools.map(renderTool).join("\n");
  const toc = group.tools
    .map((tool) => `<li><a href="#${tool.name}"><code>${tool.name}</code></a></li>`)
    .join("\n        ");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(group.title)} tools - @prompty-tools/mcp</title>
    <meta name="description" content="MCP tool reference: ${escapeHtml(group.blurb)}" />
    <link rel="stylesheet" href="../assets/styles.css" />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css"
    />
  </head>
  <body>
    <header class="site-header">
      <div class="site-header-inner">
        <a href="../index.html" class="logo"><img src="../assets/logo.png" alt="Prompty logo" class="logo-img" width="28" height="28" /><span>@prompty-tools/mcp</span></a>
        <nav class="site-nav">
          <a href="../index.html">Home</a>
          <a href="../getting-started.html">Getting started</a>
          <a href="../concepts.html">Concepts</a>
          ${nav}
        </nav>
      </div>
    </header>

    <main>
      <h1>${escapeHtml(group.title)}</h1>
      <p>${escapeHtml(group.blurb)}</p>
      <ul>
        ${toc}
      </ul>
${sections}
    </main>

    <footer class="site-footer">
      <p>
        <a href="https://github.com/Equites-Digital/prompty-tools-mcp">GitHub</a>
        ·
        <a href="https://www.npmjs.com/package/@prompty-tools/mcp">npm</a> ·
        <a href="https://prompty.tools">prompty.tools</a>
      </p>
      <p>MIT © prompty.tools · generated from @prompty-tools/mcp v${escapeHtml(String(VERSION))}</p>
    </footer>

    <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>
    <script>
      hljs.highlightAll();
    </script>
  </body>
</html>
`;
}

function renderTool(tool) {
  const jsonSchema = z.toJSONSchema(z.object(tool.inputSchema), { io: "input" });
  const properties = jsonSchema.properties ?? {};
  const required = new Set(jsonSchema.required ?? []);
  const rows = Object.entries(properties)
    .map(([name, schema]) => {
      const requiredLabel = required.has(name) ? "yes" : "no";
      return `<tr><td><code>${escapeHtml(name)}</code></td><td><code>${escapeHtml(
        typeLabel(schema),
      )}</code></td><td>${requiredLabel}</td><td>${escapeHtml(schema.description ?? "")}</td></tr>`;
    })
    .join("\n            ");
  const table =
    rows === ""
      ? "<p>No parameters.</p>"
      : `<table>
          <thead><tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
          <tbody>
            ${rows}
          </tbody>
        </table>`;

  const example = {
    name: tool.name,
    arguments: exampleArgs(properties, required),
  };

  return `      <h2 id="${tool.name}"><code>${tool.name}</code> <span class="badge">${escapeHtml(
    annotationLabel(tool.annotations),
  )}</span></h2>
      <p>${escapeHtml(tool.description)}</p>
      ${table}
      <pre><code class="language-json">${escapeHtml(JSON.stringify(example, null, 2))}</code></pre>`;
}

function annotationLabel(annotations) {
  if (annotations.readOnlyHint === true) return "read-only";
  if (annotations.idempotentHint === true) return "write · idempotent";
  return "write · non-destructive";
}

function typeLabel(schema) {
  if (schema.enum !== undefined) return schema.enum.map((v) => JSON.stringify(v)).join(" | ");
  if (schema.const !== undefined) return JSON.stringify(schema.const);
  if (schema.anyOf !== undefined) return schema.anyOf.map(typeLabel).join(" | ");
  if (schema.type === "array") {
    return `${typeLabel(schema.items ?? {})}[]`;
  }
  if (typeof schema.type === "string") return schema.type;
  return "unknown";
}

function exampleArgs(properties, required) {
  const args = {};
  for (const [name, schema] of Object.entries(properties)) {
    if (required.has(name)) {
      args[name] = exampleValue(schema);
    }
  }
  return args;
}

function exampleValue(schema) {
  if (schema.enum !== undefined) return schema.enum[0];
  if (schema.const !== undefined) return schema.const;
  if (schema.anyOf !== undefined) return exampleValue(schema.anyOf[0]);
  switch (schema.type) {
    case "boolean":
      return false;
    case "number":
    case "integer":
      return 1;
    case "array":
      return [exampleValue(schema.items ?? {})];
    default:
      return "...";
  }
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function ensureExists(path, hint) {
  try {
    await access(path, constants.F_OK);
  } catch {
    throw new Error(`Missing ${path}. ${hint}`);
  }
}

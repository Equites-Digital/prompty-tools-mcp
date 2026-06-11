// Runs only when PROMPTY_TEST_API_KEY is set. One run costs ~12 API requests
// (a free-tier key allows 20/day). Created entities are private, named
// "mcp-itest-*", and deleted again via @prompty-tools/core in afterAll.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createPromptyClient, type PromptyClient } from "@prompty-tools/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../../src/index.js";

const apiKey = process.env.PROMPTY_TEST_API_KEY;
const baseUrl = process.env.PROMPTY_TEST_BASE_URL;

interface Created {
  toneId?: string;
  constraintId?: string;
  promptId?: string;
  libraryId?: string;
}

describe.skipIf(apiKey === undefined || apiKey === "")("live API round-trip", () => {
  const runId = `mcp-itest-${Date.now()}`;
  const created: Created = {};
  let core: PromptyClient;
  let mcp: Client;

  async function call(name: string, args: Record<string, unknown>): Promise<unknown> {
    const result = (await mcp.callTool({ name, arguments: args })) as {
      isError?: boolean;
      content?: { type: string; text?: string }[];
    };
    const text = result.content?.[0]?.text ?? "";
    if (result.isError) {
      throw new Error(`${name} failed: ${text}`);
    }
    return JSON.parse(text);
  }

  beforeAll(async () => {
    if (apiKey === undefined) throw new Error("unreachable: suite is skipped without a key");
    const config = { apiKey, ...(baseUrl !== undefined && baseUrl !== "" && { baseUrl }) };
    core = createPromptyClient(config);
    const server = createServer(createPromptyClient(config));
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    mcp = new Client({ name: "integration-test", version: "0.0.0" });
    await Promise.all([server.connect(serverTransport), mcp.connect(clientTransport)]);
  });

  afterAll(async () => {
    const cleanups = [
      created.libraryId !== undefined && core.libraries.delete(created.libraryId),
      created.promptId !== undefined && core.prompts.delete(created.promptId),
      created.toneId !== undefined && core.tones.delete(created.toneId),
      created.constraintId !== undefined && core.constraints.delete(created.constraintId),
    ].filter((cleanup): cleanup is Promise<void> => cleanup !== false);
    const results = await Promise.allSettled(cleanups);
    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      throw new Error(
        `cleanup failed for ${failed.length} entities (search "${runId}" in the dashboard): ${failed
          .map((result) => String((result as PromiseRejectedResult).reason))
          .join("; ")}`,
      );
    }
  });

  it("creates building blocks, compiles a prompt server-side, versions it, and manages library membership", async () => {
    const tone = (await call("create_tone", {
      label: `${runId}-tone`,
      isPublic: false,
    })) as { id: string };
    created.toneId = tone.id;

    const constraint = (await call("create_constraint", {
      text: `${runId}-constraint`,
      isPublic: false,
    })) as { id: string };
    created.constraintId = constraint.id;

    const prompt = (await call("create_prompt", {
      title: `${runId}-prompt`,
      task: `${runId}-task instruction`,
      isPublic: false,
      toneIds: [tone.id],
      constraintIds: [constraint.id],
    })) as { id: string };
    created.promptId = prompt.id;

    const detail = (await call("get_prompt", { id: prompt.id })) as {
      compiledPrompt: string;
      currentVersion: number;
    };
    expect(detail.compiledPrompt).toContain(`${runId}-task instruction`);
    expect(detail.compiledPrompt).toContain(`${runId}-tone`);
    expect(detail.compiledPrompt).toContain(`${runId}-constraint`);
    expect(detail.currentVersion).toBe(1);

    await call("update_prompt", {
      id: prompt.id,
      title: `${runId}-prompt`,
      task: `${runId}-task instruction, refined`,
      changelog: "integration test update",
      toneIds: [tone.id],
    });

    const versions = (await call("list_prompt_versions", { id: prompt.id })) as {
      items: { version: number }[];
      total: number;
    };
    expect(versions.total).toBe(2);
    expect(versions.items.map((version) => version.version).sort()).toEqual([1, 2]);

    const library = (await call("create_library", {
      name: `${runId}-library`,
      isPublic: false,
    })) as { id: string };
    created.libraryId = library.id;

    await call("add_prompt_to_library", { id: library.id, promptId: prompt.id });
    const members = (await call("list_library_prompts", { id: library.id, scope: "all" })) as {
      items: { id: string }[];
    };
    expect(members.items.map((member) => member.id)).toContain(prompt.id);

    const publicOnly = (await call("list_library_prompts", { id: library.id })) as {
      items: { id: string }[];
    };
    expect(publicOnly.items.map((member) => member.id)).not.toContain(prompt.id);

    await call("remove_prompt_from_library", { id: library.id, promptId: prompt.id });

    const search = (await call("search_prompts", {
      scope: "mine",
      search: `${runId}-prompt`,
    })) as { items: { id: string }[] };
    expect(search.items.map((item) => item.id)).toContain(prompt.id);
  });
});

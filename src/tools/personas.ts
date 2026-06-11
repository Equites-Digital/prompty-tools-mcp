import type { PersonaCreateInput, PersonaUpdateInput } from "@prompty-tools/core";
import { z } from "zod";
import {
  defineTool,
  IDEMPOTENT_WRITE,
  NON_DESTRUCTIVE_WRITE,
  READ_ONLY,
  type RegisteredTool,
} from "./definition.js";
import {
  idSchema,
  isPublicField,
  listParamsShape,
  tagsField,
  toListParams,
  toVersionListParams,
  versionListParamsShape,
} from "./params.js";
import { toPageResult } from "./results.js";

export const personaTools: readonly RegisteredTool[] = [
  defineTool({
    name: "search_personas",
    description:
      "Search or list personas (reusable identities a prompt can speak as). Each item's versionId is its latest persona VERSION id, usable directly as personaVersionId in create_prompt / update_prompt.",
    annotations: READ_ONLY,
    inputSchema: listParamsShape,
    handler: async (client, args) => toPageResult(await client.personas.list(toListParams(args))),
  }),
  defineTool({
    name: "get_persona",
    description:
      "Fetch one persona by id. latestVersionId in the response is the persona VERSION id to reference from prompts (personaVersionId).",
    annotations: READ_ONLY,
    inputSchema: { id: idSchema.describe("Persona id.") },
    handler: (client, args) => client.personas.get(args.id),
  }),
  defineTool({
    name: "list_persona_versions",
    description: "List the version history of a persona (newest first).",
    annotations: READ_ONLY,
    inputSchema: { id: idSchema.describe("Persona id."), ...versionListParamsShape },
    handler: async (client, args) =>
      toPageResult(await client.personas.listVersions(args.id, toVersionListParams(args))),
  }),
  defineTool({
    name: "get_persona_version",
    description: "Fetch one specific version of a persona.",
    annotations: READ_ONLY,
    inputSchema: {
      id: idSchema.describe("Persona id."),
      versionId: idSchema.describe("Version id, from list_persona_versions."),
    },
    handler: (client, args) => client.personas.getVersion(args.id, args.versionId),
  }),
  defineTool({
    name: "create_persona",
    description:
      "Create a persona. The response's versionId is the persona VERSION id to use as personaVersionId when creating prompts.",
    annotations: NON_DESTRUCTIVE_WRITE,
    inputSchema: {
      title: z.string().min(1).describe("Persona title, e.g. \"a senior security engineer\"."),
      isPublic: isPublicField,
      description: z
        .string()
        .optional()
        .describe("Longer description of the persona's expertise, perspective, and voice."),
      tags: tagsField,
    },
    handler: (client, args) => {
      const input: PersonaCreateInput = {
        title: args.title,
        isPublic: args.isPublic,
        ...(args.description !== undefined && { description: args.description }),
        ...(args.tags !== undefined && { tags: args.tags }),
      };
      return client.personas.create(input);
    },
  }),
  defineTool({
    name: "update_persona",
    description:
      "Update a persona by creating a new version. Takes the full new state. Unlike update_prompt, the changelog is optional here (platform behaviour).",
    annotations: NON_DESTRUCTIVE_WRITE,
    inputSchema: {
      id: idSchema.describe("Persona id."),
      title: z.string().min(1).describe("New title."),
      description: z.string().optional().describe("New description."),
      changelog: z.string().optional().describe("Short summary of what changed."),
      tags: tagsField,
    },
    handler: async (client, args) => {
      const input: PersonaUpdateInput = {
        title: args.title,
        ...(args.description !== undefined && { description: args.description }),
        ...(args.changelog !== undefined && { changelog: args.changelog }),
        ...(args.tags !== undefined && { tags: args.tags }),
      };
      await client.personas.update(args.id, input);
      return { success: true, id: args.id };
    },
  }),
  defineTool({
    name: "set_persona_visibility",
    description: "Make a persona public (community-visible) or private. Reversible.",
    annotations: IDEMPOTENT_WRITE,
    inputSchema: {
      id: idSchema.describe("Persona id."),
      isPublic: z.boolean().describe("true = public, false = private."),
    },
    handler: async (client, args) => {
      await client.personas.setVisibility(args.id, args.isPublic);
      return { success: true, id: args.id, isPublic: args.isPublic };
    },
  }),
];

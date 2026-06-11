import type { LibraryCreateInput, LibraryUpdateInput } from "@prompty-tools/core";
import { z } from "zod";
import {
  defineTool,
  IDEMPOTENT_WRITE,
  NON_DESTRUCTIVE_WRITE,
  READ_ONLY,
  type RegisteredTool,
} from "./definition.js";
import { idSchema, isPublicField, listParamsShape, tagsField, toListParams } from "./params.js";
import { toPageResult } from "./results.js";

export const libraryTools: readonly RegisteredTool[] = [
  defineTool({
    name: "search_libraries",
    description:
      "Search or list libraries (named collections of prompts, e.g. \"Marketing prompts\").",
    annotations: READ_ONLY,
    inputSchema: listParamsShape,
    handler: async (client, args) => toPageResult(await client.libraries.list(toListParams(args))),
  }),
  defineTool({
    name: "get_library",
    description: "Fetch one library by id, including its prompt count.",
    annotations: READ_ONLY,
    inputSchema: { id: idSchema.describe("Library id.") },
    handler: (client, args) => client.libraries.get(args.id),
  }),
  defineTool({
    name: "list_library_prompts",
    description:
      "List the prompts inside a library, including each prompt's compiled text. Supports the same paging and search parameters as search_prompts.",
    annotations: READ_ONLY,
    inputSchema: { id: idSchema.describe("Library id."), ...listParamsShape },
    handler: async (client, args) =>
      toPageResult(await client.libraries.listPrompts(args.id, toListParams(args))),
  }),
  defineTool({
    name: "create_library",
    description: "Create a library for organising prompts. Add prompts with add_prompt_to_library.",
    annotations: NON_DESTRUCTIVE_WRITE,
    inputSchema: {
      name: z.string().min(1).describe("Library name."),
      isPublic: isPublicField,
      description: z.string().optional().describe("What this library collects."),
      tags: tagsField,
    },
    handler: (client, args) => {
      const input: LibraryCreateInput = {
        name: args.name,
        isPublic: args.isPublic,
        ...(args.description !== undefined && { description: args.description }),
        ...(args.tags !== undefined && { tags: args.tags }),
      };
      return client.libraries.create(input);
    },
  }),
  defineTool({
    name: "update_library",
    description:
      "Update a library's metadata. Takes the full new state: name is required even when unchanged.",
    annotations: NON_DESTRUCTIVE_WRITE,
    inputSchema: {
      id: idSchema.describe("Library id."),
      name: z.string().min(1).describe("Library name (required even when unchanged)."),
      description: z.string().optional().describe("New description."),
      isPublic: z.boolean().optional().describe("Optionally change visibility."),
      tags: tagsField,
    },
    handler: async (client, args) => {
      const input: LibraryUpdateInput = {
        name: args.name,
        ...(args.description !== undefined && { description: args.description }),
        ...(args.isPublic !== undefined && { isPublic: args.isPublic }),
        ...(args.tags !== undefined && { tags: args.tags }),
      };
      await client.libraries.update(args.id, input);
      return { success: true, id: args.id };
    },
  }),
  defineTool({
    name: "add_prompt_to_library",
    description: "Add a prompt to a library. Reversible with remove_prompt_from_library.",
    annotations: IDEMPOTENT_WRITE,
    inputSchema: {
      id: idSchema.describe("Library id."),
      promptId: idSchema.describe("Prompt id to add."),
    },
    handler: async (client, args) => {
      await client.libraries.addPrompt(args.id, args.promptId);
      return { success: true, id: args.id, promptId: args.promptId };
    },
  }),
  defineTool({
    name: "remove_prompt_from_library",
    description:
      "Remove a prompt from a library. Only the library membership is removed; the prompt itself is not deleted. Reversible with add_prompt_to_library.",
    annotations: IDEMPOTENT_WRITE,
    inputSchema: {
      id: idSchema.describe("Library id."),
      promptId: idSchema.describe("Prompt id to remove."),
    },
    handler: async (client, args) => {
      await client.libraries.removePrompt(args.id, args.promptId);
      return { success: true, id: args.id, promptId: args.promptId };
    },
  }),
];

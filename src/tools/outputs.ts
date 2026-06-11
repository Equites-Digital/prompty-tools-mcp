import type { OutputCreateInput, OutputUpdateInput } from "@prompty-tools/core";
import { z } from "zod";
import {
  defineTool,
  NON_DESTRUCTIVE_WRITE,
  READ_ONLY,
  type RegisteredTool,
} from "./definition.js";
import { idSchema, isPublicField, listParamsShape, tagsField, toListParams } from "./params.js";
import { toPageResult } from "./results.js";

export const outputTools: readonly RegisteredTool[] = [
  defineTool({
    name: "search_outputs",
    description:
      "Search or list output formats (e.g. \"a markdown table\" or \"a bulleted list\"). Output ids can be referenced as outputId in create_prompt / update_prompt.",
    annotations: READ_ONLY,
    inputSchema: listParamsShape,
    handler: async (client, args) => toPageResult(await client.outputs.list(toListParams(args))),
  }),
  defineTool({
    name: "get_output",
    description: "Fetch one output format by id.",
    annotations: READ_ONLY,
    inputSchema: { id: idSchema.describe("Output id.") },
    handler: (client, args) => client.outputs.get(args.id),
  }),
  defineTool({
    name: "create_output",
    description:
      "Create an output format. The returned id can be referenced as outputId in prompts.",
    annotations: NON_DESTRUCTIVE_WRITE,
    inputSchema: {
      label: z
        .string()
        .min(1)
        .describe("The output format description, e.g. \"a markdown table\"."),
      isPublic: isPublicField,
      tags: tagsField,
    },
    handler: (client, args) => {
      const input: OutputCreateInput = {
        label: args.label,
        isPublic: args.isPublic,
        ...(args.tags !== undefined && { tags: args.tags }),
      };
      return client.outputs.create(input);
    },
  }),
  defineTool({
    name: "update_output",
    description:
      "Update an output format in place. Outputs are not versioned: the previous label is overwritten without history.",
    annotations: NON_DESTRUCTIVE_WRITE,
    inputSchema: {
      id: idSchema.describe("Output id."),
      label: z.string().min(1).describe("New output format description."),
      isPublic: z.boolean().optional().describe("Optionally change visibility."),
      tags: tagsField,
    },
    handler: async (client, args) => {
      const input: OutputUpdateInput = {
        label: args.label,
        ...(args.isPublic !== undefined && { isPublic: args.isPublic }),
        ...(args.tags !== undefined && { tags: args.tags }),
      };
      await client.outputs.update(args.id, input);
      return { success: true, id: args.id };
    },
  }),
];

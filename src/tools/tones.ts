import type { ToneCreateInput, ToneUpdateInput } from "@prompty-tools/core";
import { z } from "zod";
import {
  defineTool,
  NON_DESTRUCTIVE_WRITE,
  READ_ONLY,
  type RegisteredTool,
} from "./definition.js";
import { idSchema, isPublicField, listParamsShape, tagsField, toListParams } from "./params.js";
import { toPageResult } from "./results.js";

export const toneTools: readonly RegisteredTool[] = [
  defineTool({
    name: "search_tones",
    description:
      "Search or list tones (short style descriptors like \"professional\" or \"playful\"). Tone ids can be referenced as toneIds in create_prompt / update_prompt.",
    annotations: READ_ONLY,
    inputSchema: listParamsShape,
    handler: async (client, args) => toPageResult(await client.tones.list(toListParams(args))),
  }),
  defineTool({
    name: "get_tone",
    description: "Fetch one tone by id.",
    annotations: READ_ONLY,
    inputSchema: { id: idSchema.describe("Tone id.") },
    handler: (client, args) => client.tones.get(args.id),
  }),
  defineTool({
    name: "create_tone",
    description: "Create a tone. The returned id can be referenced as a toneId in prompts.",
    annotations: NON_DESTRUCTIVE_WRITE,
    inputSchema: {
      label: z.string().min(1).describe("The tone descriptor, e.g. \"direct\" or \"playful\"."),
      isPublic: isPublicField,
      tags: tagsField,
    },
    handler: (client, args) => {
      const input: ToneCreateInput = {
        label: args.label,
        isPublic: args.isPublic,
        ...(args.tags !== undefined && { tags: args.tags }),
      };
      return client.tones.create(input);
    },
  }),
  defineTool({
    name: "update_tone",
    description:
      "Update a tone in place. Tones are not versioned: the previous label is overwritten without history.",
    annotations: NON_DESTRUCTIVE_WRITE,
    inputSchema: {
      id: idSchema.describe("Tone id."),
      label: z.string().min(1).describe("New tone descriptor."),
      isPublic: z.boolean().optional().describe("Optionally change visibility."),
      tags: tagsField,
    },
    handler: async (client, args) => {
      const input: ToneUpdateInput = {
        label: args.label,
        ...(args.isPublic !== undefined && { isPublic: args.isPublic }),
        ...(args.tags !== undefined && { tags: args.tags }),
      };
      await client.tones.update(args.id, input);
      return { success: true, id: args.id };
    },
  }),
];

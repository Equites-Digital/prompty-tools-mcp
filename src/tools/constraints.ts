import type { ConstraintCreateInput, ConstraintUpdateInput } from "@prompty-tools/core";
import { z } from "zod";
import {
  defineTool,
  NON_DESTRUCTIVE_WRITE,
  READ_ONLY,
  type RegisteredTool,
} from "./definition.js";
import { idSchema, isPublicField, listParamsShape, tagsField, toListParams } from "./params.js";
import { toPageResult } from "./results.js";

export const constraintTools: readonly RegisteredTool[] = [
  defineTool({
    name: "search_constraints",
    description:
      "Search or list constraints (rules the output must follow, e.g. \"never use jargon\"). Constraint ids can be referenced as constraintIds in create_prompt / update_prompt.",
    annotations: READ_ONLY,
    inputSchema: listParamsShape,
    handler: async (client, args) =>
      toPageResult(await client.constraints.list(toListParams(args))),
  }),
  defineTool({
    name: "get_constraint",
    description: "Fetch one constraint by id.",
    annotations: READ_ONLY,
    inputSchema: { id: idSchema.describe("Constraint id.") },
    handler: (client, args) => client.constraints.get(args.id),
  }),
  defineTool({
    name: "create_constraint",
    description:
      "Create a constraint. The returned id can be referenced in constraintIds on prompts.",
    annotations: NON_DESTRUCTIVE_WRITE,
    inputSchema: {
      text: z.string().min(1).describe("The constraint rule, e.g. \"cite sources for claims\"."),
      isPublic: isPublicField,
      tags: tagsField,
    },
    handler: (client, args) => {
      const input: ConstraintCreateInput = {
        text: args.text,
        isPublic: args.isPublic,
        ...(args.tags !== undefined && { tags: args.tags }),
      };
      return client.constraints.create(input);
    },
  }),
  defineTool({
    name: "update_constraint",
    description:
      "Update a constraint in place. Constraints are not versioned: the previous text is overwritten without history.",
    annotations: NON_DESTRUCTIVE_WRITE,
    inputSchema: {
      id: idSchema.describe("Constraint id."),
      text: z.string().min(1).describe("New constraint rule."),
      isPublic: z.boolean().optional().describe("Optionally change visibility."),
      tags: tagsField,
    },
    handler: async (client, args) => {
      const input: ConstraintUpdateInput = {
        text: args.text,
        ...(args.isPublic !== undefined && { isPublic: args.isPublic }),
        ...(args.tags !== undefined && { tags: args.tags }),
      };
      await client.constraints.update(args.id, input);
      return { success: true, id: args.id };
    },
  }),
];

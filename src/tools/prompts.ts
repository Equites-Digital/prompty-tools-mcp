import type { PromptCreateInput, PromptUpdateInput } from "@prompty-tools/core";
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

const promptPartsShape = {
  personaVersionId: idSchema
    .optional()
    .describe(
      "Persona VERSION id (not the persona id). Obtain it from latestVersionId on get_persona, versionId on search_personas items, or versionId from create_persona.",
    ),
  outputId: idSchema.optional().describe("Output format id, from search_outputs or create_output."),
  toneIds: z
    .array(idSchema)
    .optional()
    .describe("Tone ids, from search_tones or create_tone. Must be accessible to the user."),
  constraintIds: z
    .array(idSchema)
    .optional()
    .describe(
      "Constraint ids, from search_constraints or create_constraint. Must be accessible to the user.",
    ),
};

function toPromptParts(args: {
  personaVersionId?: string | undefined;
  outputId?: string | undefined;
  toneIds?: string[] | undefined;
  constraintIds?: string[] | undefined;
  description?: string | undefined;
  tags?: string[] | undefined;
}): Pick<
  PromptCreateInput,
  "personaVersionId" | "outputId" | "toneIds" | "constraintIds" | "description" | "tags"
> {
  return {
    ...(args.description !== undefined && { description: args.description }),
    ...(args.personaVersionId !== undefined && { personaVersionId: args.personaVersionId }),
    ...(args.outputId !== undefined && { outputId: args.outputId }),
    ...(args.toneIds !== undefined && { toneIds: args.toneIds }),
    ...(args.constraintIds !== undefined && { constraintIds: args.constraintIds }),
    ...(args.tags !== undefined && { tags: args.tags }),
  };
}

export const promptTools: readonly RegisteredTool[] = [
  defineTool({
    name: "search_prompts",
    description:
      "Search or list prompts on prompty.tools. Returns summaries including the compiled prompt text. Use get_prompt for full details of a specific prompt.",
    annotations: READ_ONLY,
    inputSchema: listParamsShape,
    handler: async (client, args) => toPageResult(await client.prompts.list(toListParams(args))),
  }),
  defineTool({
    name: "get_prompt",
    description:
      "Fetch one prompt by id, including its server-compiled prompt text (compiledPrompt), the task, referenced building blocks, tags, and version metadata.",
    annotations: READ_ONLY,
    inputSchema: { id: idSchema.describe("Prompt id.") },
    handler: (client, args) => client.prompts.get(args.id),
  }),
  defineTool({
    name: "list_prompt_versions",
    description: "List the version history of a prompt (newest first).",
    annotations: READ_ONLY,
    inputSchema: { id: idSchema.describe("Prompt id."), ...versionListParamsShape },
    handler: async (client, args) =>
      toPageResult(await client.prompts.listVersions(args.id, toVersionListParams(args))),
  }),
  defineTool({
    name: "get_prompt_version",
    description:
      "Fetch one specific version of a prompt, including the compiled prompt text as of that version.",
    annotations: READ_ONLY,
    inputSchema: {
      id: idSchema.describe("Prompt id."),
      versionId: idSchema.describe("Version id, from list_prompt_versions."),
    },
    handler: (client, args) => client.prompts.getVersion(args.id, args.versionId),
  }),
  defineTool({
    name: "create_prompt",
    description:
      "Create a prompt from a task plus optional building-block references; the platform compiles the final prompt text server-side. Returns the new prompt's id - call get_prompt to retrieve the compiled text.",
    annotations: NON_DESTRUCTIVE_WRITE,
    inputSchema: {
      title: z.string().min(1).describe("Prompt title."),
      task: z.string().min(1).describe("The task instruction at the heart of the prompt."),
      isPublic: isPublicField,
      description: z.string().optional().describe("Short description of what the prompt is for."),
      ...promptPartsShape,
      tags: tagsField,
    },
    handler: (client, args) => {
      const input: PromptCreateInput = {
        title: args.title,
        task: args.task,
        isPublic: args.isPublic,
        ...toPromptParts(args),
      };
      return client.prompts.create(input);
    },
  }),
  defineTool({
    name: "update_prompt",
    description:
      "Update a prompt by creating a new version. Takes the FULL new state (title, task, building-block references), not a partial diff; omitted building blocks are removed from the new version. Earlier versions remain accessible.",
    annotations: NON_DESTRUCTIVE_WRITE,
    inputSchema: {
      id: idSchema.describe("Prompt id."),
      title: z.string().min(1).describe("New title."),
      task: z.string().min(1).describe("New task instruction."),
      changelog: z.string().min(1).describe("Required: short summary of what changed."),
      description: z.string().optional().describe("New description."),
      ...promptPartsShape,
      tags: tagsField,
    },
    handler: async (client, args) => {
      const input: PromptUpdateInput = {
        title: args.title,
        task: args.task,
        changelog: args.changelog,
        ...toPromptParts(args),
      };
      await client.prompts.update(args.id, input);
      return { success: true, id: args.id };
    },
  }),
  defineTool({
    name: "set_prompt_visibility",
    description: "Make a prompt public (community-visible) or private. Reversible.",
    annotations: IDEMPOTENT_WRITE,
    inputSchema: {
      id: idSchema.describe("Prompt id."),
      isPublic: z.boolean().describe("true = public, false = private."),
    },
    handler: async (client, args) => {
      await client.prompts.setVisibility(args.id, args.isPublic);
      return { success: true, id: args.id, isPublic: args.isPublic };
    },
  }),
];

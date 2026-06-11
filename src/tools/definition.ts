import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { PromptyClient } from "@prompty-tools/core";
import { z } from "zod";

export interface RegisteredTool {
  name: string;
  description: string;
  annotations: ToolAnnotations;
  inputSchema: z.ZodRawShape;
  invoke(client: PromptyClient, args: unknown): Promise<unknown>;
}

/**
 * Wraps a typed tool handler into a {@link RegisteredTool}. `invoke` validates
 * its arguments against the schema, so callers never reach the handler with
 * unchecked input.
 */
export function defineTool<Shape extends z.ZodRawShape>(definition: {
  name: string;
  description: string;
  annotations: ToolAnnotations;
  inputSchema: Shape;
  handler(client: PromptyClient, args: z.output<z.ZodObject<Shape>>): Promise<unknown>;
}): RegisteredTool {
  const schema = z.object(definition.inputSchema);
  return {
    name: definition.name,
    description: definition.description,
    annotations: definition.annotations,
    inputSchema: definition.inputSchema,
    invoke: async (client, args) => definition.handler(client, schema.parse(args)),
  };
}

export const READ_ONLY: ToolAnnotations = { readOnlyHint: true };
export const NON_DESTRUCTIVE_WRITE: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
};
export const IDEMPOTENT_WRITE: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
};

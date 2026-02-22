/**
 * AgentForge marketplace tools — discover, execute, and manage AI tools.
 */
import { Type } from "@sinclair/typebox";
import type { A2AConfig } from "../config.js";
import { getForgeClient } from "../service.js";

export interface ToolRegistrar {
  registerTool(tool: any, opts?: any): void;
}

export function registerForgeTools(api: ToolRegistrar, cfg: A2AConfig) {
  // ── forge_discover ─────────────────────────────────────────────
  api.registerTool({
    name: "forge_discover",
    label: "Discover Tools",
    description:
      "Search the AgentForge marketplace for AI tools by intent, keywords, category, protocol, price range, trust score, or tags.",
    parameters: Type.Object({
      query: Type.Optional(Type.String({ description: "Natural language search query" })),
      category: Type.Optional(Type.String({ description: "Filter by category (e.g. 'nlp', 'vision', 'code')" })),
      protocol: Type.Optional(Type.String({ description: "Filter by protocol (rest, grpc, mcp)" })),
      maxPrice: Type.Optional(Type.Number({ description: "Max price per call in USD" })),
      minTrustScore: Type.Optional(Type.Number({ description: "Minimum trust score (0-100)" })),
      tags: Type.Optional(Type.Array(Type.String(), { description: "Filter by tags" })),
      limit: Type.Optional(Type.Number({ description: "Max results (default 10)" })),
      offset: Type.Optional(Type.Number({ description: "Pagination offset" })),
    }),
    async execute(_id: string, params: any) {
      const forge = getForgeClient(cfg);
      const tools = await forge.discoverTools(params);
      return { content: [{ type: "text", text: JSON.stringify(tools, null, 2) }] };
    },
  });

  // ── forge_execute ──────────────────────────────────────────────
  api.registerTool({
    name: "forge_execute",
    label: "Execute Tool",
    description:
      "Execute an AI tool from the AgentForge marketplace. Billing is applied automatically.",
    parameters: Type.Object({
      toolId: Type.String({ description: "Tool ID from the marketplace" }),
      input: Type.Unknown({ description: "Input payload for the tool" }),
    }),
    async execute(_id: string, params: any) {
      const forge = getForgeClient(cfg);
      const result = await forge.executeTool(params.toolId, params.input);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  // ── forge_get_schema ───────────────────────────────────────────
  api.registerTool({
    name: "forge_get_schema",
    label: "Get Tool Schema",
    description: "Get the input/output schema for a specific AgentForge tool.",
    parameters: Type.Object({
      toolId: Type.String({ description: "Tool ID to get schema for" }),
    }),
    async execute(_id: string, params: any) {
      const forge = getForgeClient(cfg);
      const schema = await forge.getToolSchema(params.toolId);
      return { content: [{ type: "text", text: JSON.stringify(schema, null, 2) }] };
    },
  });

  // ── forge_balance ──────────────────────────────────────────────
  api.registerTool({
    name: "forge_balance",
    label: "Check Balance",
    description: "Check your AgentForge agent balance, total spent, and tier.",
    parameters: Type.Object({}),
    async execute() {
      const forge = getForgeClient(cfg);
      const balance = await forge.getBalance();
      return { content: [{ type: "text", text: JSON.stringify(balance, null, 2) }] };
    },
  });

  // ── forge_list_categories ──────────────────────────────────────
  api.registerTool({
    name: "forge_list_categories",
    label: "List Categories",
    description: "List all available tool categories in the AgentForge marketplace.",
    parameters: Type.Object({}),
    async execute() {
      const forge = getForgeClient(cfg);
      const categories = await forge.listCategories();
      return { content: [{ type: "text", text: JSON.stringify(categories, null, 2) }] };
    },
  });

  // ── forge_batch_execute ────────────────────────────────────────
  api.registerTool({
    name: "forge_batch_execute",
    label: "Batch Execute",
    description:
      "Execute up to 10 AgentForge tools in parallel. Each is billed separately.",
    parameters: Type.Object({
      calls: Type.Array(
        Type.Object({
          toolId: Type.String({ description: "Tool ID" }),
          input: Type.Unknown({ description: "Tool input payload" }),
        }),
        { description: "Array of tool calls (max 10)", maxItems: 10 },
      ),
    }),
    async execute(_id: string, params: any) {
      const forge = getForgeClient(cfg);
      const results = await forge.batchExecute(params.calls);
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    },
  });
}

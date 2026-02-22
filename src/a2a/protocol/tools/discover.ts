/**
 * a2a_discover_agents — find remote A2A-compatible agents.
 */
import { Type } from "@sinclair/typebox";
import type { A2ACardCache } from "../client/card-cache.js";
import type { A2AAgentRegistry } from "../client/registry.js";
import type { ToolRegistrar } from "./index.js";

export function registerDiscoverTool(
  api: ToolRegistrar,
  cardCache: A2ACardCache,
  registry: A2AAgentRegistry,
): void {
  api.registerTool({
    name: "a2a_discover_agents",
    label: "Discover A2A Agents",
    description:
      "Discover remote A2A-compatible agents by capability, skill tags, or natural language query. " +
      "Can also fetch an agent card from a specific URL.",
    parameters: Type.Object({
      query: Type.Optional(
        Type.String({ description: "Natural language search query" }),
      ),
      tags: Type.Optional(
        Type.Array(Type.String(), { description: "Filter by skill tags" }),
      ),
      baseUrl: Type.Optional(
        Type.String({
          description: "Fetch agent card directly from this URL",
        }),
      ),
      limit: Type.Optional(
        Type.Number({ description: "Max results (default 10)" }),
      ),
    }),
    async execute(_id: string, params: any) {
      // Direct URL fetch
      if (params.baseUrl) {
        try {
          const card = await cardCache.fetchCard(params.baseUrl);
          return {
            content: [
              { type: "text", text: JSON.stringify(card, null, 2) },
            ],
          };
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : String(err);
          return {
            content: [
              {
                type: "text",
                text: `Failed to fetch agent card from ${params.baseUrl}: ${msg}`,
              },
            ],
          };
        }
      }

      // Registry search
      const results = await registry.discover({
        query: params.query,
        tags: params.tags,
        limit: params.limit ?? 10,
      });

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No A2A agents found matching the criteria.",
            },
          ],
        };
      }

      const summary = results.map((card) => ({
        name: card.name,
        url: card.url,
        description: card.description,
        skills: card.skills.map((s) => s.name),
        streaming: card.capabilities.streaming,
      }));

      return {
        content: [
          { type: "text", text: JSON.stringify(summary, null, 2) },
        ],
      };
    },
  });
}

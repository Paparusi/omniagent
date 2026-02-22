/**
 * swarm_result — Get the aggregated result from a completed swarm.
 */
import { Type } from "@sinclair/typebox";
import type { SwarmConfig } from "../config.js";
import { getOrchestrator } from "../orchestrator.js";

type ToolRegistrar = {
  registerTool(def: {
    name: string;
    label: string;
    description: string;
    parameters: unknown;
    execute: (id: string, params: any) => Promise<unknown>;
  }): void;
};

export function registerResultTool(api: ToolRegistrar, cfg: SwarmConfig) {
  api.registerTool({
    name: "swarm_result",
    label: "Swarm Result",
    description:
      "Get the aggregated result from a completed swarm. Shows the combined output " +
      "from all agents after consensus/aggregation.",
    parameters: Type.Object({
      swarm_id: Type.String({
        description: "The swarm ID to get results from.",
      }),
      agent_role: Type.Optional(
        Type.String({
          description: "Get result from a specific agent role only (e.g., 'coder', 'reviewer').",
        }),
      ),
    }),
    async execute(_id: string, params: any) {
      const orchestrator = getOrchestrator(cfg);
      const info = orchestrator.getSwarmInfo(params.swarm_id);

      if (!info) {
        return {
          content: [{ type: "text", text: `Swarm ${params.swarm_id} not found.` }],
        };
      }

      if (info.status !== "completed" && info.status !== "failed") {
        return {
          content: [
            {
              type: "text",
              text: `Swarm is still ${info.status}. Wait for completion or use swarm_status to check progress.`,
            },
          ],
        };
      }

      // Specific agent result
      if (params.agent_role) {
        const agentResult = info.results.find((r) => r.role === params.agent_role);
        if (!agentResult) {
          return {
            content: [
              {
                type: "text",
                text: `No agent with role "${params.agent_role}" in swarm. Available: ${info.results.map((r) => r.role).join(", ")}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: [
                `Agent Result: ${agentResult.role}`,
                `Status: ${agentResult.status}`,
                `Duration: ${Math.round(agentResult.durationMs / 1000)}s`,
                ``,
                agentResult.output,
              ].join("\n"),
            },
          ],
        };
      }

      // Full aggregated result
      return {
        content: [{ type: "text", text: info.aggregatedOutput }],
      };
    },
  });
}

/**
 * swarm_list — List all swarms.
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

export function registerSwarmListTool(api: ToolRegistrar, cfg: SwarmConfig) {
  api.registerTool({
    name: "swarm_list",
    label: "List Swarms",
    description: "List all active and completed swarms with their status.",
    parameters: Type.Object({
      status_filter: Type.Optional(
        Type.String({
          description: 'Filter by status: "executing", "completed", "failed", "cancelled". Omit for all.',
        }),
      ),
    }),
    async execute(_id: string, params: any) {
      const orchestrator = getOrchestrator(cfg);
      let swarms = orchestrator.listSwarms();

      if (params.status_filter) {
        swarms = swarms.filter((s) => s.status === params.status_filter);
      }

      if (swarms.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No swarms found. Use swarm_spawn to create a multi-agent swarm.",
            },
          ],
        };
      }

      const lines = [
        `Swarms (${swarms.length} total)`,
        ``,
        `  ${"ID".padEnd(30)} ${"Task".padEnd(35)} ${"Status".padEnd(12)} ${"Agents".padEnd(8)} Duration`,
        `  ${"─".repeat(30)} ${"─".repeat(35)} ${"─".repeat(12)} ${"─".repeat(8)} ${"─".repeat(10)}`,
      ];

      for (const s of swarms) {
        lines.push(
          `  ${s.id.padEnd(30)} ${s.task.slice(0, 35).padEnd(35)} ${s.status.padEnd(12)} ${String(s.agents.length).padEnd(8)} ${Math.round(s.durationMs / 1000)}s`,
        );
      }

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    },
  });
}

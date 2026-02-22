/**
 * swarm_status — Check the status of a swarm.
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

export function registerSwarmStatusTool(api: ToolRegistrar, cfg: SwarmConfig) {
  api.registerTool({
    name: "swarm_status",
    label: "Swarm Status",
    description:
      "Check the current status of a multi-agent swarm. Shows agent statuses, progress, and results.",
    parameters: Type.Object({
      swarm_id: Type.String({
        description: "The swarm ID returned by swarm_spawn.",
      }),
    }),
    async execute(_id: string, params: any) {
      const orchestrator = getOrchestrator(cfg);
      const info = orchestrator.getSwarmInfo(params.swarm_id);

      if (!info) {
        return {
          content: [{ type: "text", text: `Swarm ${params.swarm_id} not found.` }],
        };
      }

      const elapsed = info.durationMs
        ? `${Math.round(info.durationMs / 1000)}s`
        : "—";

      const agentLines = info.agents.map(
        (a) => `    ${a.role.padEnd(12)} ${a.status.padEnd(10)} ${a.task.slice(0, 50)}`,
      );

      const lines = [
        `Swarm Status: ${info.status.toUpperCase()}`,
        ``,
        `  Swarm ID:    ${info.id}`,
        `  Task:        ${info.task.slice(0, 80)}`,
        `  Consensus:   ${info.consensus}`,
        `  Duration:    ${elapsed}`,
        `  Messages:    ${info.messageCount}`,
        ``,
        `  Agents (${info.agents.length}):`,
        ...agentLines,
      ];

      if (info.results.length > 0) {
        const done = info.results.filter((r) => r.status === "done").length;
        const failed = info.results.filter((r) => r.status === "failed").length;
        lines.push(``, `  Results: ${done} done, ${failed} failed`);
      }

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    },
  });
}

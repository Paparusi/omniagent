/**
 * swarm_dissolve — Terminate a swarm and release resources.
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

export function registerDissolveTool(api: ToolRegistrar, cfg: SwarmConfig) {
  api.registerTool({
    name: "swarm_dissolve",
    label: "Dissolve Swarm",
    description:
      "Terminate a swarm, cancel all running agents, and release resources. " +
      "Use this to stop a long-running swarm or clean up completed ones.",
    parameters: Type.Object({
      swarm_id: Type.String({
        description: "The swarm ID to dissolve.",
      }),
    }),
    async execute(_id: string, params: any) {
      const orchestrator = getOrchestrator(cfg);

      try {
        const info = orchestrator.dissolve(params.swarm_id);
        if (!info) {
          return {
            content: [
              { type: "text", text: `Swarm ${params.swarm_id} not found.` },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: [
                `Swarm dissolved.`,
                ``,
                `  Swarm ID:  ${info.id}`,
                `  Task:      ${info.task.slice(0, 80)}`,
                `  Status:    ${info.status}`,
                `  Agents:    ${info.agents.length} (all cancelled)`,
                `  Duration:  ${Math.round(info.durationMs / 1000)}s`,
              ].join("\n"),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to dissolve: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  });
}

/**
 * swarm_broadcast — Send a message to all agents in a swarm.
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

export function registerBroadcastTool(api: ToolRegistrar, cfg: SwarmConfig) {
  api.registerTool({
    name: "swarm_broadcast",
    label: "Broadcast",
    description:
      "Broadcast a message to all agents in a running swarm. Useful for providing " +
      "additional context, changing direction, or sharing new information.",
    parameters: Type.Object({
      swarm_id: Type.String({
        description: "The swarm ID to broadcast to.",
      }),
      message: Type.String({
        description: "The message to send to all agents.",
      }),
      topic: Type.Optional(
        Type.String({
          description: 'Message topic/channel (default: "user:message").',
        }),
      ),
    }),
    async execute(_id: string, params: any) {
      const orchestrator = getOrchestrator(cfg);

      try {
        await orchestrator.broadcastToSwarm(
          params.swarm_id,
          params.topic ?? "user:message",
          { text: params.message },
        );

        return {
          content: [
            {
              type: "text",
              text: `Message broadcast to all agents in ${params.swarm_id}.`,
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to broadcast: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  });
}

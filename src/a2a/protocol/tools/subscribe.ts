/**
 * a2a_subscribe — subscribe to real-time task updates from a remote agent.
 */
import { Type } from "@sinclair/typebox";
import type { A2AProtocolConfig } from "../config.js";
import { A2AClient } from "../client/client.js";
import type { A2AStreamEvent } from "../types.js";
import type { ToolRegistrar } from "./index.js";

export function registerSubscribeTool(
  api: ToolRegistrar,
  config: A2AProtocolConfig,
): void {
  api.registerTool({
    name: "a2a_subscribe",
    label: "Subscribe to A2A Task Updates",
    description:
      "Subscribe to real-time updates from a running A2A task via SSE. " +
      "Collects updates until the task reaches a terminal state or the limit is reached.",
    parameters: Type.Object({
      agentUrl: Type.String({
        description: "Base URL of the remote A2A agent",
      }),
      taskId: Type.String({ description: "Task ID to subscribe to" }),
      maxUpdates: Type.Optional(
        Type.Number({
          description: "Max updates to receive (default 50)",
        }),
      ),
      timeoutSeconds: Type.Optional(
        Type.Number({
          description: "Timeout in seconds (default 300)",
        }),
      ),
      authToken: Type.Optional(
        Type.String({ description: "Bearer token for authentication" }),
      ),
    }),
    async execute(_id: string, params: any) {
      const maxUpdates = params.maxUpdates ?? 50;
      const timeout =
        (params.timeoutSeconds ?? config.client?.timeoutSeconds ?? 300) *
        1000;

      const client = new A2AClient({
        baseUrl: params.agentUrl,
        auth: params.authToken ? { token: params.authToken } : undefined,
        timeout,
      });

      const events: A2AStreamEvent[] = [];

      try {
        for await (const event of client.subscribe(params.taskId)) {
          events.push(event);
          if (events.length >= maxUpdates) break;
          if ("final" in event && event.final) break;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (events.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `Subscribe failed: ${msg}`,
              },
            ],
          };
        }
        // Partial results — return what we have
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                taskId: params.taskId,
                updates: events.length,
                events,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  });
}

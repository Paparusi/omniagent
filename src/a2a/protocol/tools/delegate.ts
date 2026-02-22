/**
 * a2a_delegate_task — send a task to a remote A2A agent.
 */
import { Type } from "@sinclair/typebox";
import type { A2AProtocolConfig } from "../config.js";
import type { A2ACardCache } from "../client/card-cache.js";
import { A2AClient } from "../client/client.js";
import type { A2AMessage, A2AStreamEvent } from "../types.js";
import type { ToolRegistrar } from "./index.js";

export function registerDelegateTool(
  api: ToolRegistrar,
  config: A2AProtocolConfig,
  cardCache: A2ACardCache,
): void {
  api.registerTool({
    name: "a2a_delegate_task",
    label: "Delegate Task to Remote Agent",
    description:
      "Send a task to a remote A2A-compatible agent. Returns the task result " +
      "when complete, or a task ID for async tracking.",
    parameters: Type.Object({
      agentUrl: Type.String({
        description: "Base URL of the remote A2A agent",
      }),
      message: Type.String({
        description: "Task message to send to the agent",
      }),
      sessionId: Type.Optional(
        Type.String({
          description: "Session ID for conversation continuity",
        }),
      ),
      stream: Type.Optional(
        Type.Boolean({ description: "Use streaming mode (default false)" }),
      ),
      waitForCompletion: Type.Optional(
        Type.Boolean({
          description: "Wait for task to complete (default true)",
        }),
      ),
      timeoutSeconds: Type.Optional(
        Type.Number({
          description: "Timeout in seconds (default 120)",
        }),
      ),
      authToken: Type.Optional(
        Type.String({ description: "Bearer token for authentication" }),
      ),
    }),
    async execute(_id: string, params: any) {
      const timeout =
        (params.timeoutSeconds ?? config.client?.timeoutSeconds ?? 120) *
        1000;
      const authToken = params.authToken;

      const client = new A2AClient({
        baseUrl: params.agentUrl,
        auth: authToken ? { token: authToken } : undefined,
        timeout,
      });

      const a2aMessage: A2AMessage = {
        role: "user",
        parts: [{ type: "text", text: params.message }],
      };

      // Streaming mode
      if (params.stream) {
        const events: A2AStreamEvent[] = [];
        try {
          for await (const event of client.sendMessageStream({
            message: a2aMessage,
            sessionId: params.sessionId,
          })) {
            events.push(event);
            if ("final" in event && event.final) break;
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [
              {
                type: "text",
                text: `Streaming error: ${msg}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(events, null, 2),
            },
          ],
        };
      }

      // Sync mode
      try {
        const task = await client.sendMessage({
          message: a2aMessage,
          sessionId: params.sessionId,
        });

        // Format result
        const result: Record<string, unknown> = {
          taskId: task.id,
          status: task.status.state,
        };

        if (task.artifacts?.length) {
          result.artifacts = task.artifacts;
        }

        if (task.status.message) {
          const texts = task.status.message.parts
            .filter((p: any) => p.type === "text")
            .map((p: any) => p.text);
          if (texts.length) result.response = texts.join("\n");
        }

        return {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [
            { type: "text", text: `Delegation failed: ${msg}` },
          ],
        };
      }
    },
  });
}

/**
 * a2a_task_cancel — cancel a running A2A task.
 */
import { Type } from "@sinclair/typebox";
import type { A2AProtocolConfig } from "../config.js";
import { A2AClient } from "../client/client.js";
import type { ToolRegistrar } from "./index.js";

export function registerCancelTool(
  api: ToolRegistrar,
  config: A2AProtocolConfig,
): void {
  api.registerTool({
    name: "a2a_task_cancel",
    label: "Cancel A2A Task",
    description:
      "Cancel a running task on a remote A2A agent.",
    parameters: Type.Object({
      agentUrl: Type.String({
        description: "Base URL of the remote A2A agent",
      }),
      taskId: Type.String({ description: "Task ID to cancel" }),
      authToken: Type.Optional(
        Type.String({ description: "Bearer token for authentication" }),
      ),
    }),
    async execute(_id: string, params: any) {
      const timeout =
        (config.client?.timeoutSeconds ?? 120) * 1000;

      const client = new A2AClient({
        baseUrl: params.agentUrl,
        auth: params.authToken ? { token: params.authToken } : undefined,
        timeout,
      });

      try {
        const task = await client.cancelTask(params.taskId);
        return {
          content: [
            {
              type: "text",
              text: `Task ${params.taskId} canceled. Status: ${task.status.state}`,
            },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [
            { type: "text", text: `Failed to cancel task: ${msg}` },
          ],
        };
      }
    },
  });
}

/**
 * a2a_task_status — check the status of a delegated A2A task.
 */
import { Type } from "@sinclair/typebox";
import type { A2AProtocolConfig } from "../config.js";
import { A2AClient } from "../client/client.js";
import type { ToolRegistrar } from "./index.js";

export function registerStatusTool(
  api: ToolRegistrar,
  config: A2AProtocolConfig,
): void {
  api.registerTool({
    name: "a2a_task_status",
    label: "Check A2A Task Status",
    description:
      "Check the current status of a task delegated to a remote A2A agent.",
    parameters: Type.Object({
      agentUrl: Type.String({
        description: "Base URL of the remote A2A agent",
      }),
      taskId: Type.String({ description: "Task ID to check" }),
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
        const task = await client.getTask(params.taskId);
        return {
          content: [
            { type: "text", text: JSON.stringify(task, null, 2) },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [
            { type: "text", text: `Failed to get task status: ${msg}` },
          ],
        };
      }
    },
  });
}

/**
 * shannon_cancel — Cancel a running security scan.
 */
import { Type } from "@sinclair/typebox";
import type { ShannonConfig } from "../config.js";
import { getShannonService } from "../service.js";

type ToolRegistrar = {
  registerTool(def: {
    name: string;
    label: string;
    description: string;
    parameters: unknown;
    execute: (id: string, params: any) => Promise<unknown>;
  }): void;
};

export function registerCancelTool(api: ToolRegistrar, cfg: ShannonConfig) {
  api.registerTool({
    name: "shannon_cancel",
    label: "Cancel Scan",
    description:
      "Cancel a running Shannon security scan. Stops the scan pipeline and marks it as cancelled.",
    parameters: Type.Object({
      workflow_id: Type.String({
        description: "The workflow ID of the scan to cancel.",
      }),
    }),
    async execute(_id: string, params: any) {
      const service = getShannonService(cfg);

      try {
        const info = await service.cancelScan(params.workflow_id);

        return {
          content: [
            {
              type: "text",
              text: [
                `Scan cancelled.`,
                ``,
                `  Workflow ID: ${info.workflowId}`,
                `  Target:      ${info.targetUrl}`,
                `  Status:      ${info.status}`,
              ].join("\n"),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to cancel scan: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  });
}

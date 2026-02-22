/**
 * shannon_status — Check the progress of a running security scan.
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

export function registerStatusTool(api: ToolRegistrar, cfg: ShannonConfig) {
  api.registerTool({
    name: "shannon_status",
    label: "Scan Status",
    description:
      "Check the current status and progress of a Shannon security scan. " +
      "Shows the current phase, active agent, completed agents, and elapsed time.",
    parameters: Type.Object({
      workflow_id: Type.String({
        description: "The workflow ID returned by shannon_scan.",
      }),
    }),
    async execute(_id: string, params: any) {
      const service = getShannonService(cfg);

      try {
        const info = await service.getScanStatus(params.workflow_id);

        const phases = [
          "pre-recon",
          "recon",
          "vulnerability-exploitation",
          "reporting",
        ];
        const currentIdx = info.currentPhase
          ? phases.indexOf(info.currentPhase)
          : -1;
        const progress =
          currentIdx >= 0
            ? `${currentIdx + 1}/${phases.length}`
            : info.status === "completed"
              ? `${phases.length}/${phases.length}`
              : "—";

        const elapsed = info.elapsedMs
          ? `${Math.round(info.elapsedMs / 1000)}s`
          : info.startedAt
            ? `${Math.round((Date.now() - info.startedAt) / 1000)}s`
            : "—";

        const lines = [
          `Scan Status: ${info.status.toUpperCase()}`,
          ``,
          `  Workflow ID:      ${info.workflowId}`,
          `  Target:           ${info.targetUrl}`,
          `  Phase Progress:   ${progress}`,
          `  Current Phase:    ${info.currentPhase ?? "—"}`,
          `  Current Agent:    ${info.currentAgent ?? "—"}`,
          `  Elapsed:          ${elapsed}`,
        ];

        if (info.completedAgents && info.completedAgents.length > 0) {
          lines.push(`  Completed Agents: ${info.completedAgents.join(", ")}`);
        }

        if (info.error) {
          lines.push(`  Error:            ${info.error}`);
        }

        return {
          content: [{ type: "text", text: lines.join("\n") }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get scan status: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  });
}

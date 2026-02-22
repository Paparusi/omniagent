/**
 * shannon_report — Retrieve the security assessment report from a completed scan.
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

export function registerReportTool(api: ToolRegistrar, cfg: ShannonConfig) {
  api.registerTool({
    name: "shannon_report",
    label: "Scan Report",
    description:
      "Retrieve the comprehensive security assessment report from a completed Shannon scan. " +
      "Returns the full markdown report including findings, severity ratings, and remediation steps.",
    parameters: Type.Object({
      workflow_id: Type.String({
        description: "The workflow ID of the completed scan.",
      }),
      deliverable: Type.Optional(
        Type.String({
          description:
            "Specific deliverable file to retrieve. If not specified, returns the main comprehensive report.",
        }),
      ),
    }),
    async execute(_id: string, params: any) {
      const service = getShannonService(cfg);

      try {
        const report = await service.getScanReport(params.workflow_id);

        const lines = [
          `Security Assessment Report`,
          `══════════════════════════`,
          ``,
          `  Workflow ID:    ${report.workflowId}`,
          `  Report Path:    ${report.reportPath}`,
          `  Deliverables:   ${report.deliverables.length} files`,
        ];

        if (report.deliverables.length > 0) {
          lines.push(`  Files:`);
          for (const d of report.deliverables) {
            lines.push(`    - ${d}`);
          }
        }

        if (report.content) {
          lines.push(``, `─── Report Content ───`, ``, report.content);
        }

        return {
          content: [{ type: "text", text: lines.join("\n") }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to retrieve report: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  });
}

/**
 * shannon_list — List all known security scans.
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

export function registerListTool(api: ToolRegistrar, cfg: ShannonConfig) {
  api.registerTool({
    name: "shannon_list",
    label: "List Scans",
    description:
      "List all known Shannon security scans with their status. " +
      "Shows workflow IDs, targets, and current status for all tracked scans.",
    parameters: Type.Object({
      status_filter: Type.Optional(
        Type.String({
          description:
            'Filter by status: "running", "completed", "failed", "cancelled". Omit for all.',
        }),
      ),
    }),
    async execute(_id: string, params: any) {
      const service = getShannonService(cfg);
      let scans = service.listScans();

      if (params.status_filter) {
        scans = scans.filter((s) => s.status === params.status_filter);
      }

      if (scans.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: params.status_filter
                ? `No scans with status "${params.status_filter}" found.`
                : "No scans found. Use shannon_scan to start a security scan.",
            },
          ],
        };
      }

      const lines = [`Shannon Scans (${scans.length} total)`, ``, `  ${"ID".padEnd(45)} ${"Target".padEnd(30)} ${"Status".padEnd(12)} Started`];
      lines.push(`  ${"─".repeat(45)} ${"─".repeat(30)} ${"─".repeat(12)} ${"─".repeat(20)}`);

      for (const scan of scans) {
        const started = scan.startedAt
          ? new Date(scan.startedAt).toISOString().replace("T", " ").slice(0, 19)
          : "—";
        lines.push(
          `  ${scan.workflowId.padEnd(45)} ${scan.targetUrl.slice(0, 30).padEnd(30)} ${scan.status.padEnd(12)} ${started}`,
        );
      }

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    },
  });
}

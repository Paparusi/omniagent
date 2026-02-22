/**
 * shannon_scan — Start an autonomous security scan.
 *
 * Launches Shannon's multi-agent pentest pipeline against a target URL.
 * 13 AI agents work through 5 phases: pre-recon → recon → vulnerability
 * analysis → exploitation → reporting.
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

export function registerScanTool(api: ToolRegistrar, cfg: ShannonConfig) {
  api.registerTool({
    name: "shannon_scan",
    label: "Security Scan",
    description:
      "Start an autonomous AI-powered security scan against a target web application. " +
      "Shannon deploys 13 specialized agents across 5 phases: pre-reconnaissance, " +
      "reconnaissance, vulnerability analysis (injection, XSS, auth, SSRF, authz), " +
      "exploitation, and comprehensive reporting. Returns a workflow ID to track progress.",
    parameters: Type.Object({
      target_url: Type.String({
        description: "Target web application URL to scan (e.g., https://example.com)",
      }),
      repo_path: Type.Optional(
        Type.String({
          description: "Path to source code repository for static analysis. If not provided, only dynamic analysis is performed.",
        }),
      ),
      config_path: Type.Optional(
        Type.String({
          description: "Path to custom YAML config file for scan configuration (scope, exclusions, auth).",
        }),
      ),
      output_dir: Type.Optional(
        Type.String({
          description: "Directory to save scan reports. Defaults to ./audit-logs/",
        }),
      ),
      testing_mode: Type.Optional(
        Type.Boolean({
          description: "Enable pipeline testing mode with shorter timeouts. Default: false.",
        }),
      ),
    }),
    async execute(_id: string, params: any) {
      const service = getShannonService(cfg);

      try {
        const scan = await service.startScan({
          targetUrl: params.target_url,
          repoPath: params.repo_path,
          configPath: params.config_path,
          outputDir: params.output_dir,
          pipelineTestingMode: params.testing_mode,
        });

        return {
          content: [
            {
              type: "text",
              text: [
                `Security scan started successfully.`,
                ``,
                `  Workflow ID: ${scan.workflowId}`,
                `  Target:      ${scan.targetUrl}`,
                `  Status:      ${scan.status}`,
                `  Started:     ${new Date(scan.startedAt).toISOString()}`,
                ``,
                `The scan will progress through 5 phases with 13 AI agents:`,
                `  1. Pre-Reconnaissance (code analysis)`,
                `  2. Reconnaissance (attack surface mapping)`,
                `  3. Vulnerability Analysis (injection, XSS, auth, SSRF, authz)`,
                `  4. Exploitation (proof-of-concept for discovered vulns)`,
                `  5. Reporting (comprehensive security assessment)`,
                ``,
                `Use shannon_status to check progress.`,
                `Use shannon_report to retrieve results when complete.`,
              ].join("\n"),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to start scan: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  });
}

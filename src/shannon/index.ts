/**
 * Shannon — Autonomous AI Security Scanner
 *
 * Integrates Shannon's multi-agent pentest pipeline as OmniAgent tools.
 * Shannon deploys 13 specialized AI agents across 5 phases to perform
 * comprehensive security assessments of web applications.
 *
 * Tools registered (5):
 *   - shannon_scan       Start a security scan
 *   - shannon_status     Check scan progress
 *   - shannon_report     Retrieve scan report
 *   - shannon_cancel     Cancel a running scan
 *   - shannon_list       List all scans
 *
 * CLI commands:
 *   /shannon status      Show Shannon integration status
 *   /shannon scans       List active scans
 */
import type { OmniAgentPluginApi } from "omniagent/plugin-sdk";
import { type ShannonConfig, loadShannonConfig } from "./config.js";
import { registerShannonTools } from "./tools/index.js";
import { registerShannonCommands } from "./commands.js";

export function registerShannon(
  api: OmniAgentPluginApi,
  cfg?: ShannonConfig,
): void {
  const resolvedCfg = cfg ?? loadShannonConfig();

  if (!resolvedCfg.enabled) {
    api.logger.info("Shannon: disabled (SHANNON_ENABLED=false or SHANNON_PATH not set)");
    return;
  }

  // ── Register tools ─────────────────────────────────────────────
  registerShannonTools(api, resolvedCfg);
  api.logger.info("Shannon: 5 security tools registered");

  // ── CLI commands ───────────────────────────────────────────────
  registerShannonCommands(api, resolvedCfg);

  // ── Lifecycle hooks ────────────────────────────────────────────

  // Inject Shannon capabilities into agent context
  api.on("before_prompt_build", async () => {
    return {
      prependContext:
        `<shannon-security>\n` +
        `Shannon autonomous security scanner is available.\n` +
        `Use shannon_scan to start a pentest against a web application.\n` +
        `Shannon deploys 13 AI agents across 5 phases: pre-recon, recon,\n` +
        `vulnerability analysis (injection/XSS/auth/SSRF/authz), exploitation, and reporting.\n` +
        `Use shannon_status to check progress, shannon_report to get results.\n` +
        `</shannon-security>`,
    };
  });

  // Log Shannon tool usage
  api.on("after_tool_call", async (event: any) => {
    const toolName: string = event?.toolName || "";
    if (toolName.startsWith("shannon_")) {
      api.logger.debug(`Shannon tool called: ${toolName}`);
    }
  });

  // ── Service registration ───────────────────────────────────────
  api.registerService({
    id: "shannon",
    async start() {
      api.logger.info(
        `Shannon: service started (mode=${resolvedCfg.mode}, path=${resolvedCfg.shannonPath || "not set"})`,
      );
    },
    stop() {
      api.logger.info("Shannon: service stopped");
    },
  });
}

export { loadShannonConfig } from "./config.js";
export type { ShannonConfig } from "./config.js";

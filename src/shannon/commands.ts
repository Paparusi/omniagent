/**
 * Shannon CLI commands — /shannon
 *
 * Subcommands:
 *   /shannon status   — Show Shannon integration status
 *   /shannon scans    — List active and recent scans
 *   /shannon info     — Show Shannon architecture info
 */
import type { OmniAgentPluginApi } from "omniagent/plugin-sdk";
import type { ShannonConfig } from "./config.js";
import { getShannonService } from "./service.js";

export function registerShannonCommands(
  api: OmniAgentPluginApi,
  cfg: ShannonConfig,
): void {
  api.registerCommand({
    name: "shannon",
    description: "Shannon autonomous security scanner",
    async handler(args: string) {
      const sub = args.trim().split(/\s+/)[0] ?? "status";

      switch (sub) {
        case "status":
          return formatStatus(cfg);
        case "scans":
          return formatScans(cfg);
        case "info":
          return formatInfo();
        default:
          return [
            `Unknown subcommand: ${sub}`,
            ``,
            `Available commands:`,
            `  /shannon status   Show integration status`,
            `  /shannon scans    List active and recent scans`,
            `  /shannon info     Show Shannon architecture info`,
          ].join("\n");
      }
    },
  });
}

function formatStatus(cfg: ShannonConfig): string {
  const service = getShannonService(cfg);
  const scans = service.listScans();
  const active = scans.filter((s) => s.status === "running").length;
  const completed = scans.filter((s) => s.status === "completed").length;
  const failed = scans.filter((s) => s.status === "failed").length;

  return [
    `Shannon Security Scanner`,
    `════════════════════════`,
    ``,
    `  Status:       enabled`,
    `  Mode:         ${cfg.mode}`,
    `  Shannon Path: ${cfg.shannonPath || "(not set)"}`,
    `  Temporal:     ${cfg.temporal.address}`,
    `  Task Queue:   ${cfg.temporal.taskQueue}`,
    `  Output Dir:   ${cfg.outputDir}`,
    `  Max Scans:    ${cfg.maxConcurrentScans}`,
    `  Timeout:      ${Math.round(cfg.timeoutMs / 60000)} min`,
    ``,
    `  Scans:`,
    `    Active:     ${active}`,
    `    Completed:  ${completed}`,
    `    Failed:     ${failed}`,
    `    Total:      ${scans.length}`,
  ].join("\n");
}

function formatScans(cfg: ShannonConfig): string {
  const service = getShannonService(cfg);
  const scans = service.listScans();

  if (scans.length === 0) {
    return "No scans found. Use shannon_scan tool to start a security scan.";
  }

  const lines = [
    `Shannon Scans`,
    `═════════════`,
    ``,
  ];

  for (const scan of scans) {
    const elapsed = scan.startedAt
      ? `${Math.round((Date.now() - scan.startedAt) / 1000)}s`
      : "—";
    const statusIcon =
      scan.status === "running"
        ? "▶"
        : scan.status === "completed"
          ? "✓"
          : scan.status === "failed"
            ? "✗"
            : "■";

    lines.push(
      `  ${statusIcon} ${scan.workflowId}`,
      `    Target: ${scan.targetUrl}`,
      `    Status: ${scan.status}  |  Elapsed: ${elapsed}`,
    );

    if (scan.currentPhase) {
      lines.push(`    Phase:  ${scan.currentPhase}  |  Agent: ${scan.currentAgent ?? "—"}`);
    }
    if (scan.completedAgents && scan.completedAgents.length > 0) {
      lines.push(`    Done:   ${scan.completedAgents.join(", ")}`);
    }
    if (scan.error) {
      lines.push(`    Error:  ${scan.error}`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}

function formatInfo(): string {
  return [
    `Shannon — Autonomous AI Security Scanner`,
    `═════════════════════════════════════════`,
    ``,
    `Shannon is a multi-agent AI pentesting system that autonomously`,
    `performs comprehensive security assessments of web applications.`,
    ``,
    `Architecture:`,
    `  13 specialized AI agents organized in 5 phases:`,
    ``,
    `  Phase 1 — Pre-Reconnaissance`,
    `    └─ pre-recon: Static code analysis, dependency audit`,
    ``,
    `  Phase 2 — Reconnaissance`,
    `    └─ recon: Attack surface mapping, endpoint discovery`,
    ``,
    `  Phase 3 — Vulnerability Analysis (parallel)`,
    `    ├─ injection-vuln: SQL/NoSQL/Command injection`,
    `    ├─ xss-vuln: Cross-site scripting`,
    `    ├─ auth-vuln: Authentication flaws`,
    `    ├─ ssrf-vuln: Server-side request forgery`,
    `    └─ authz-vuln: Authorization/access control`,
    ``,
    `  Phase 4 — Exploitation (parallel, conditional)`,
    `    ├─ injection-exploit: PoC for injection vulns`,
    `    ├─ xss-exploit: PoC for XSS vulns`,
    `    ├─ auth-exploit: PoC for auth vulns`,
    `    ├─ ssrf-exploit: PoC for SSRF vulns`,
    `    └─ authz-exploit: PoC for authz vulns`,
    ``,
    `  Phase 5 — Reporting`,
    `    └─ report: Comprehensive security assessment`,
    ``,
    `Orchestration: Temporal workflow engine`,
    `AI Backend:    Claude Agent SDK (Anthropic)`,
    `Output:        Markdown reports + JSON vulnerability queues`,
    ``,
    `OmniAgent Tools:`,
    `  shannon_scan     Start a security scan`,
    `  shannon_status   Check scan progress`,
    `  shannon_report   Get scan report`,
    `  shannon_cancel   Cancel running scan`,
    `  shannon_list     List all scans`,
  ].join("\n");
}

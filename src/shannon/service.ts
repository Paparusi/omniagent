/**
 * Shannon service — manages pentest scan lifecycle.
 *
 * Two execution modes:
 *   - "temporal": Direct Temporal client connection
 *   - "cli": Subprocess execution of Shannon CLI
 *   - "auto": Try temporal first, fallback to CLI
 */
import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { ShannonConfig } from "./config.js";

const execAsync = promisify(exec);

// ── Types ──────────────────────────────────────────────────────

export interface ScanRequest {
  targetUrl: string;
  repoPath?: string;
  configPath?: string;
  outputDir?: string;
  pipelineTestingMode?: boolean;
}

export interface ScanInfo {
  workflowId: string;
  targetUrl: string;
  status: "running" | "completed" | "failed" | "cancelled" | "unknown";
  startedAt: number;
  currentPhase?: string | null;
  currentAgent?: string | null;
  completedAgents?: string[];
  error?: string | null;
  elapsedMs?: number;
}

export interface ScanReport {
  workflowId: string;
  reportPath: string;
  content: string;
  deliverables: string[];
}

// ── Service ────────────────────────────────────────────────────

export class ShannonService {
  private scans = new Map<string, ScanInfo>();
  private activeMode: "temporal" | "cli" | null = null;

  constructor(private config: ShannonConfig) {}

  /** Detect which execution mode to use */
  async detectMode(): Promise<"temporal" | "cli"> {
    if (this.config.mode !== "auto") {
      return this.config.mode as "temporal" | "cli";
    }

    // Try temporal connection
    try {
      const { stdout } = await execAsync(
        `temporal workflow list --address ${this.config.temporal.address} --limit 1`,
        { timeout: 5000 },
      );
      return "temporal";
    } catch {
      // Fallback to CLI if Shannon path exists
      if (this.config.shannonPath && existsSync(this.config.shannonPath)) {
        return "cli";
      }
      return "cli";
    }
  }

  /** Start a new pentest scan */
  async startScan(request: ScanRequest): Promise<ScanInfo> {
    // Check concurrent scan limit
    const activeCount = [...this.scans.values()].filter(
      (s) => s.status === "running",
    ).length;
    if (activeCount >= this.config.maxConcurrentScans) {
      throw new Error(
        `Max concurrent scans reached (${this.config.maxConcurrentScans}). Cancel or wait for existing scans.`,
      );
    }

    const mode = this.activeMode ?? (await this.detectMode());
    this.activeMode = mode;

    if (mode === "temporal") {
      return this.startTemporalScan(request);
    }
    return this.startCliScan(request);
  }

  /** Get scan status/progress */
  async getScanStatus(workflowId: string): Promise<ScanInfo> {
    const cached = this.scans.get(workflowId);

    // If cached and terminal, return as-is
    if (
      cached &&
      (cached.status === "completed" ||
        cached.status === "failed" ||
        cached.status === "cancelled")
    ) {
      return cached;
    }

    const mode = this.activeMode ?? (await this.detectMode());

    if (mode === "temporal") {
      return this.queryTemporalStatus(workflowId);
    }
    return this.queryCliStatus(workflowId);
  }

  /** Get scan report */
  async getScanReport(workflowId: string): Promise<ScanReport> {
    const outputDir = resolve(this.config.outputDir);
    const scanDir = join(outputDir, workflowId, "deliverables");

    if (!existsSync(scanDir)) {
      // Try finding by partial match
      const parentDir = join(outputDir, workflowId);
      if (!existsSync(parentDir)) {
        throw new Error(
          `No report found for workflow ${workflowId}. Scan may still be running.`,
        );
      }
      // Check if deliverables dir exists under different structure
      const altDir = join(parentDir, "deliverables");
      if (!existsSync(altDir)) {
        throw new Error(
          `Deliverables directory not found for ${workflowId}. Scan may still be in progress.`,
        );
      }
    }

    const deliverables = readdirSync(scanDir).filter(
      (f) => f.endsWith(".md") || f.endsWith(".json"),
    );

    // Read the main report
    const mainReport = deliverables.find((f) =>
      f.includes("comprehensive_security_assessment"),
    );
    const reportPath = mainReport
      ? join(scanDir, mainReport)
      : deliverables.length > 0
        ? join(scanDir, deliverables[0])
        : scanDir;

    let content = "";
    if (mainReport || deliverables.length > 0) {
      content = readFileSync(reportPath, "utf-8");
    }

    return {
      workflowId,
      reportPath,
      content,
      deliverables,
    };
  }

  /** Cancel a running scan */
  async cancelScan(workflowId: string): Promise<ScanInfo> {
    const mode = this.activeMode ?? (await this.detectMode());

    if (mode === "temporal") {
      return this.cancelTemporalScan(workflowId);
    }
    return this.cancelCliScan(workflowId);
  }

  /** List all known scans */
  listScans(): ScanInfo[] {
    return [...this.scans.values()].sort((a, b) => b.startedAt - a.startedAt);
  }

  // ── Temporal Mode ────────────────────────────────────────────

  private async startTemporalScan(request: ScanRequest): Promise<ScanInfo> {
    const hostname = new URL(request.targetUrl).hostname.replace(
      /[^a-zA-Z0-9-]/g,
      "_",
    );
    const workflowId = `${hostname}_shannon-${Date.now()}`;

    try {
      const args = [
        "workflow",
        "start",
        "--address",
        this.config.temporal.address,
        "--task-queue",
        this.config.temporal.taskQueue,
        "--type",
        "pentestPipelineWorkflow",
        "--workflow-id",
        workflowId,
        "--input",
        JSON.stringify({
          webUrl: request.targetUrl,
          repoPath: request.repoPath ?? hostname,
          configPath: request.configPath,
          outputPath: request.outputDir ?? this.config.outputDir,
          pipelineTestingMode: request.pipelineTestingMode ?? false,
        }),
      ];

      await execAsync(`temporal ${args.join(" ")}`, {
        timeout: 30000,
      });

      const info: ScanInfo = {
        workflowId,
        targetUrl: request.targetUrl,
        status: "running",
        startedAt: Date.now(),
        currentPhase: "initializing",
        currentAgent: null,
        completedAgents: [],
      };

      this.scans.set(workflowId, info);
      return info;
    } catch (err) {
      throw new Error(
        `Failed to start Temporal workflow: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async queryTemporalStatus(workflowId: string): Promise<ScanInfo> {
    try {
      const { stdout } = await execAsync(
        `temporal workflow query --address ${this.config.temporal.address} --workflow-id ${workflowId} --type getProgress --output json`,
        { timeout: 10000 },
      );

      const progress = JSON.parse(stdout);
      const info: ScanInfo = {
        workflowId,
        targetUrl: progress.webUrl ?? this.scans.get(workflowId)?.targetUrl ?? "unknown",
        status: progress.status ?? "running",
        startedAt: progress.startTime ?? this.scans.get(workflowId)?.startedAt ?? 0,
        currentPhase: progress.currentPhase,
        currentAgent: progress.currentAgent,
        completedAgents: progress.completedAgents ?? [],
        error: progress.error,
        elapsedMs: progress.elapsedMs,
      };

      this.scans.set(workflowId, info);
      return info;
    } catch {
      // Try describe as fallback
      try {
        const { stdout } = await execAsync(
          `temporal workflow describe --address ${this.config.temporal.address} --workflow-id ${workflowId} --output json`,
          { timeout: 10000 },
        );
        const desc = JSON.parse(stdout);
        const status =
          desc.workflowExecutionInfo?.status === "WORKFLOW_EXECUTION_STATUS_COMPLETED"
            ? "completed"
            : desc.workflowExecutionInfo?.status === "WORKFLOW_EXECUTION_STATUS_FAILED"
              ? "failed"
              : desc.workflowExecutionInfo?.status === "WORKFLOW_EXECUTION_STATUS_CANCELED"
                ? "cancelled"
                : "unknown";

        const info: ScanInfo = {
          workflowId,
          targetUrl: this.scans.get(workflowId)?.targetUrl ?? "unknown",
          status,
          startedAt: this.scans.get(workflowId)?.startedAt ?? 0,
        };
        this.scans.set(workflowId, info);
        return info;
      } catch {
        const cached = this.scans.get(workflowId);
        if (cached) return cached;
        return {
          workflowId,
          targetUrl: "unknown",
          status: "unknown",
          startedAt: 0,
        };
      }
    }
  }

  private async cancelTemporalScan(workflowId: string): Promise<ScanInfo> {
    try {
      await execAsync(
        `temporal workflow cancel --address ${this.config.temporal.address} --workflow-id ${workflowId}`,
        { timeout: 10000 },
      );
    } catch {
      /* may already be done */
    }

    const info: ScanInfo = {
      workflowId,
      targetUrl: this.scans.get(workflowId)?.targetUrl ?? "unknown",
      status: "cancelled",
      startedAt: this.scans.get(workflowId)?.startedAt ?? 0,
    };
    this.scans.set(workflowId, info);
    return info;
  }

  // ── CLI Mode ─────────────────────────────────────────────────

  private async startCliScan(request: ScanRequest): Promise<ScanInfo> {
    const shannonPath = resolve(this.config.shannonPath);
    const shannonBin = join(shannonPath, "shannon");

    if (!existsSync(shannonBin)) {
      throw new Error(
        `Shannon CLI not found at ${shannonBin}. Set SHANNON_PATH to the Shannon installation directory.`,
      );
    }

    const hostname = new URL(request.targetUrl).hostname.replace(
      /[^a-zA-Z0-9-]/g,
      "_",
    );
    const workflowId = `${hostname}_shannon-${Date.now()}`;

    const args = [`URL=${request.targetUrl}`, `REPO=${request.repoPath ?? hostname}`];
    if (request.configPath) args.push(`CONFIG=${request.configPath}`);
    if (request.outputDir) args.push(`OUTPUT=${request.outputDir}`);
    if (request.pipelineTestingMode) args.push(`PIPELINE_TESTING=true`);

    // Start Shannon as a detached subprocess
    const child = spawn(shannonBin, ["start", ...args], {
      cwd: shannonPath,
      detached: true,
      stdio: "ignore",
      shell: true,
    });
    child.unref();

    const info: ScanInfo = {
      workflowId,
      targetUrl: request.targetUrl,
      status: "running",
      startedAt: Date.now(),
      currentPhase: "initializing",
      currentAgent: null,
      completedAgents: [],
    };

    this.scans.set(workflowId, info);
    return info;
  }

  private async queryCliStatus(workflowId: string): Promise<ScanInfo> {
    const shannonPath = resolve(this.config.shannonPath);
    const shannonBin = join(shannonPath, "shannon");

    try {
      const { stdout } = await execAsync(
        `"${shannonBin}" query ID=${workflowId}`,
        { cwd: shannonPath, timeout: 10000, shell: true as any },
      );

      // Parse Shannon query output
      const statusMatch = stdout.match(/Status:\s*(\w+)/i);
      const phaseMatch = stdout.match(/Phase:\s*([^\n]+)/i);
      const agentMatch = stdout.match(/Agent:\s*([^\n]+)/i);

      const status = statusMatch?.[1]?.toLowerCase() ?? "unknown";
      const info: ScanInfo = {
        workflowId,
        targetUrl: this.scans.get(workflowId)?.targetUrl ?? "unknown",
        status: status as ScanInfo["status"],
        startedAt: this.scans.get(workflowId)?.startedAt ?? 0,
        currentPhase: phaseMatch?.[1]?.trim(),
        currentAgent: agentMatch?.[1]?.trim(),
      };

      this.scans.set(workflowId, info);
      return info;
    } catch {
      // Check if output dir exists with completed report
      const outputDir = resolve(this.config.outputDir);
      const reportPath = join(
        outputDir,
        workflowId,
        "deliverables",
        "comprehensive_security_assessment_report.md",
      );

      if (existsSync(reportPath)) {
        const info: ScanInfo = {
          workflowId,
          targetUrl: this.scans.get(workflowId)?.targetUrl ?? "unknown",
          status: "completed",
          startedAt: this.scans.get(workflowId)?.startedAt ?? 0,
        };
        this.scans.set(workflowId, info);
        return info;
      }

      const cached = this.scans.get(workflowId);
      if (cached) return cached;
      return {
        workflowId,
        targetUrl: "unknown",
        status: "unknown",
        startedAt: 0,
      };
    }
  }

  private async cancelCliScan(workflowId: string): Promise<ScanInfo> {
    const shannonPath = resolve(this.config.shannonPath);
    const shannonBin = join(shannonPath, "shannon");

    try {
      await execAsync(`"${shannonBin}" stop`, {
        cwd: shannonPath,
        timeout: 30000,
        shell: true as any,
      });
    } catch {
      /* best effort */
    }

    const info: ScanInfo = {
      workflowId,
      targetUrl: this.scans.get(workflowId)?.targetUrl ?? "unknown",
      status: "cancelled",
      startedAt: this.scans.get(workflowId)?.startedAt ?? 0,
    };
    this.scans.set(workflowId, info);
    return info;
  }
}

// ── Singleton ────────────────────────────────────────────────

let _service: ShannonService | null = null;

export function getShannonService(config: ShannonConfig): ShannonService {
  if (!_service) {
    _service = new ShannonService(config);
  }
  return _service;
}

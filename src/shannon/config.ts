/**
 * Shannon configuration — loaded from environment variables.
 *
 * Env vars:
 *   SHANNON_ENABLED        — Enable Shannon integration (default: true if SHANNON_PATH set)
 *   SHANNON_PATH           — Path to Shannon installation (e.g., /opt/shannon or D:\shannon)
 *   SHANNON_TEMPORAL_ADDRESS — Temporal server address (default: localhost:7233)
 *   SHANNON_TASK_QUEUE     — Temporal task queue (default: shannon-pipeline)
 *   SHANNON_MODE           — Execution mode: "temporal" | "cli" (default: auto-detect)
 *   SHANNON_OUTPUT_DIR     — Default output directory for reports (default: ./audit-logs)
 *   SHANNON_MAX_SCANS      — Max concurrent scans (default: 3)
 *   SHANNON_TIMEOUT_MS     — Scan timeout in ms (default: 7200000 = 2 hours)
 */

export interface ShannonConfig {
  enabled: boolean;
  shannonPath: string;
  temporal: {
    address: string;
    taskQueue: string;
  };
  mode: "temporal" | "cli" | "auto";
  outputDir: string;
  maxConcurrentScans: number;
  timeoutMs: number;
}

export function loadShannonConfig(): ShannonConfig {
  const shannonPath = process.env.SHANNON_PATH ?? "";
  const enabled =
    process.env.SHANNON_ENABLED !== undefined
      ? process.env.SHANNON_ENABLED === "true"
      : shannonPath.length > 0;

  return {
    enabled,
    shannonPath,
    temporal: {
      address: process.env.SHANNON_TEMPORAL_ADDRESS ?? "localhost:7233",
      taskQueue: process.env.SHANNON_TASK_QUEUE ?? "shannon-pipeline",
    },
    mode: (process.env.SHANNON_MODE as ShannonConfig["mode"]) ?? "auto",
    outputDir: process.env.SHANNON_OUTPUT_DIR ?? "./audit-logs",
    maxConcurrentScans: parseInt(process.env.SHANNON_MAX_SCANS ?? "3", 10),
    timeoutMs: parseInt(process.env.SHANNON_TIMEOUT_MS ?? "7200000", 10),
  };
}

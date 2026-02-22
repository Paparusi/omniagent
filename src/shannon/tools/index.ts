/**
 * Shannon tool registration — registers all 5 Shannon pentest tools.
 */
import type { ShannonConfig } from "../config.js";
import { registerScanTool } from "./scan.js";
import { registerStatusTool } from "./status.js";
import { registerReportTool } from "./report.js";
import { registerCancelTool } from "./cancel.js";
import { registerListTool } from "./list.js";

export function registerShannonTools(api: any, cfg: ShannonConfig): void {
  registerScanTool(api, cfg);
  registerStatusTool(api, cfg);
  registerReportTool(api, cfg);
  registerCancelTool(api, cfg);
  registerListTool(api, cfg);
}

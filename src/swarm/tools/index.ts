/**
 * Swarm tool registration — registers all 6 swarm intelligence tools.
 */
import type { SwarmConfig } from "../config.js";
import { registerSpawnTool } from "./spawn.js";
import { registerSwarmStatusTool } from "./status.js";
import { registerSwarmListTool } from "./list.js";
import { registerBroadcastTool } from "./broadcast.js";
import { registerResultTool } from "./result.js";
import { registerDissolveTool } from "./dissolve.js";

export function registerSwarmTools(api: any, cfg: SwarmConfig): void {
  registerSpawnTool(api, cfg);
  registerSwarmStatusTool(api, cfg);
  registerSwarmListTool(api, cfg);
  registerBroadcastTool(api, cfg);
  registerResultTool(api, cfg);
  registerDissolveTool(api, cfg);
}

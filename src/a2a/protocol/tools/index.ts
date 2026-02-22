/**
 * A2A Protocol tools — registration entry point.
 *
 * Registers 5 agent tools for inter-agent communication:
 * - a2a_discover_agents
 * - a2a_delegate_task
 * - a2a_task_status
 * - a2a_task_cancel
 * - a2a_subscribe
 */
import type { A2AProtocolConfig } from "../config.js";
import type { A2ACardCache } from "../client/card-cache.js";
import type { A2AAgentRegistry } from "../client/registry.js";
import { registerDiscoverTool } from "./discover.js";
import { registerDelegateTool } from "./delegate.js";
import { registerStatusTool } from "./status.js";
import { registerCancelTool } from "./cancel.js";
import { registerSubscribeTool } from "./subscribe.js";

export interface ToolRegistrar {
  registerTool(tool: any, opts?: any): void;
}

export function registerA2AProtocolTools(
  api: ToolRegistrar,
  config: A2AProtocolConfig,
  cardCache: A2ACardCache,
  registry: A2AAgentRegistry,
): void {
  registerDiscoverTool(api, cardCache, registry);
  registerDelegateTool(api, config, cardCache);
  registerStatusTool(api, config);
  registerCancelTool(api, config);
  registerSubscribeTool(api, config);
}

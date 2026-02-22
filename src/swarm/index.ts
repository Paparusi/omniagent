/**
 * Multi-Agent Swarm — Collective Intelligence for OmniAgent
 *
 * Spawn N specialized AI agents in parallel, each with a distinct role,
 * coordinating via message passing to solve complex tasks collectively.
 *
 * Tools registered (6):
 *   - swarm_spawn       Create and launch a swarm
 *   - swarm_status      Check swarm progress
 *   - swarm_list        List all swarms
 *   - swarm_broadcast   Message all agents
 *   - swarm_result      Get aggregated results
 *   - swarm_dissolve    Terminate a swarm
 *
 * CLI commands:
 *   /swarm status       Show swarm system status
 *   /swarm list         List active swarms
 *   /swarm roles        Show available agent roles
 */
import type { OmniAgentPluginApi } from "omniagent/plugin-sdk";
import { type SwarmConfig, loadSwarmConfig } from "./config.js";
import { registerSwarmTools } from "./tools/index.js";
import { registerSwarmCommands } from "./commands.js";

export function registerSwarm(
  api: OmniAgentPluginApi,
  cfg?: SwarmConfig,
): void {
  const resolvedCfg = cfg ?? loadSwarmConfig();

  if (!resolvedCfg.enabled) {
    api.logger.info("Swarm: disabled (SWARM_ENABLED=false)");
    return;
  }

  // ── Register tools ─────────────────────────────────────────────
  registerSwarmTools(api, resolvedCfg);
  api.logger.info("Swarm: 6 swarm intelligence tools registered");

  // ── CLI commands ───────────────────────────────────────────────
  registerSwarmCommands(api, resolvedCfg);

  // ── Lifecycle hooks ────────────────────────────────────────────

  api.on("before_prompt_build", async () => {
    return {
      prependContext:
        `<swarm-intelligence>\n` +
        `Multi-Agent Swarm system is available.\n` +
        `Use swarm_spawn to create a team of specialized AI agents that work in parallel.\n` +
        `Available roles: architect, coder, researcher, reviewer, security, tester, devops, analyst.\n` +
        `Consensus strategies: merge (combine all), vote, chain (pipeline), best (pick highest quality).\n` +
        `For complex tasks, spawn a swarm instead of working alone — collective intelligence beats solo.\n` +
        `</swarm-intelligence>`,
    };
  });

  api.on("after_tool_call", async (event: any) => {
    const toolName: string = event?.toolName || "";
    if (toolName.startsWith("swarm_")) {
      api.logger.debug(`Swarm tool called: ${toolName}`);
    }
  });

  // ── Service registration ───────────────────────────────────────
  api.registerService({
    id: "swarm",
    async start() {
      api.logger.info(
        `Swarm: service started (max ${resolvedCfg.maxAgentsPerSwarm} agents/swarm, ` +
        `${resolvedCfg.maxConcurrentSwarms} concurrent swarms)`,
      );
    },
    stop() {
      api.logger.info("Swarm: service stopped");
    },
  });
}

export { loadSwarmConfig } from "./config.js";
export type { SwarmConfig } from "./config.js";

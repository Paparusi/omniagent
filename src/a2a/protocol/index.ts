/**
 * A2A Protocol module — Google A2A v0.2 implementation for OmniAgent.
 *
 * Enables agent-to-agent interoperability:
 * - A2A Server: Exposes OmniAgent agents as A2A services
 * - A2A Client: Delegates tasks to remote A2A-compatible agents
 * - 5 agent tools for discovery, delegation, status, cancel, subscribe
 * - /a2a-protocol CLI command
 *
 * Integrates with the A2A Corp economic layer (AgentForge, PassBox, APay).
 */
import type { OmniAgentPluginApi } from "omniagent/plugin-sdk";
import type { A2AProtocolConfig } from "./config.js";
import { loadA2AProtocolConfig } from "./config.js";
import { A2ATaskManager } from "./server/task-manager.js";
import { registerA2AServerEndpoints } from "./server/endpoints.js";
import { A2ACardCache } from "./client/card-cache.js";
import { A2AAgentRegistry } from "./client/registry.js";
import { registerA2AProtocolTools } from "./tools/index.js";
import { registerA2AProtocolCommands } from "./commands.js";

// Re-export for consumers
export { loadA2AProtocolConfig } from "./config.js";
export type { A2AProtocolConfig } from "./config.js";
export { A2ATaskManager } from "./server/task-manager.js";
export { A2AClient } from "./client/client.js";
export { A2ACardCache } from "./client/card-cache.js";
export { A2AAgentRegistry } from "./client/registry.js";
export type * from "./types.js";

/**
 * Bootstrap the A2A Protocol module.
 *
 * @param api  OmniAgent plugin API handle
 * @param cfg  Optional config override — defaults to env vars
 */
export function registerA2AProtocol(
  api: OmniAgentPluginApi,
  cfg?: A2AProtocolConfig,
): void {
  const config = cfg ?? loadA2AProtocolConfig();

  if (!config.enabled) {
    api.logger.info("A2A Protocol: disabled (A2A_PROTOCOL_ENABLED!=true)");
    return;
  }

  // ── Core components ─────────────────────────────────────────

  const taskManager = new A2ATaskManager({
    maxTasks: config.server?.maxTasks ?? 100,
    expiryMs: (config.server?.taskExpiryMinutes ?? 60) * 60_000,
  });

  const cardCache = new A2ACardCache({
    ttlMs: (config.client?.cacheTtlMinutes ?? 5) * 60_000,
  });

  const registry = new A2AAgentRegistry(cardCache);

  // ── Server endpoints ────────────────────────────────────────

  if (config.server?.enabled !== false) {
    registerA2AServerEndpoints(api, taskManager, config);
    api.logger.info("A2A Protocol: server endpoints registered");
  }

  // ── Client tools ────────────────────────────────────────────

  if (config.client?.enabled !== false) {
    registerA2AProtocolTools(api, config, cardCache, registry);
    api.logger.info("A2A Protocol: client tools registered (5 tools)");
  }

  // ── Load known agents from config ───────────────────────────

  if (config.client?.agents?.length) {
    registry.loadFromConfig(config.client.agents);
  }

  // ── CLI commands ────────────────────────────────────────────

  registerA2AProtocolCommands(api, config, taskManager, registry, cardCache);

  // ── Lifecycle hooks ─────────────────────────────────────────

  // Inject known remote agents into agent prompts
  api.on("before_prompt_build", async () => {
    if (config.client?.enabled === false) return {};
    const cachedAgents = cardCache.listCached();
    if (cachedAgents.length === 0) return {};

    return {
      prependContext:
        `<a2a-remote-agents>\n` +
        `Known remote A2A agents:\n` +
        cachedAgents
          .map(
            (a) =>
              `- ${a.name} (${a.url}): ${a.description} [skills: ${a.skills.map((s) => s.name).join(", ")}]`,
          )
          .join("\n") +
        `\nUse a2a_delegate_task to send tasks to these agents.\n` +
        `</a2a-remote-agents>`,
    };
  });

  // ── Service lifecycle ───────────────────────────────────────

  api.registerService({
    id: "a2a-protocol",
    async start() {
      // Pre-fetch cards for known agents
      if (config.client?.agents?.length) {
        for (const agent of config.client.agents) {
          try {
            await cardCache.fetchCard(agent.url);
            api.logger.info(
              `A2A Protocol: cached card for ${agent.name ?? agent.url}`,
            );
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            api.logger.warn(
              `A2A Protocol: failed to fetch card from ${agent.url}: ${msg}`,
            );
          }
        }
      }

      const agentCount = registry.getKnownAgents().length;
      api.logger.info(
        `A2A Protocol: service started (server=${config.server?.enabled !== false}, ` +
          `client=${config.client?.enabled !== false}, agents=${agentCount})`,
      );
    },
    stop() {
      taskManager.shutdown();
      api.logger.info("A2A Protocol: service stopped");
    },
  });
}

export default registerA2AProtocol;

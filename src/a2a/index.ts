/**
 * A2A Corp economic layer — core module for OmniAgent.
 *
 * Provides 44 native tools across three platforms + security + swarm:
 * - AgentForge: AI tool marketplace (6 tools)
 * - PassBox: Zero-knowledge secrets vault (10 tools)
 * - APay: Blockchain USDC payments (13 tools)
 * - Composite: Cross-platform workflows (4 tools)
 * - Shannon: Autonomous AI security scanner (5 tools)
 * - Swarm: Multi-agent swarm intelligence (6 tools)
 *
 * This is the core-module entry point.  The extension at
 * extensions/a2a-corp/ is now a thin backward-compat wrapper that
 * re-exports from here.
 */
import type { OmniAgentPluginApi } from "omniagent/plugin-sdk";
import type { A2AConfig } from "./config.js";
import { loadA2AConfig } from "./config.js";
import { registerForgeTools } from "./tools/forge.js";
import { registerPassBoxTools } from "./tools/passbox.js";
import { registerApayTools } from "./tools/apay.js";
import { registerCompositeTools } from "./tools/composite.js";
import { registerA2ACommands } from "./commands.js";
import { checkPlatformStatus } from "./service.js";
import { registerA2AProtocol } from "./protocol/index.js";
import { registerShannon } from "../shannon/index.js";
import { registerSwarm } from "../swarm/index.js";

// Re-export for consumers
export { loadA2AConfig } from "./config.js";
export type { A2AConfig } from "./config.js";

/**
 * Register all A2A Corp tools, commands, lifecycle hooks, and services.
 *
 * @param api  OmniAgent plugin API handle
 * @param cfg  Optional config override — when omitted the config is loaded
 *             from environment variables via `loadA2AConfig()`.
 */
export function registerA2ATools(
  api: OmniAgentPluginApi,
  cfg?: A2AConfig,
): void {
  const resolvedCfg = cfg ?? loadA2AConfig();

  if (!resolvedCfg.enabled) {
    api.logger.info("A2A Corp: disabled (A2A_ENABLED=false)");
    return;
  }

  // ── Register tools per platform (feature-flagged) ──────────────
  if (resolvedCfg.agentforge?.apiKey) {
    registerForgeTools(api, resolvedCfg);
    api.logger.info("A2A: AgentForge tools registered (6 tools)");
  }

  if (resolvedCfg.passbox?.token) {
    registerPassBoxTools(api, resolvedCfg);
    api.logger.info("A2A: PassBox tools registered (10 tools)");
  }

  if (resolvedCfg.apay?.apiKey) {
    registerApayTools(api, resolvedCfg);
    api.logger.info("A2A: APay tools registered (13 tools)");
  }

  // Composite tools require at least 2 platforms
  const platformCount = [
    resolvedCfg.agentforge?.apiKey,
    resolvedCfg.passbox?.token,
    resolvedCfg.apay?.apiKey,
  ].filter(Boolean).length;

  if (platformCount >= 2) {
    registerCompositeTools(api, resolvedCfg);
    api.logger.info("A2A: Composite tools registered (4 tools)");
  }

  // ── CLI commands ───────────────────────────────────────────────
  registerA2ACommands(api, resolvedCfg);

  // ── Lifecycle hooks ────────────────────────────────────────────

  // Inject platform status into agent context
  api.on("before_prompt_build", async () => {
    const platforms: string[] = [];
    if (resolvedCfg.agentforge?.apiKey) platforms.push("AgentForge (marketplace)");
    if (resolvedCfg.passbox?.token) platforms.push("PassBox (vault)");
    if (resolvedCfg.apay?.apiKey) platforms.push("APay (payments)");

    if (platforms.length === 0) return {};

    return {
      prependContext:
        `<a2a-platforms>\n` +
        `Available A2A Corp platforms: ${platforms.join(", ")}\n` +
        `Use forge_* tools for marketplace, passbox_* for secrets, apay_* for payments.\n` +
        `Use a2a_full_pipeline for end-to-end workflows.\n` +
        `</a2a-platforms>`,
    };
  });

  // Log tool usage for analytics
  api.on("after_tool_call", async (event: any) => {
    const toolName: string = event?.toolName || "";
    if (
      toolName.startsWith("forge_") ||
      toolName.startsWith("passbox_") ||
      toolName.startsWith("apay_") ||
      toolName.startsWith("a2a_")
    ) {
      api.logger.debug(`A2A tool called: ${toolName}`);
    }
  });

  // ── A2A Protocol (Google A2A v0.2) ────────────────────────────
  registerA2AProtocol(api);

  // ── Shannon Security Scanner ─────────────────────────────────
  registerShannon(api);

  // ── Multi-Agent Swarm ──────────────────────────────────────────
  registerSwarm(api);

  // ── Service for health checks ──────────────────────────────────
  api.registerService({
    id: "a2a-corp",
    async start() {
      const status = await checkPlatformStatus(resolvedCfg);
      const connected = Object.values(status).filter((s) => s.connected).length;
      api.logger.info(`A2A Corp: ${connected}/3 platforms connected`);
    },
    stop() {
      api.logger.info("A2A Corp: service stopped");
    },
  });
}

export default registerA2ATools;

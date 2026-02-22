/**
 * CLI commands for A2A Corp — /a2a status, /a2a balance, etc.
 */
import type { OmniAgentPluginApi } from "omniagent/plugin-sdk";
import type { A2AConfig } from "./service.js";
import { checkPlatformStatus, getForgeClient, getApayClient } from "./service.js";

export function registerA2ACommands(api: OmniAgentPluginApi, cfg: A2AConfig) {
  // ── /a2a — main command ────────────────────────────────────────
  api.registerCommand({
    name: "a2a",
    description: "A2A Corp — check status, balance, and manage your AI agent economy.",
    acceptsArgs: true,
    async handler(ctx: any) {
      const args = (ctx.args || "").trim();
      const subcommand = args.split(/\s+/)[0] || "status";

      switch (subcommand) {
        case "status":
          return handleStatus(cfg);
        case "balance":
          return handleBalance(cfg);
        case "help":
        default:
          return {
            text:
              "**A2A Corp Commands**\n\n" +
              "- `/a2a status` — Check platform connectivity\n" +
              "- `/a2a balance` — Show balances across platforms\n" +
              "- `/a2a help` — Show this help\n\n" +
              "**Available tools:** `forge_*` (marketplace), `passbox_*` (vault), `apay_*` (payments), `a2a_*` (workflows)",
          };
      }
    },
  });
}

async function handleStatus(cfg: A2AConfig) {
  const status = await checkPlatformStatus(cfg);
  const lines: string[] = ["**A2A Corp Platform Status**\n"];

  for (const [name, s] of Object.entries(status)) {
    const icon = s.connected ? "+" : "-";
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    lines.push(`${icon} **${label}**: ${s.connected ? "Connected" : `Disconnected${s.error ? ` (${s.error})` : ""}`}`);
  }

  const connected = Object.values(status).filter((s) => s.connected).length;
  lines.push(`\n${connected}/3 platforms online`);

  return { text: lines.join("\n") };
}

async function handleBalance(cfg: A2AConfig) {
  const lines: string[] = ["**A2A Corp Balances**\n"];

  if (cfg.agentforge?.apiKey) {
    try {
      const forge = getForgeClient(cfg);
      const bal = await forge.getBalance();
      lines.push(`**AgentForge**: $${bal.balance || "0.00"} USD (tier: ${bal.tier || "free"})`);
    } catch (e: any) {
      lines.push(`**AgentForge**: Error — ${e.message}`);
    }
  } else {
    lines.push("**AgentForge**: Not configured");
  }

  if (cfg.apay?.apiKey) {
    try {
      const apay = getApayClient(cfg);
      const bal = await apay.fetch("/api/v1/balance");
      lines.push(`**APay**: ${bal.balance || "0.00"} USDC (${bal.network || "base"})`);
    } catch (e: any) {
      lines.push(`**APay**: Error — ${e.message}`);
    }
  } else {
    lines.push("**APay**: Not configured");
  }

  if (cfg.passbox?.token) {
    lines.push("**PassBox**: Connected (vault access active)");
  } else {
    lines.push("**PassBox**: Not configured");
  }

  return { text: lines.join("\n") };
}

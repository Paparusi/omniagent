/**
 * /a2a-protocol CLI command — manage A2A protocol connectivity.
 */
import type { A2AProtocolConfig } from "./config.js";
import type { A2ATaskManager } from "./server/task-manager.js";
import type { A2AAgentRegistry } from "./client/registry.js";
import type { A2ACardCache } from "./client/card-cache.js";
import { generateAgentCard } from "./server/agent-card.js";
import { isTerminalState } from "./task-state.js";

interface CommandRegistrar {
  registerCommand(def: {
    name: string;
    description: string;
    acceptsArgs?: boolean;
    handler: (ctx: any) => Promise<{ text: string }>;
  }): void;
}

export function registerA2AProtocolCommands(
  api: CommandRegistrar,
  config: A2AProtocolConfig,
  taskManager: A2ATaskManager,
  registry: A2AAgentRegistry,
  cardCache: A2ACardCache,
): void {
  api.registerCommand({
    name: "a2a-protocol",
    description:
      "A2A Protocol — manage agent-to-agent connectivity. Subcommands: status, agents, tasks, card, discover <url>",
    acceptsArgs: true,
    async handler(ctx: any) {
      const args = (ctx.args || ctx.commandBody || "").trim();
      const parts = args.split(/\s+/);
      const sub = parts[0] || "status";

      switch (sub) {
        case "status":
          return formatStatus(config, taskManager, registry);

        case "agents":
          return formatAgents(registry, cardCache);

        case "tasks":
          return formatTasks(taskManager);

        case "card":
          return formatCard(config, api as any);

        case "discover": {
          const url = parts[1];
          if (!url) {
            return { text: "Usage: /a2a-protocol discover <url>" };
          }
          return await discoverAgent(url, cardCache);
        }

        case "help":
        default:
          return {
            text:
              "A2A Protocol Commands:\n" +
              "  /a2a-protocol status    — Show protocol status\n" +
              "  /a2a-protocol agents    — List known remote agents\n" +
              "  /a2a-protocol tasks     — List active tasks\n" +
              "  /a2a-protocol card      — Show this agent's A2A card\n" +
              "  /a2a-protocol discover <url> — Fetch remote agent card",
          };
      }
    },
  });
}

function formatStatus(
  config: A2AProtocolConfig,
  taskManager: A2ATaskManager,
  registry: A2AAgentRegistry,
): { text: string } {
  const lines: string[] = [
    "A2A Protocol Status",
    "═══════════════════════════════════",
    `  Enabled:         ${config.enabled ? "yes" : "no"}`,
    `  Base URL:        ${config.baseUrl ?? "(not set)"}`,
    `  Server:          ${config.server?.enabled !== false ? "active" : "disabled"}`,
    `  Client:          ${config.client?.enabled !== false ? "active" : "disabled"}`,
    `  Auth mode:       ${config.auth?.mode ?? "gateway"}`,
    `  Active tasks:    ${taskManager.size}`,
    `  Known agents:    ${registry.getKnownAgents().length}`,
    `  Streaming:       ${config.server?.streaming !== false ? "yes" : "no"}`,
  ];
  return { text: lines.join("\n") };
}

function formatAgents(
  registry: A2AAgentRegistry,
  cardCache: A2ACardCache,
): { text: string } {
  const agents = registry.getKnownAgents();
  if (agents.length === 0) {
    return { text: "No known remote agents. Use /a2a-protocol discover <url> to add one." };
  }

  const lines = ["Known A2A Agents", "═══════════════════════════════════"];
  for (const agent of agents) {
    const card = cardCache.getCached(agent.url);
    lines.push(`  ${card?.name ?? agent.name ?? "Unknown"}`);
    lines.push(`    URL:    ${agent.url}`);
    if (card) {
      lines.push(`    Skills: ${card.skills.map((s) => s.name).join(", ")}`);
      lines.push(`    Stream: ${card.capabilities.streaming ? "yes" : "no"}`);
    }
    lines.push("");
  }
  return { text: lines.join("\n") };
}

function formatTasks(taskManager: A2ATaskManager): { text: string } {
  const tasks = taskManager.listTasks();
  if (tasks.length === 0) {
    return { text: "No active A2A tasks." };
  }

  const lines = [
    "A2A Tasks",
    "═══════════════════════════════════",
  ];
  for (const task of tasks) {
    const terminal = isTerminalState(task.status.state) ? " (done)" : "";
    lines.push(
      `  ${task.id.slice(0, 8)}…  ${task.status.state}${terminal}  ${task.status.timestamp ?? ""}`,
    );
  }
  lines.push(`\nTotal: ${tasks.length}`);
  return { text: lines.join("\n") };
}

function formatCard(
  config: A2AProtocolConfig,
  api: any,
): { text: string } {
  const card = generateAgentCard({
    agentId: config.server?.exposeAgents?.[0] ?? "default",
    agentName: api.config?.ui?.assistant?.name ?? "OmniAgent",
    baseUrl: config.baseUrl ?? "http://localhost:18789",
    capabilities: {
      streaming: config.server?.streaming !== false,
      pushNotifications: config.server?.pushNotifications ?? false,
      stateTransitionHistory: true,
    },
  });
  return { text: JSON.stringify(card, null, 2) };
}

async function discoverAgent(
  url: string,
  cardCache: A2ACardCache,
): Promise<{ text: string }> {
  try {
    const card = await cardCache.fetchCard(url, { forceRefresh: true });
    return {
      text:
        `Discovered: ${card.name}\n` +
        `  URL:         ${card.url}\n` +
        `  Version:     ${card.version}\n` +
        `  Skills:      ${card.skills.map((s) => s.name).join(", ")}\n` +
        `  Streaming:   ${card.capabilities.streaming ? "yes" : "no"}\n` +
        `  Description: ${card.description}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { text: `Failed to discover agent at ${url}: ${msg}` };
  }
}

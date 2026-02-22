/**
 * Swarm CLI commands — /swarm
 *
 * Subcommands:
 *   /swarm status   Show swarm system status
 *   /swarm list     List active swarms
 *   /swarm roles    Show available agent roles
 */
import type { OmniAgentPluginApi } from "omniagent/plugin-sdk";
import type { SwarmConfig } from "./config.js";
import { getOrchestrator } from "./orchestrator.js";
import { SWARM_ROLES } from "./roles.js";

export function registerSwarmCommands(
  api: OmniAgentPluginApi,
  cfg: SwarmConfig,
): void {
  api.registerCommand({
    name: "swarm",
    description: "Multi-Agent Swarm intelligence system",
    async handler(args: string) {
      const sub = args.trim().split(/\s+/)[0] ?? "status";

      switch (sub) {
        case "status":
          return formatStatus(cfg);
        case "list":
          return formatList(cfg);
        case "roles":
          return formatRoles();
        default:
          return [
            `Unknown subcommand: ${sub}`,
            ``,
            `Available commands:`,
            `  /swarm status   Show system status`,
            `  /swarm list     List active swarms`,
            `  /swarm roles    Show available agent roles`,
          ].join("\n");
      }
    },
  });
}

function formatStatus(cfg: SwarmConfig): string {
  const orchestrator = getOrchestrator(cfg);
  const swarms = orchestrator.listSwarms();
  const active = swarms.filter(
    (s) => s.status === "executing" || s.status === "planning",
  ).length;
  const completed = swarms.filter((s) => s.status === "completed").length;
  const failed = swarms.filter((s) => s.status === "failed").length;
  const totalAgents = swarms.reduce((sum, s) => sum + s.agents.length, 0);

  return [
    `Multi-Agent Swarm System`,
    `════════════════════════`,
    ``,
    `  Status:         enabled`,
    `  Max Agents:     ${cfg.maxAgentsPerSwarm} per swarm`,
    `  Max Swarms:     ${cfg.maxConcurrentSwarms} concurrent`,
    `  Agent Timeout:  ${Math.round(cfg.agentTimeoutMs / 1000)}s`,
    `  Consensus:      ${cfg.defaultConsensus}`,
    ``,
    `  Swarms:`,
    `    Active:       ${active}`,
    `    Completed:    ${completed}`,
    `    Failed:       ${failed}`,
    `    Total:        ${swarms.length}`,
    `    Total Agents: ${totalAgents}`,
  ].join("\n");
}

function formatList(cfg: SwarmConfig): string {
  const orchestrator = getOrchestrator(cfg);
  const swarms = orchestrator.listSwarms();

  if (swarms.length === 0) {
    return "No swarms found. Use swarm_spawn tool to create one.";
  }

  const lines = [`Active Swarms`, `═════════════`, ``];

  for (const swarm of swarms) {
    const elapsed = swarm.durationMs
      ? `${Math.round(swarm.durationMs / 1000)}s`
      : "—";
    const statusIcon =
      swarm.status === "executing"
        ? "▶"
        : swarm.status === "completed"
          ? "✓"
          : swarm.status === "failed"
            ? "✗"
            : "■";

    lines.push(
      `  ${statusIcon} ${swarm.id}`,
      `    Task:    ${swarm.task.slice(0, 60)}`,
      `    Status:  ${swarm.status}  |  Agents: ${swarm.agents.length}  |  ${elapsed}`,
      `    Roles:   ${swarm.agents.map((a) => a.role).join(", ")}`,
      ``,
    );
  }

  return lines.join("\n");
}

function formatRoles(): string {
  const lines = [
    `Available Swarm Roles`,
    `═════════════════════`,
    ``,
  ];

  const roles = Object.values(SWARM_ROLES).sort(
    (a, b) => a.priority - b.priority,
  );

  for (const role of roles) {
    lines.push(
      `  ${role.emoji} ${role.name} (${role.id})`,
      `    ${role.description}`,
      `    Tools: ${role.toolAccess.length > 0 ? role.toolAccess.join(", ") : "general"}`,
      `    Priority: ${role.priority}`,
      ``,
    );
  }

  lines.push(
    `Roles are auto-assigned based on task description, or specify manually`,
    `with the "roles" parameter in swarm_spawn.`,
  );

  return lines.join("\n");
}

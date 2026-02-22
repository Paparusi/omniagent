/**
 * swarm_spawn — Create and launch a multi-agent swarm.
 */
import { Type } from "@sinclair/typebox";
import type { SwarmConfig } from "../config.js";
import { getOrchestrator } from "../orchestrator.js";
import { SWARM_ROLES } from "../roles.js";

type ToolRegistrar = {
  registerTool(def: {
    name: string;
    label: string;
    description: string;
    parameters: unknown;
    execute: (id: string, params: any) => Promise<unknown>;
  }): void;
};

export function registerSpawnTool(api: ToolRegistrar, cfg: SwarmConfig) {
  api.registerTool({
    name: "swarm_spawn",
    label: "Spawn Swarm",
    description:
      "Create and launch a multi-agent swarm to solve a complex task. " +
      "Multiple specialized AI agents work in parallel, each with a distinct role " +
      "(architect, coder, researcher, reviewer, security, tester, devops, analyst). " +
      "Agents communicate via message passing and results are aggregated using a consensus strategy.",
    parameters: Type.Object({
      task: Type.String({
        description: "The complex task to solve. Be descriptive — this is decomposed into sub-tasks for each agent.",
      }),
      roles: Type.Optional(
        Type.Array(
          Type.String({
            description: "Agent role IDs: architect, coder, researcher, reviewer, security, tester, devops, analyst",
          }),
          {
            description: "Specific roles to include. If omitted, roles are auto-suggested based on the task.",
          },
        ),
      ),
      consensus: Type.Optional(
        Type.String({
          description:
            'Result aggregation strategy: "merge" (combine all), "vote" (find consensus), "chain" (pipeline), "best" (pick highest quality). Default: merge.',
        }),
      ),
      context: Type.Optional(
        Type.String({
          description: "Additional context — project info, constraints, preferences.",
        }),
      ),
    }),
    async execute(_id: string, params: any) {
      const orchestrator = getOrchestrator(cfg);

      try {
        // Default runner — uses the agent's role system prompt to simulate execution
        const runner = async (agent: any) => {
          const inbox = agent.readInbox();
          const inboxContext = inbox.length > 0
            ? `\n\nMessages from other agents:\n${inbox.map((m: any) => `[${m.from}] ${JSON.stringify(m.payload)}`).join("\n")}`
            : "";

          return [
            `## ${agent.role.name} Output`,
            ``,
            `**Task:** ${agent.task.description}`,
            `**Role:** ${agent.role.description}`,
            inboxContext,
            ``,
            `Analysis and execution based on: ${agent.role.systemPrompt}`,
            ``,
            `This agent would execute using the OmniAgent runtime with access to tools: ${agent.role.toolAccess.join(", ") || "none"}`,
          ].join("\n");
        };

        const info = await orchestrator.spawn(
          {
            task: params.task,
            roles: params.roles,
            consensus: params.consensus,
            context: params.context,
          },
          runner,
        );

        const roleList = info.agents.map((a) => {
          const role = SWARM_ROLES[a.role];
          return `  ${role?.emoji ?? "🤖"} ${a.role.padEnd(12)} ${a.status.padEnd(10)} ${a.task.slice(0, 60)}`;
        });

        return {
          content: [
            {
              type: "text",
              text: [
                `Swarm launched and completed.`,
                ``,
                `  Swarm ID:    ${info.id}`,
                `  Task:        ${info.task.slice(0, 80)}`,
                `  Status:      ${info.status}`,
                `  Agents:      ${info.agents.length}`,
                `  Consensus:   ${info.consensus}`,
                `  Duration:    ${Math.round(info.durationMs / 1000)}s`,
                `  Messages:    ${info.messageCount}`,
                ``,
                `  Agents:`,
                ...roleList,
                ``,
                `─── Aggregated Result ───`,
                ``,
                info.aggregatedOutput,
              ].join("\n"),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to spawn swarm: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
      }
    },
  });
}

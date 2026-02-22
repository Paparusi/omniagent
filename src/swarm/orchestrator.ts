/**
 * SwarmOrchestrator — manages the lifecycle of multi-agent swarms.
 *
 * Responsibilities:
 *   - Create swarms with specified roles
 *   - Decompose tasks and assign to agents
 *   - Execute agents in parallel with dependency ordering
 *   - Aggregate results using consensus strategies
 *   - Monitor progress and handle failures
 */
import type { SwarmConfig, ConsensusStrategy } from "./config.js";
import { SwarmAgent, type AgentResult, type AgentTask } from "./agent.js";
import { SwarmMessageBus } from "./message-bus.js";
import { type SwarmRole, resolveRoles, suggestRoles } from "./roles.js";
import { decomposeTask, aggregateResults } from "./planner.js";

export type SwarmStatus =
  | "initializing"
  | "planning"
  | "executing"
  | "aggregating"
  | "completed"
  | "failed"
  | "cancelled";

export interface SwarmInfo {
  id: string;
  task: string;
  status: SwarmStatus;
  consensus: ConsensusStrategy;
  agents: {
    id: string;
    role: string;
    status: string;
    task: string;
  }[];
  results: AgentResult[];
  aggregatedOutput: string;
  createdAt: number;
  completedAt: number;
  durationMs: number;
  messageCount: number;
}

export interface SwarmOptions {
  task: string;
  roles?: string[];
  consensus?: ConsensusStrategy;
  context?: string;
  autoDecompose?: boolean;
}

interface Swarm {
  id: string;
  task: string;
  status: SwarmStatus;
  consensus: ConsensusStrategy;
  agents: SwarmAgent[];
  bus: SwarmMessageBus;
  results: AgentResult[];
  aggregatedOutput: string;
  createdAt: number;
  completedAt: number;
  context?: string;
}

export class SwarmOrchestrator {
  private swarms = new Map<string, Swarm>();
  private swarmCounter = 0;

  constructor(private config: SwarmConfig) {}

  /** Create and launch a new swarm */
  async spawn(
    options: SwarmOptions,
    runner: (agent: SwarmAgent) => Promise<string>,
  ): Promise<SwarmInfo> {
    // Check limits
    const activeCount = [...this.swarms.values()].filter(
      (s) => s.status === "executing" || s.status === "planning",
    ).length;
    if (activeCount >= this.config.maxConcurrentSwarms) {
      throw new Error(
        `Max concurrent swarms reached (${this.config.maxConcurrentSwarms}). ` +
        `Dissolve existing swarms first.`,
      );
    }

    const swarmId = `swarm-${++this.swarmCounter}-${Date.now()}`;
    const bus = new SwarmMessageBus();

    // Resolve roles
    const roles: SwarmRole[] = options.roles
      ? resolveRoles(options.roles)
      : suggestRoles(options.task);

    if (roles.length > this.config.maxAgentsPerSwarm) {
      throw new Error(
        `Too many agents (${roles.length}). Max: ${this.config.maxAgentsPerSwarm}`,
      );
    }

    // Create swarm
    const swarm: Swarm = {
      id: swarmId,
      task: options.task,
      status: "initializing",
      consensus: options.consensus ?? this.config.defaultConsensus,
      agents: [],
      bus,
      results: [],
      aggregatedOutput: "",
      createdAt: Date.now(),
      completedAt: 0,
      context: options.context,
    };

    this.swarms.set(swarmId, swarm);

    // Create agents
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const agent = new SwarmAgent(
        `${swarmId}-${role.id}-${i}`,
        swarmId,
        role,
        bus,
      );
      swarm.agents.push(agent);
    }

    // Plan phase — decompose task into sub-tasks
    swarm.status = "planning";
    const subTasks = decomposeTask(
      options.task,
      roles,
      options.context,
      options.autoDecompose !== false,
    );

    // Assign tasks to agents
    for (let i = 0; i < swarm.agents.length; i++) {
      const agent = swarm.agents[i];
      const task = subTasks[i] ?? {
        description: `Assist with: ${options.task}`,
        priority: agent.role.priority,
      };
      agent.assignTask(task);
    }

    // Execute phase — run agents in parallel with timeout
    swarm.status = "executing";

    // Broadcast task start
    await bus.broadcast(swarmId, "orchestrator", "swarm:start", {
      task: options.task,
      agentCount: swarm.agents.length,
      roles: roles.map((r) => r.id),
    });

    // Group agents by priority for ordered parallel execution
    const priorityGroups = new Map<number, SwarmAgent[]>();
    for (const agent of swarm.agents) {
      const priority = agent.task?.priority ?? agent.role.priority;
      if (!priorityGroups.has(priority)) {
        priorityGroups.set(priority, []);
      }
      priorityGroups.get(priority)!.push(agent);
    }

    const sortedPriorities = [...priorityGroups.keys()].sort((a, b) => a - b);

    try {
      for (const priority of sortedPriorities) {
        const group = priorityGroups.get(priority)!;

        // Run group in parallel with timeout
        const results = await Promise.allSettled(
          group.map((agent) =>
            Promise.race([
              agent.execute(runner),
              new Promise<AgentResult>((_, reject) =>
                setTimeout(
                  () => reject(new Error("Agent timeout")),
                  this.config.agentTimeoutMs,
                ),
              ),
            ]),
          ),
        );

        // Collect results
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.status === "fulfilled") {
            swarm.results.push(result.value);
          } else {
            const agent = group[i];
            swarm.results.push({
              agentId: agent.id,
              role: agent.role.id,
              task: agent.task?.description ?? "",
              status: "failed",
              output: result.reason?.message ?? "Unknown error",
              artifacts: [],
              startedAt: agent.startedAt,
              completedAt: Date.now(),
              durationMs: Date.now() - agent.startedAt,
              messagesReceived: agent.messagesReceived,
              messagesSent: agent.messagesSent,
            });
          }
        }

        // Share results with next group via bus
        for (const result of swarm.results) {
          if (result.status === "done") {
            await bus.broadcast(swarmId, "orchestrator", "result:available", {
              agentId: result.agentId,
              role: result.role,
              summary: result.output.slice(0, 300),
            });
          }
        }
      }

      // Aggregate phase
      swarm.status = "aggregating";
      swarm.aggregatedOutput = aggregateResults(
        swarm.results,
        swarm.consensus,
        swarm.task,
      );

      swarm.status = "completed";
    } catch (err) {
      swarm.status = "failed";
      swarm.aggregatedOutput =
        `Swarm execution failed: ${err instanceof Error ? err.message : String(err)}`;
    }

    swarm.completedAt = Date.now();
    return this.getSwarmInfo(swarmId)!;
  }

  /** Get swarm info */
  getSwarmInfo(swarmId: string): SwarmInfo | null {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) return null;

    return {
      id: swarm.id,
      task: swarm.task,
      status: swarm.status,
      consensus: swarm.consensus,
      agents: swarm.agents.map((a) => ({
        id: a.id,
        role: a.role.id,
        status: a.status,
        task: a.task?.description ?? "",
      })),
      results: swarm.results,
      aggregatedOutput: swarm.aggregatedOutput,
      createdAt: swarm.createdAt,
      completedAt: swarm.completedAt,
      durationMs: swarm.completedAt
        ? swarm.completedAt - swarm.createdAt
        : Date.now() - swarm.createdAt,
      messageCount: swarm.bus.getHistory(swarmId).length,
    };
  }

  /** List all swarms */
  listSwarms(): SwarmInfo[] {
    return [...this.swarms.values()]
      .map((s) => this.getSwarmInfo(s.id)!)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /** Dissolve (terminate) a swarm */
  dissolve(swarmId: string): SwarmInfo | null {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) return null;

    // Cancel all running agents
    for (const agent of swarm.agents) {
      agent.destroy();
    }

    swarm.status = "cancelled";
    swarm.completedAt = Date.now();
    swarm.bus.clearSwarm(swarmId);

    return this.getSwarmInfo(swarmId);
  }

  /** Send a message to a specific agent in a swarm */
  async sendMessage(
    swarmId: string,
    targetAgentId: string,
    topic: string,
    payload: unknown,
  ): Promise<void> {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) throw new Error(`Swarm ${swarmId} not found`);

    await swarm.bus.send(swarmId, "user", targetAgentId, topic, payload);
  }

  /** Broadcast a message to all agents in a swarm */
  async broadcastToSwarm(
    swarmId: string,
    topic: string,
    payload: unknown,
  ): Promise<void> {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) throw new Error(`Swarm ${swarmId} not found`);

    await swarm.bus.broadcast(swarmId, "user", topic, payload);
  }

  /** Get message history for a swarm */
  getMessages(swarmId: string, limit = 50): unknown[] {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) return [];
    return swarm.bus.getHistory(swarmId, limit);
  }
}

// ── Singleton ────────────────────────────────────────────────

let _orchestrator: SwarmOrchestrator | null = null;

export function getOrchestrator(config: SwarmConfig): SwarmOrchestrator {
  if (!_orchestrator) {
    _orchestrator = new SwarmOrchestrator(config);
  }
  return _orchestrator;
}

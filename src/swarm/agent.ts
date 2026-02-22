/**
 * SwarmAgent — an individual agent within a swarm.
 *
 * Each agent has:
 *   - A role (specialization)
 *   - An assigned task (sub-task from the planner)
 *   - Message inbox/outbox via the message bus
 *   - Status tracking (idle, working, done, failed)
 */
import type { SwarmRole } from "./roles.js";
import type { SwarmMessageBus, SwarmMessage } from "./message-bus.js";

export type AgentStatus = "idle" | "working" | "done" | "failed" | "cancelled";

export interface AgentTask {
  description: string;
  context?: string;
  dependsOn?: string[];
  priority: number;
}

export interface AgentResult {
  agentId: string;
  role: string;
  task: string;
  status: AgentStatus;
  output: string;
  artifacts: string[];
  startedAt: number;
  completedAt: number;
  durationMs: number;
  messagesReceived: number;
  messagesSent: number;
}

export class SwarmAgent {
  readonly id: string;
  readonly swarmId: string;
  readonly role: SwarmRole;
  status: AgentStatus = "idle";
  task: AgentTask | null = null;
  output = "";
  artifacts: string[] = [];
  inbox: SwarmMessage[] = [];
  startedAt = 0;
  completedAt = 0;
  messagesReceived = 0;
  messagesSent = 0;

  private unsubscribe: (() => void) | null = null;

  constructor(
    id: string,
    swarmId: string,
    role: SwarmRole,
    private bus: SwarmMessageBus,
  ) {
    this.id = id;
    this.swarmId = swarmId;
    this.role = role;

    // Subscribe to direct messages
    this.unsubscribe = bus.subscribe(id, (msg) => {
      this.inbox.push(msg);
      this.messagesReceived++;
    });
  }

  /** Assign a task to this agent */
  assignTask(task: AgentTask): void {
    this.task = task;
    this.status = "idle";
  }

  /** Execute the assigned task */
  async execute(
    runner: (agent: SwarmAgent) => Promise<string>,
  ): Promise<AgentResult> {
    if (!this.task) {
      throw new Error(`Agent ${this.id} has no assigned task`);
    }

    this.status = "working";
    this.startedAt = Date.now();

    try {
      this.output = await runner(this);
      this.status = "done";
      this.completedAt = Date.now();

      // Broadcast completion
      await this.bus.broadcast(this.swarmId, this.id, "agent:done", {
        agentId: this.id,
        role: this.role.id,
        output: this.output.slice(0, 500),
      });
    } catch (err) {
      this.status = "failed";
      this.completedAt = Date.now();
      this.output =
        `Error: ${err instanceof Error ? err.message : String(err)}`;

      await this.bus.broadcast(this.swarmId, this.id, "agent:failed", {
        agentId: this.id,
        role: this.role.id,
        error: this.output,
      });
    }

    return this.getResult();
  }

  /** Send a message to another agent */
  async sendMessage(
    to: string,
    topic: string,
    payload: unknown,
  ): Promise<void> {
    await this.bus.send(this.swarmId, this.id, to, topic, payload);
    this.messagesSent++;
  }

  /** Broadcast a message to all agents in the swarm */
  async broadcastMessage(topic: string, payload: unknown): Promise<void> {
    await this.bus.broadcast(this.swarmId, this.id, topic, payload);
    this.messagesSent++;
  }

  /** Get the latest unread messages */
  readInbox(limit = 10): SwarmMessage[] {
    return this.inbox.slice(-limit);
  }

  /** Get result summary */
  getResult(): AgentResult {
    return {
      agentId: this.id,
      role: this.role.id,
      task: this.task?.description ?? "",
      status: this.status,
      output: this.output,
      artifacts: this.artifacts,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      durationMs: this.completedAt
        ? this.completedAt - this.startedAt
        : Date.now() - this.startedAt,
      messagesReceived: this.messagesReceived,
      messagesSent: this.messagesSent,
    };
  }

  /** Cleanup */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.status = "cancelled";
  }
}

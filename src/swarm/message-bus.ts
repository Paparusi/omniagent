/**
 * Swarm message bus — inter-agent communication.
 *
 * Supports:
 *   - Direct messaging (agent -> agent)
 *   - Broadcast (agent -> all agents in swarm)
 *   - Topic-based pub/sub (publish to channel, subscribers receive)
 *   - Message history for replay and debugging
 */

export interface SwarmMessage {
  id: string;
  swarmId: string;
  from: string;
  to: string | "*";
  topic: string;
  payload: unknown;
  timestamp: number;
  replyTo?: string;
}

export type MessageHandler = (message: SwarmMessage) => void | Promise<void>;

export class SwarmMessageBus {
  private handlers = new Map<string, Set<MessageHandler>>();
  private topicHandlers = new Map<string, Set<MessageHandler>>();
  private history: SwarmMessage[] = [];
  private messageCounter = 0;
  private maxHistory: number;

  constructor(maxHistory = 1000) {
    this.maxHistory = maxHistory;
  }

  /** Generate a unique message ID */
  private nextId(): string {
    return `msg-${++this.messageCounter}-${Date.now()}`;
  }

  /** Subscribe an agent to receive direct messages */
  subscribe(agentId: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(agentId)) {
      this.handlers.set(agentId, new Set());
    }
    this.handlers.get(agentId)!.add(handler);

    return () => {
      this.handlers.get(agentId)?.delete(handler);
    };
  }

  /** Subscribe to a topic */
  subscribeTopic(topic: string, handler: MessageHandler): () => void {
    if (!this.topicHandlers.has(topic)) {
      this.topicHandlers.set(topic, new Set());
    }
    this.topicHandlers.get(topic)!.add(handler);

    return () => {
      this.topicHandlers.get(topic)?.delete(handler);
    };
  }

  /** Send a direct message to a specific agent */
  async send(
    swarmId: string,
    from: string,
    to: string,
    topic: string,
    payload: unknown,
    replyTo?: string,
  ): Promise<SwarmMessage> {
    const message: SwarmMessage = {
      id: this.nextId(),
      swarmId,
      from,
      to,
      topic,
      payload,
      timestamp: Date.now(),
      replyTo,
    };

    this.recordHistory(message);

    // Deliver to target agent
    const handlers = this.handlers.get(to);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(message);
        } catch {
          /* agent handler errors are isolated */
        }
      }
    }

    // Also deliver to topic subscribers
    const topicHandlers = this.topicHandlers.get(topic);
    if (topicHandlers) {
      for (const handler of topicHandlers) {
        try {
          await handler(message);
        } catch {
          /* isolated */
        }
      }
    }

    return message;
  }

  /** Broadcast a message to all agents in the swarm */
  async broadcast(
    swarmId: string,
    from: string,
    topic: string,
    payload: unknown,
  ): Promise<SwarmMessage> {
    const message: SwarmMessage = {
      id: this.nextId(),
      swarmId,
      from,
      to: "*",
      topic,
      payload,
      timestamp: Date.now(),
    };

    this.recordHistory(message);

    // Deliver to all subscribed agents
    for (const [agentId, handlers] of this.handlers) {
      if (agentId === from) continue; // Don't send to self
      for (const handler of handlers) {
        try {
          await handler(message);
        } catch {
          /* isolated */
        }
      }
    }

    // Topic subscribers
    const topicHandlers = this.topicHandlers.get(topic);
    if (topicHandlers) {
      for (const handler of topicHandlers) {
        try {
          await handler(message);
        } catch {
          /* isolated */
        }
      }
    }

    return message;
  }

  /** Get message history for a swarm */
  getHistory(swarmId: string, limit = 50): SwarmMessage[] {
    return this.history
      .filter((m) => m.swarmId === swarmId)
      .slice(-limit);
  }

  /** Get messages for a specific agent */
  getAgentMessages(agentId: string, limit = 50): SwarmMessage[] {
    return this.history
      .filter((m) => m.to === agentId || m.from === agentId || m.to === "*")
      .slice(-limit);
  }

  /** Clear all handlers and history for a swarm */
  clearSwarm(swarmId: string): void {
    this.history = this.history.filter((m) => m.swarmId !== swarmId);
  }

  /** Reset everything */
  reset(): void {
    this.handlers.clear();
    this.topicHandlers.clear();
    this.history = [];
    this.messageCounter = 0;
  }

  private recordHistory(message: SwarmMessage): void {
    this.history.push(message);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-Math.floor(this.maxHistory * 0.8));
    }
  }
}

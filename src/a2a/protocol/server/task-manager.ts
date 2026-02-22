/**
 * A2A Task Manager — in-memory task store with state machine enforcement,
 * subscriber notifications, and automatic expiry pruning.
 *
 * Each task flows through the A2A state machine:
 *   submitted -> working -> completed | failed | canceled | input-required
 *
 * Subscribers receive real-time `A2AStreamEvent` notifications and are
 * automatically cleaned up when a task reaches a terminal state.
 */
import { randomUUID } from "node:crypto";
import type {
  A2ATask,
  A2ATaskStatus,
  A2ATaskState,
  A2AMessage,
  A2AArtifact,
  A2AStreamEvent,
} from "../types.js";
import { isTerminalState, assertTransition } from "../task-state.js";
import { A2AProtocolError, A2A_ERROR } from "../jsonrpc.js";

// ── Options ─────────────────────────────────────────────────────

export interface TaskManagerOptions {
  /** Maximum number of tasks stored concurrently (default: 100). */
  maxTasks?: number;
  /** Time in ms after which terminal-state tasks are pruned (default: 1 hour). */
  expiryMs?: number;
}

// ── Types ───────────────────────────────────────────────────────

type TaskSubscriber = (event: A2AStreamEvent) => void;

// ── Task Manager ────────────────────────────────────────────────

export class A2ATaskManager {
  private tasks = new Map<string, A2ATask>();
  private subscribers = new Map<string, Set<TaskSubscriber>>();
  private maxTasks: number;
  private expiryMs: number;
  private pruneTimer?: ReturnType<typeof setInterval>;

  constructor(opts: TaskManagerOptions = {}) {
    this.maxTasks = opts.maxTasks ?? 100;
    this.expiryMs = opts.expiryMs ?? 60 * 60_000; // 1 hour
    // Prune expired tasks every 5 minutes
    this.pruneTimer = setInterval(() => this.pruneExpiredTasks(), 5 * 60_000);
  }

  // ── Create ──────────────────────────────────────────────────

  /**
   * Create a new task in the "submitted" state.
   *
   * @throws A2AProtocolError if the task limit has been reached.
   */
  createTask(params: {
    message: A2AMessage;
    sessionId?: string;
    metadata?: Record<string, unknown>;
  }): A2ATask {
    if (this.tasks.size >= this.maxTasks) {
      throw new A2AProtocolError(
        A2A_ERROR.INTERNAL_ERROR,
        `Task limit reached (${this.maxTasks})`,
      );
    }

    const task: A2ATask = {
      id: randomUUID(),
      sessionId: params.sessionId ?? randomUUID(),
      status: {
        state: "submitted",
        timestamp: new Date().toISOString(),
      },
      history: [params.message],
      artifacts: [],
      metadata: params.metadata,
    };

    this.tasks.set(task.id, task);
    return task;
  }

  // ── Read ────────────────────────────────────────────────────

  getTask(taskId: string): A2ATask | undefined {
    return this.tasks.get(taskId);
  }

  getTaskOrThrow(taskId: string): A2ATask {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new A2AProtocolError(
        A2A_ERROR.TASK_NOT_FOUND,
        `Task not found: ${taskId}`,
      );
    }
    return task;
  }

  // ── Update ──────────────────────────────────────────────────

  /**
   * Transition a task to a new state, optionally appending a message
   * to the task history.
   *
   * @throws Error if the transition is invalid per the state machine.
   */
  updateStatus(
    taskId: string,
    state: A2ATaskState,
    message?: A2AMessage,
  ): void {
    const task = this.getTaskOrThrow(taskId);
    assertTransition(task.status.state, state);

    task.status = {
      state,
      message,
      timestamp: new Date().toISOString(),
    };

    if (message) {
      task.history = task.history ?? [];
      task.history.push(message);
    }

    const final = isTerminalState(state);
    this.notifySubscribers(taskId, {
      type: "task-status-update",
      taskId,
      status: task.status,
      final,
    });

    if (final) {
      this.subscribers.delete(taskId);
    }
  }

  /**
   * Append an artifact to a task and notify subscribers.
   */
  addArtifact(taskId: string, artifact: A2AArtifact): void {
    const task = this.getTaskOrThrow(taskId);
    task.artifacts = task.artifacts ?? [];
    task.artifacts.push(artifact);
    this.notifySubscribers(taskId, {
      type: "task-artifact-update",
      taskId,
      artifact,
    });
  }

  // ── Cancel ──────────────────────────────────────────────────

  /**
   * Cancel a task. Only valid when the task is in a non-terminal state.
   *
   * @throws A2AProtocolError if the task is already in a terminal state.
   */
  cancelTask(taskId: string): A2ATask {
    const task = this.getTaskOrThrow(taskId);

    if (isTerminalState(task.status.state)) {
      throw new A2AProtocolError(
        A2A_ERROR.TASK_NOT_CANCELABLE,
        `Task already in terminal state: ${task.status.state}`,
      );
    }

    assertTransition(task.status.state, "canceled");
    task.status = { state: "canceled", timestamp: new Date().toISOString() };

    this.notifySubscribers(taskId, {
      type: "task-status-update",
      taskId,
      status: task.status,
      final: true,
    });

    this.subscribers.delete(taskId);
    return task;
  }

  // ── Subscriptions ───────────────────────────────────────────

  /**
   * Subscribe to real-time updates for a task. Returns an unsubscribe
   * function. Subscribers are automatically removed when the task
   * reaches a terminal state.
   */
  subscribe(taskId: string, subscriber: TaskSubscriber): () => void {
    this.getTaskOrThrow(taskId);

    let subs = this.subscribers.get(taskId);
    if (!subs) {
      subs = new Set();
      this.subscribers.set(taskId, subs);
    }
    subs.add(subscriber);

    return () => {
      subs!.delete(subscriber);
      if (subs!.size === 0) {
        this.subscribers.delete(taskId);
      }
    };
  }

  private notifySubscribers(taskId: string, event: A2AStreamEvent): void {
    const subs = this.subscribers.get(taskId);
    if (!subs) return;
    for (const sub of subs) {
      try {
        sub(event);
      } catch {
        /* ignore subscriber errors */
      }
    }
  }

  // ── Pruning ─────────────────────────────────────────────────

  /**
   * Remove tasks that have been in a terminal state longer than
   * the configured expiry duration.
   *
   * @returns The number of tasks pruned.
   */
  pruneExpiredTasks(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [id, task] of this.tasks) {
      const ts = task.status.timestamp
        ? new Date(task.status.timestamp).getTime()
        : 0;
      if (isTerminalState(task.status.state) && now - ts > this.expiryMs) {
        this.tasks.delete(id);
        this.subscribers.delete(id);
        pruned++;
      }
    }

    return pruned;
  }

  // ── Queries ─────────────────────────────────────────────────

  listTasks(): A2ATask[] {
    return Array.from(this.tasks.values());
  }

  get size(): number {
    return this.tasks.size;
  }

  // ── Lifecycle ───────────────────────────────────────────────

  /**
   * Stop the prune timer and clear all subscribers. Call this when
   * shutting down the server.
   */
  shutdown(): void {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
    }
    this.subscribers.clear();
  }
}

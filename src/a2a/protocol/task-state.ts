/**
 * A2A Task state machine — validates transitions and detects terminal states.
 *
 * Valid transitions:
 *   submitted      → working
 *   working        → completed | failed | canceled | input-required
 *   input-required → working | canceled
 *   (terminal states: completed, failed, canceled — no outbound transitions)
 */
import type { A2ATaskState } from "./types.js";

const VALID_TRANSITIONS: Record<A2ATaskState, A2ATaskState[]> = {
  submitted: ["working", "canceled"],
  working: ["completed", "failed", "canceled", "input-required"],
  "input-required": ["working", "canceled"],
  completed: [],
  failed: [],
  canceled: [],
};

const TERMINAL_STATES: ReadonlySet<A2ATaskState> = new Set([
  "completed",
  "failed",
  "canceled",
]);

export function isTerminalState(state: A2ATaskState): boolean {
  return TERMINAL_STATES.has(state);
}

export function isValidTransition(
  from: A2ATaskState,
  to: A2ATaskState,
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: A2ATaskState,
  to: A2ATaskState,
): void {
  if (!isValidTransition(from, to)) {
    throw new Error(
      `Invalid task state transition: ${from} → ${to}. ` +
        `Valid transitions from "${from}": [${VALID_TRANSITIONS[from]?.join(", ") ?? "none"}]`,
    );
  }
}

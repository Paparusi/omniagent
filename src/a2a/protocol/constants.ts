/**
 * A2A Protocol constants — version, paths, limits.
 */

export const A2A_PROTOCOL_VERSION = "0.2.0";

// ── HTTP Paths ──────────────────────────────────────────────────

export const A2A_WELL_KNOWN_PATH = "/.well-known/agent-card.json";
export const A2A_AGENT_CARD_PATH = "/a2a/agent-card";
export const A2A_MESSAGES_PATH = "/a2a/messages";
export const A2A_MESSAGES_STREAM_PATH = "/a2a/messages:stream";
export const A2A_TASKS_PATH = "/a2a/tasks";

// ── JSON-RPC Methods ────────────────────────────────────────────

export const A2A_METHOD = {
  SEND_MESSAGE: "message/send",
  STREAM_MESSAGE: "message/stream",
  GET_TASK: "tasks/get",
  CANCEL_TASK: "tasks/cancel",
  SET_PUSH_NOTIFICATION: "tasks/pushNotification/set",
  GET_PUSH_NOTIFICATION: "tasks/pushNotification/get",
} as const;

// ── Limits ──────────────────────────────────────────────────────

export const A2A_MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB
export const A2A_DEFAULT_TIMEOUT_MS = 120_000; // 2 min
export const A2A_DEFAULT_CACHE_TTL_MS = 5 * 60_000; // 5 min
export const A2A_DEFAULT_MAX_TASKS = 100;
export const A2A_DEFAULT_TASK_EXPIRY_MS = 60 * 60_000; // 1 hour

// ── SSE ─────────────────────────────────────────────────────────

export const A2A_SSE_CONTENT_TYPE = "text/event-stream";
export const A2A_SSE_RETRY_MS = 5000;

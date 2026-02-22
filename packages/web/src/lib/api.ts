/**
 * OmniAgent REST / A2A API Client
 *
 * Provides typed helpers for the Agent-to-Agent (A2A) protocol endpoints
 * exposed by the OmniAgent gateway as well as standard JSON-RPC 2.0 calls
 * for task management.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface A2ARequestOptions {
  /** Bearer token for authenticated requests. */
  token?: string;
  /** Override the default gateway / agent URL. */
  agentUrl?: string;
  /** Custom headers to merge into the request. */
  headers?: Record<string, string>;
  /** AbortSignal for request cancellation. */
  signal?: AbortSignal;
}

export interface AgentCard {
  name?: string;
  description?: string;
  url?: string;
  capabilities?: Record<string, unknown>;
  skills?: Array<{
    id: string;
    name: string;
    description?: string;
    tags?: string[];
    examples?: string[];
  }>;
  [key: string]: unknown;
}

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: unknown;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: string | number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface A2ATask {
  id: string;
  status: string;
  artifacts?: unknown[];
  history?: unknown[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL: string =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:18789";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let rpcIdCounter = 0;

function nextRpcId(): string {
  rpcIdCounter += 1;
  return `rpc-${Date.now().toString(36)}-${rpcIdCounter}`;
}

function buildHeaders(opts?: A2ARequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (opts?.token) {
    headers["Authorization"] = `Bearer ${opts.token}`;
  }
  if (opts?.headers) {
    Object.assign(headers, opts.headers);
  }
  return headers;
}

function resolveUrl(path: string, opts?: A2ARequestOptions): string {
  const base = opts?.agentUrl || BASE_URL;
  // Strip trailing slash from base and leading slash from path to avoid //
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
}

/**
 * Execute a JSON-RPC 2.0 call against the gateway or a remote agent.
 */
async function jsonRpcCall<T = unknown>(
  endpoint: string,
  method: string,
  params?: unknown,
  opts?: A2ARequestOptions
): Promise<T> {
  const url = resolveUrl(endpoint, opts);

  const body: JsonRpcRequest = {
    jsonrpc: "2.0",
    id: nextRpcId(),
    method,
  };
  if (params !== undefined) {
    body.params = params;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(opts),
    body: JSON.stringify(body),
    signal: opts?.signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `JSON-RPC HTTP error: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`
    );
  }

  const json: JsonRpcResponse<T> = await response.json();

  if (json.error) {
    const err = new Error(
      `JSON-RPC error: ${json.error.message} (code ${json.error.code})`
    );
    (err as any).code = json.error.code;
    (err as any).data = json.error.data;
    throw err;
  }

  return json.result as T;
}

// ---------------------------------------------------------------------------
// Agent Card Discovery
// ---------------------------------------------------------------------------

/**
 * Fetch an agent's A2A Agent Card from the well-known endpoint.
 *
 * @param baseUrl - Base URL of the agent / gateway. Defaults to `BASE_URL`.
 */
export async function fetchAgentCard(
  baseUrl?: string,
  opts?: Pick<A2ARequestOptions, "signal" | "token" | "headers">
): Promise<AgentCard> {
  const url = (baseUrl || BASE_URL).replace(/\/+$/, "");

  const response = await fetch(`${url}/.well-known/agent-card.json`, {
    method: "GET",
    headers: buildHeaders(opts),
    signal: opts?.signal,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch agent card: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<AgentCard>;
}

// ---------------------------------------------------------------------------
// A2A Messaging
// ---------------------------------------------------------------------------

/**
 * Send a message to an agent via the A2A protocol (`message/send`).
 */
export async function sendA2AMessage(
  message: string,
  opts?: A2ARequestOptions & { taskId?: string; sessionId?: string }
): Promise<A2ATask> {
  const params: Record<string, unknown> = {
    message: {
      role: "user",
      parts: [{ type: "text", text: message }],
    },
  };

  if (opts?.taskId) {
    params.id = opts.taskId;
  }
  if (opts?.sessionId) {
    params.sessionId = opts.sessionId;
  }

  return jsonRpcCall<A2ATask>("a2a", "message/send", params, opts);
}

/**
 * Send a message and receive a streaming response via the A2A protocol
 * (`message/stream`). Returns a `ReadableStream` of server-sent events.
 */
export async function streamA2AMessage(
  message: string,
  opts?: A2ARequestOptions & { taskId?: string; sessionId?: string }
): Promise<ReadableStream<Uint8Array> | null> {
  const url = resolveUrl("a2a", opts);

  const params: Record<string, unknown> = {
    message: {
      role: "user",
      parts: [{ type: "text", text: message }],
    },
  };
  if (opts?.taskId) params.id = opts.taskId;
  if (opts?.sessionId) params.sessionId = opts.sessionId;

  const body: JsonRpcRequest = {
    jsonrpc: "2.0",
    id: nextRpcId(),
    method: "message/stream",
    params,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...buildHeaders(opts),
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
    signal: opts?.signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Stream request failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`
    );
  }

  return response.body;
}

// ---------------------------------------------------------------------------
// Task Management
// ---------------------------------------------------------------------------

/**
 * Retrieve the current state of an A2A task.
 */
export async function getA2ATask(
  taskId: string,
  opts?: A2ARequestOptions
): Promise<A2ATask> {
  return jsonRpcCall<A2ATask>("a2a", "tasks/get", { id: taskId }, opts);
}

/**
 * Cancel an in-progress A2A task.
 */
export async function cancelA2ATask(
  taskId: string,
  opts?: A2ARequestOptions
): Promise<A2ATask> {
  return jsonRpcCall<A2ATask>("a2a", "tasks/cancel", { id: taskId }, opts);
}

// ---------------------------------------------------------------------------
// Agent Discovery
// ---------------------------------------------------------------------------

/** Well-known endpoints to check when discovering agents. */
const DISCOVERY_ENDPOINTS: string[] = [BASE_URL];

/**
 * Discover agents by fetching agent cards from known endpoints.
 *
 * Optionally filters results by a search query (matched against the agent
 * name and description).
 *
 * @param query - Optional search string to filter agents.
 * @param additionalEndpoints - Extra base URLs to probe in addition to defaults.
 */
export async function discoverAgents(
  query?: string,
  additionalEndpoints?: string[]
): Promise<AgentCard[]> {
  const endpoints = [
    ...DISCOVERY_ENDPOINTS,
    ...(additionalEndpoints ?? []),
  ];

  // Deduplicate
  const unique = [...new Set(endpoints.map((e) => e.replace(/\/+$/, "")))];

  const results = await Promise.allSettled(
    unique.map((ep) =>
      fetchAgentCard(ep).then((card) => ({ ...card, url: card.url || ep }))
    )
  );

  let agents: AgentCard[] = results
    .filter(
      (r): r is PromiseFulfilledResult<AgentCard> => r.status === "fulfilled"
    )
    .map((r) => r.value);

  // Apply query filter when provided
  if (query) {
    const lower = query.toLowerCase();
    agents = agents.filter((agent) => {
      const name = (agent.name || "").toLowerCase();
      const desc = (agent.description || "").toLowerCase();
      return name.includes(lower) || desc.includes(lower);
    });
  }

  return agents;
}

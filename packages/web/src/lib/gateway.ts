/**
 * OmniAgent Gateway WebSocket Client
 *
 * Connects to the OmniAgent gateway (default port 18789) and provides a
 * typed request/response RPC layer plus a pub-sub event bus on top of the
 * gateway's binary-free WebSocket protocol.
 *
 * Frame types
 * -----------
 *   Request  : { type: "req",   id, method, params? }
 *   Response : { type: "res",   id, ok, payload?, error? }
 *   Event    : { type: "event", event, payload? }
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectionState = "disconnected" | "connecting" | "connected";

export type EventCallback = (payload: unknown) => void;

export interface GatewayError {
  code: number;
  message: string;
}

export interface RequestFrame {
  type: "req";
  id: string;
  method: string;
  params?: unknown;
}

export interface ResponseFrame {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: GatewayError;
}

export interface EventFrame {
  type: "event";
  event: string;
  payload?: unknown;
}

export interface AgentMessageOptions {
  agentId?: string;
  sessionKey?: string;
  deliver?: boolean;
  thinking?: boolean;
}

export interface AgentIdentity {
  name?: string;
  avatar?: string;
  emoji?: string;
}

export interface AgentEventPayload {
  runId: string;
  seq: number;
  stream: "text" | "thinking" | "tool_call";
  data: unknown;
}

type Frame = RequestFrame | ResponseFrame | EventFrame;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REQUEST_TIMEOUT_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 500;
const MAX_RECONNECT_DELAY_MS = 30_000;

function generateId(): string {
  // Compact unique-enough id: timestamp + random suffix
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// GatewayClient
// ---------------------------------------------------------------------------

export class GatewayClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | undefined;

  private state: ConnectionState = "disconnected";
  private pendingRequests = new Map<string, PendingRequest>();
  private eventListeners = new Map<string, Set<EventCallback>>();
  private stateListeners = new Set<(state: ConnectionState) => void>();

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private intentionalClose = false;

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  constructor(url: string, token?: string) {
    this.url = url;
    this.token = token;
  }

  /**
   * Open the WebSocket connection. Safe to call multiple times; subsequent
   * calls while already connecting/connected are no-ops.
   */
  connect(): void {
    if (this.state !== "disconnected") return;

    this.intentionalClose = false;
    this.setConnectionState("connecting");

    try {
      // Append token as query parameter when present
      const connectUrl = this.token
        ? `${this.url}${this.url.includes("?") ? "&" : "?"}token=${encodeURIComponent(this.token)}`
        : this.url;

      this.ws = new WebSocket(connectUrl);
    } catch (err) {
      console.error("[gateway] Failed to create WebSocket:", err);
      this.setConnectionState("disconnected");
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setConnectionState("connected");

      // Send an initial handshake / connect frame with client metadata
      this.sendRaw({
        type: "req",
        id: generateId(),
        method: "connect",
        params: {
          client: "omniagent-web",
          version: "1.0.0",
          timestamp: Date.now(),
        },
      });
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = (event: CloseEvent) => {
      const wasConnected = this.state === "connected";
      this.setConnectionState("disconnected");
      this.ws = null;

      // Reject all pending requests
      this.rejectAllPending(
        new Error(`WebSocket closed: code=${event.code} reason=${event.reason || "unknown"}`)
      );

      if (!this.intentionalClose) {
        if (wasConnected) {
          console.warn("[gateway] Connection lost. Attempting to reconnect...");
        }
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (event: globalThis.Event) => {
      // The onclose handler will fire after this, so just log here.
      console.error("[gateway] WebSocket error:", event);
    };
  }

  /**
   * Cleanly close the connection. Cancels any pending reconnect timer.
   */
  disconnect(): void {
    this.intentionalClose = true;

    if (this.reconnectTimer !== undefined) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    this.reconnectAttempts = 0;

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.rejectAllPending(new Error("Client disconnected"));
    this.setConnectionState("disconnected");
  }

  // -----------------------------------------------------------------------
  // RPC
  // -----------------------------------------------------------------------

  /**
   * Send a request to the gateway and await the response.
   *
   * Rejects after {@link REQUEST_TIMEOUT_MS} ms or if the socket drops.
   */
  async request<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (this.state !== "connected" || !this.ws) {
        reject(new Error(`Cannot send request: gateway is ${this.state}`));
        return;
      }

      const id = generateId();

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request "${method}" timed out after ${REQUEST_TIMEOUT_MS}ms`));
      }, REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
        timeout,
      });

      const frame: RequestFrame = { type: "req", id, method };
      if (params !== undefined) {
        frame.params = params;
      }

      this.sendRaw(frame);
    });
  }

  // -----------------------------------------------------------------------
  // Events
  // -----------------------------------------------------------------------

  /**
   * Subscribe to a gateway event. Returns an unsubscribe function.
   */
  on(event: string, callback: EventCallback): () => void {
    let listeners = this.eventListeners.get(event);
    if (!listeners) {
      listeners = new Set<EventCallback>();
      this.eventListeners.set(event, listeners);
    }
    listeners.add(callback);

    return () => {
      listeners!.delete(callback);
      if (listeners!.size === 0) {
        this.eventListeners.delete(event);
      }
    };
  }

  /**
   * Subscribe to connection state changes. Returns an unsubscribe function.
   */
  onStateChange(callback: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(callback);
    // Immediately notify the subscriber of the current state
    callback(this.state);

    return () => {
      this.stateListeners.delete(callback);
    };
  }

  /** Current connection state (read-only). */
  get connectionState(): ConnectionState {
    return this.state;
  }

  // -----------------------------------------------------------------------
  // Convenience methods
  // -----------------------------------------------------------------------

  /**
   * Send a chat message to an agent.
   */
  async sendMessage(
    message: string,
    opts?: AgentMessageOptions
  ): Promise<unknown> {
    return this.request("agent", {
      message,
      ...(opts?.agentId !== undefined && { agentId: opts.agentId }),
      ...(opts?.sessionKey !== undefined && { sessionKey: opts.sessionKey }),
      ...(opts?.deliver !== undefined && { deliver: opts.deliver }),
      ...(opts?.thinking !== undefined && { thinking: opts.thinking }),
    });
  }

  /**
   * Retrieve the identity (name, avatar, emoji) for an agent.
   */
  async getAgentIdentity(agentId?: string): Promise<AgentIdentity> {
    return this.request<AgentIdentity>("agent_identity", {
      ...(agentId !== undefined && { agentId }),
    });
  }

  /**
   * List all chat sessions.
   */
  async listSessions(): Promise<unknown[]> {
    return this.request<unknown[]>("sessions_list");
  }

  /**
   * Patch / update a chat session.
   */
  async patchSession(
    sessionKey: string,
    patch: Record<string, unknown>
  ): Promise<unknown> {
    return this.request("sessions_patch", { sessionKey, ...patch });
  }

  /**
   * Retrieve a configuration value from the gateway.
   */
  async getConfig(): Promise<unknown> {
    return this.request("config_get");
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private setConnectionState(next: ConnectionState): void {
    if (next === this.state) return;
    this.state = next;
    for (const listener of this.stateListeners) {
      try {
        listener(next);
      } catch (err) {
        console.error("[gateway] State listener threw:", err);
      }
    }
  }

  private sendRaw(frame: Frame): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[gateway] Cannot send frame, socket not open:", frame);
      return;
    }
    try {
      this.ws.send(JSON.stringify(frame));
    } catch (err) {
      console.error("[gateway] Failed to send frame:", err);
    }
  }

  private handleMessage(raw: unknown): void {
    let frame: Frame;
    try {
      frame = JSON.parse(typeof raw === "string" ? raw : String(raw)) as Frame;
    } catch {
      console.warn("[gateway] Received non-JSON message:", raw);
      return;
    }

    switch (frame.type) {
      case "res":
        this.handleResponse(frame as ResponseFrame);
        break;
      case "event":
        this.handleEvent(frame as EventFrame);
        break;
      default:
        // Ignore unknown frame types gracefully
        break;
    }
  }

  private handleResponse(frame: ResponseFrame): void {
    const pending = this.pendingRequests.get(frame.id);
    if (!pending) {
      // Response for an already-timed-out or unknown request; ignore.
      return;
    }

    this.pendingRequests.delete(frame.id);
    clearTimeout(pending.timeout);

    if (frame.ok) {
      pending.resolve(frame.payload);
    } else {
      const err = frame.error;
      const message = err?.message || "Unknown gateway error";
      const code = err?.code ?? -1;
      const error = new Error(`[gateway] ${message} (code ${code})`);
      (error as any).code = code;
      pending.reject(error);
    }
  }

  private handleEvent(frame: EventFrame): void {
    const listeners = this.eventListeners.get(frame.event);
    if (!listeners || listeners.size === 0) return;

    for (const cb of listeners) {
      try {
        cb(frame.payload);
      } catch (err) {
        console.error(`[gateway] Event listener for "${frame.event}" threw:`, err);
      }
    }
  }

  private rejectAllPending(reason: Error): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(reason);
    }
    this.pendingRequests.clear();
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        `[gateway] Exhausted ${this.maxReconnectAttempts} reconnect attempts. Giving up.`
      );
      return;
    }

    // Exponential backoff with jitter
    const delay = clamp(
      BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts) +
        Math.random() * BASE_RECONNECT_DELAY_MS,
      BASE_RECONNECT_DELAY_MS,
      MAX_RECONNECT_DELAY_MS
    );

    this.reconnectAttempts += 1;

    console.info(
      `[gateway] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, delay);
  }
}

// ---------------------------------------------------------------------------
// Singleton accessor
// ---------------------------------------------------------------------------

let instance: GatewayClient | null = null;

/**
 * Return the shared {@link GatewayClient} singleton.
 *
 * Uses `NEXT_PUBLIC_GATEWAY_URL` and `NEXT_PUBLIC_GATEWAY_TOKEN` from the
 * environment, falling back to `ws://localhost:18789`.
 */
export function getGateway(): GatewayClient {
  if (!instance) {
    const url =
      process.env.NEXT_PUBLIC_GATEWAY_URL || "ws://localhost:18789";
    const token = process.env.NEXT_PUBLIC_GATEWAY_TOKEN;
    instance = new GatewayClient(url, token);
  }
  return instance;
}

/**
 * Replace the current singleton (useful for testing).
 */
export function setGateway(client: GatewayClient | null): void {
  if (instance) {
    instance.disconnect();
  }
  instance = client;
}

import type {
  A2ATask, A2AMessage, A2AJsonRpcResponse, A2AStreamEvent,
  A2ASendMessageParams, A2AGetTaskParams, A2ACancelTaskParams,
} from "../types.js";
import { A2A_METHOD, A2A_DEFAULT_TIMEOUT_MS } from "../constants.js";

export interface A2AClientOptions {
  baseUrl: string;
  auth?: { token?: string; apiKey?: string };
  timeout?: number;
}

export class A2AClient {
  private baseUrl: string;
  private auth?: { token?: string; apiKey?: string };
  private timeout: number;

  constructor(opts: A2AClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.auth = opts.auth;
    this.timeout = opts.timeout ?? A2A_DEFAULT_TIMEOUT_MS;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.auth?.token) headers.Authorization = `Bearer ${this.auth.token}`;
    if (this.auth?.apiKey) headers["X-API-Key"] = this.auth.apiKey;
    return headers;
  }

  private async rpc(method: string, params?: Record<string, unknown>): Promise<unknown> {
    const body = {
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method,
      params,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}/a2a/messages`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`A2A RPC failed: ${res.status} ${res.statusText}`);
      }

      const rpcResponse = (await res.json()) as A2AJsonRpcResponse;
      if (rpcResponse.error) {
        throw new Error(`A2A error ${rpcResponse.error.code}: ${rpcResponse.error.message}`);
      }
      return rpcResponse.result;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async sendMessage(params: {
    message: A2AMessage;
    sessionId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<A2ATask> {
    const rpcParams: A2ASendMessageParams = {
      message: params.message,
      metadata: { ...params.metadata, sessionId: params.sessionId },
    };
    return (await this.rpc(A2A_METHOD.SEND_MESSAGE, rpcParams as unknown as Record<string, unknown>)) as A2ATask;
  }

  async *sendMessageStream(params: {
    message: A2AMessage;
    sessionId?: string;
  }): AsyncGenerator<A2AStreamEvent> {
    const body = {
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method: A2A_METHOD.STREAM_MESSAGE,
      params: {
        message: params.message,
        metadata: { sessionId: params.sessionId },
      } satisfies A2ASendMessageParams as unknown,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}/a2a/messages:stream`, {
        method: "POST",
        headers: { ...this.getHeaders(), Accept: "text/event-stream" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`A2A stream failed: ${res.status} ${res.statusText}`);
      }

      if (!res.body) throw new Error("No response body for SSE stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const rpcResponse = JSON.parse(line.slice(6)) as A2AJsonRpcResponse;
              if (rpcResponse.result) {
                yield rpcResponse.result as A2AStreamEvent;
              }
            } catch { /* skip malformed SSE lines */ }
          }
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getTask(taskId: string): Promise<A2ATask> {
    const params: A2AGetTaskParams = { id: taskId };
    return (await this.rpc(A2A_METHOD.GET_TASK, params as unknown as Record<string, unknown>)) as A2ATask;
  }

  async cancelTask(taskId: string): Promise<A2ATask> {
    const params: A2ACancelTaskParams = { id: taskId };
    return (await this.rpc(A2A_METHOD.CANCEL_TASK, params as unknown as Record<string, unknown>)) as A2ATask;
  }

  async *subscribe(taskId: string): AsyncGenerator<A2AStreamEvent> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(
        `${this.baseUrl}/a2a/tasks/subscribe?taskId=${encodeURIComponent(taskId)}`,
        {
          headers: { ...this.getHeaders(), Accept: "text/event-stream" },
          signal: controller.signal,
        },
      );

      if (!res.ok) throw new Error(`A2A subscribe failed: ${res.status}`);
      if (!res.body) throw new Error("No response body for SSE stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try { yield JSON.parse(line.slice(6)) as A2AStreamEvent; } catch {}
          }
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

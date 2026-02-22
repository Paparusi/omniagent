/**
 * JSON-RPC 2.0 dispatcher for the A2A protocol.
 */
import type {
  A2AJsonRpcRequest,
  A2AJsonRpcResponse,
  A2AJsonRpcError,
} from "./types.js";

// ── Error Codes (A2A spec + JSON-RPC 2.0 standard) ─────────────

export const A2A_ERROR = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // A2A-specific
  TASK_NOT_FOUND: -32001,
  TASK_NOT_CANCELABLE: -32002,
  PUSH_NOT_SUPPORTED: -32003,
  UNSUPPORTED_OPERATION: -32004,
  CONTENT_TYPE_NOT_SUPPORTED: -32005,
  AUTHENTICATION_REQUIRED: -32010,
} as const;

// ── Types ───────────────────────────────────────────────────────

export type A2AMethodHandler = (
  params: Record<string, unknown>,
  context: A2ARequestContext,
) => Promise<unknown>;

export interface A2ARequestContext {
  agentId?: string;
  sessionId?: string;
  authenticated: boolean;
  remoteAddr?: string;
}

// ── Helpers ─────────────────────────────────────────────────────

export function createJsonRpcResponse(
  id: string | number,
  result: unknown,
): A2AJsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

export function createJsonRpcError(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): A2AJsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id: id ?? 0,
    error: { code, message, data },
  };
}

// ── Validation ──────────────────────────────────────────────────

function isValidRequest(body: unknown): body is A2AJsonRpcRequest {
  if (typeof body !== "object" || body === null) return false;
  const req = body as Record<string, unknown>;
  return (
    req.jsonrpc === "2.0" &&
    (typeof req.id === "string" || typeof req.id === "number") &&
    typeof req.method === "string"
  );
}

// ── Dispatcher ──────────────────────────────────────────────────

export async function dispatchJsonRpc(
  body: unknown,
  handlers: Record<string, A2AMethodHandler>,
  context: A2ARequestContext,
): Promise<A2AJsonRpcResponse> {
  if (!isValidRequest(body)) {
    return createJsonRpcError(null, A2A_ERROR.INVALID_REQUEST, "Invalid JSON-RPC 2.0 request");
  }

  const handler = handlers[body.method];
  if (!handler) {
    return createJsonRpcError(
      body.id,
      A2A_ERROR.METHOD_NOT_FOUND,
      `Method not found: ${body.method}`,
    );
  }

  try {
    const params = (body.params ?? {}) as Record<string, unknown>;
    const result = await handler(params, context);
    return createJsonRpcResponse(body.id, result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const code =
      err instanceof A2AProtocolError ? err.code : A2A_ERROR.INTERNAL_ERROR;
    return createJsonRpcError(body.id, code, message);
  }
}

// ── Protocol Error ──────────────────────────────────────────────

export class A2AProtocolError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "A2AProtocolError";
  }
}

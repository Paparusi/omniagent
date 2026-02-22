/**
 * A2A Protocol server endpoints — HTTP route handlers registered via
 * `api.registerHttpRoute()` on the OmniAgent plugin API.
 *
 * Exposes the following routes:
 *
 *   GET  /.well-known/agent-card.json   — A2A Agent Card discovery
 *   POST /a2a/messages                  — sync JSON-RPC (message/send, tasks/get, tasks/cancel)
 *   POST /a2a/messages:stream           — SSE streaming (message/send, message/stream)
 *   GET  /a2a/tasks/subscribe?taskId=   — SSE task subscription
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import type { OmniAgentPluginApi } from "omniagent/plugin-sdk";
import type { A2AProtocolConfig } from "./auth.js";
import type {
  A2AMessage,
  A2ASendMessageParams,
  A2AGetTaskParams,
  A2ACancelTaskParams,
} from "../types.js";
import {
  A2A_WELL_KNOWN_PATH,
  A2A_MESSAGES_PATH,
  A2A_MESSAGES_STREAM_PATH,
  A2A_TASKS_PATH,
  A2A_METHOD,
  A2A_SSE_RETRY_MS,
} from "../constants.js";
import {
  dispatchJsonRpc,
  createJsonRpcResponse,
  createJsonRpcError,
  A2A_ERROR,
  A2AProtocolError,
} from "../jsonrpc.js";
import type { A2ARequestContext } from "../jsonrpc.js";
import { A2ATaskManager } from "./task-manager.js";
import { generateAgentCard } from "./agent-card.js";
import { authorizeA2ARequest } from "./auth.js";
import {
  a2aMessageToAgentInput,
  agentOutputToA2AMessage,
  agentOutputToA2AArtifacts,
  extractTextFromMessage,
} from "./translator.js";
import { isTerminalState } from "../task-state.js";

// ── HTTP Helpers ────────────────────────────────────────────────

function sendJson(
  res: ServerResponse,
  status: number,
  data: unknown,
): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req: IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        req.destroy();
        reject(new Error("Body too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function setSseHeaders(res: ServerResponse): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });
}

function writeSseEvent(res: ServerResponse, data: unknown): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ── Registration ────────────────────────────────────────────────

/**
 * Register all A2A protocol server HTTP routes on the OmniAgent plugin
 * API. This is the main entry point for bootstrapping the server.
 */
export function registerA2AServerEndpoints(
  api: OmniAgentPluginApi,
  taskManager: A2ATaskManager,
  config: A2AProtocolConfig,
): void {
  const baseUrl = config.baseUrl ?? "http://localhost:18789";

  // ── GET /.well-known/agent-card.json ────────────────────────
  api.registerHttpRoute({
    path: A2A_WELL_KNOWN_PATH,
    handler: async (req: any, res: any) => {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" });
        return;
      }

      const defaultAgentId =
        config.server?.exposeAgents?.[0] ?? "default";

      const card = generateAgentCard({
        agentId: defaultAgentId,
        agentName: api.config?.ui?.assistant?.name ?? "OmniAgent",
        baseUrl,
        capabilities: {
          streaming: config.server?.streaming !== false,
          pushNotifications: config.server?.pushNotifications ?? false,
          stateTransitionHistory: true,
        },
      });

      sendJson(res, 200, card);
    },
  });

  // ── POST /a2a/messages — sync JSON-RPC ──────────────────────
  api.registerHttpRoute({
    path: A2A_MESSAGES_PATH,
    handler: async (req: any, res: any) => {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" });
        return;
      }

      // Auth
      const authResult = authorizeA2ARequest({
        authHeader: req.headers?.authorization,
        config,
      });
      if (!authResult.ok) {
        sendJson(
          res,
          401,
          createJsonRpcError(
            0,
            A2A_ERROR.AUTHENTICATION_REQUIRED,
            authResult.error!,
          ),
        );
        return;
      }

      // Parse body
      let body: unknown;
      try {
        const raw = await readBody(req, 10 * 1024 * 1024);
        body = JSON.parse(raw);
      } catch {
        sendJson(
          res,
          400,
          createJsonRpcError(0, A2A_ERROR.PARSE_ERROR, "Invalid JSON"),
        );
        return;
      }

      const context: A2ARequestContext = { authenticated: true };

      // Dispatch to method handlers
      const handlers: Record<string, any> = {
        [A2A_METHOD.SEND_MESSAGE]: handleSendMessage,
        [A2A_METHOD.GET_TASK]: handleGetTask,
        [A2A_METHOD.CANCEL_TASK]: handleCancelTask,
      };

      const response = await dispatchJsonRpc(body, handlers, context);
      sendJson(res, 200, response);
    },
  });

  // ── POST /a2a/messages:stream — SSE streaming ───────────────
  api.registerHttpRoute({
    path: A2A_MESSAGES_STREAM_PATH,
    handler: async (req: any, res: any) => {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" });
        return;
      }

      // Auth
      const authResult = authorizeA2ARequest({
        authHeader: req.headers?.authorization,
        config,
      });
      if (!authResult.ok) {
        sendJson(res, 401, { error: authResult.error });
        return;
      }

      // Parse body
      let body: any;
      try {
        const raw = await readBody(req, 10 * 1024 * 1024);
        body = JSON.parse(raw);
      } catch {
        sendJson(res, 400, { error: "Invalid JSON" });
        return;
      }

      // Only streaming-compatible methods
      if (
        body?.method !== A2A_METHOD.SEND_MESSAGE &&
        body?.method !== A2A_METHOD.STREAM_MESSAGE
      ) {
        sendJson(
          res,
          400,
          createJsonRpcError(
            body?.id ?? 0,
            A2A_ERROR.METHOD_NOT_FOUND,
            "Streaming only supports message/send and message/stream",
          ),
        );
        return;
      }

      const params = body.params as A2ASendMessageParams;
      if (!params?.message) {
        sendJson(
          res,
          400,
          createJsonRpcError(
            body.id,
            A2A_ERROR.INVALID_PARAMS,
            "Missing message",
          ),
        );
        return;
      }

      // Create task
      const task = taskManager.createTask({
        message: params.message,
        sessionId: params.metadata?.sessionId as string,
      });

      // Set SSE headers
      setSseHeaders(res);

      // Send initial status
      writeSseEvent(
        res,
        createJsonRpcResponse(body.id, {
          type: "task-status-update",
          taskId: task.id,
          status: task.status,
          final: false,
        }),
      );

      // Subscribe to updates
      const unsubscribe = taskManager.subscribe(task.id, (event) => {
        writeSseEvent(res, createJsonRpcResponse(body.id, event));
        if ("final" in event && event.final) {
          res.end();
        }
      });

      // Handle client disconnect
      req.on("close", () => {
        unsubscribe();
      });

      // Execute task asynchronously
      executeTask(taskManager, task.id, params.message, api).catch(() => {});
    },
  });

  // ── GET /a2a/tasks/subscribe — SSE task subscription ────────
  api.registerHttpRoute({
    path: "/a2a/tasks/subscribe",
    handler: async (req: any, res: any) => {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" });
        return;
      }

      // Auth
      const authResult = authorizeA2ARequest({
        authHeader: req.headers?.authorization,
        config,
      });
      if (!authResult.ok) {
        sendJson(res, 401, { error: authResult.error });
        return;
      }

      // Parse taskId from query string
      const url = new URL(req.url ?? "", `http://${req.headers.host}`);
      const taskId = url.searchParams.get("taskId");
      if (!taskId) {
        sendJson(res, 400, { error: "Missing taskId query parameter" });
        return;
      }

      const task = taskManager.getTask(taskId);
      if (!task) {
        sendJson(res, 404, { error: "Task not found" });
        return;
      }

      setSseHeaders(res);

      // Send current status immediately
      writeSseEvent(res, {
        type: "task-status-update",
        taskId,
        status: task.status,
        final: isTerminalState(task.status.state),
      });

      // If already terminal, close the stream
      if (isTerminalState(task.status.state)) {
        res.end();
        return;
      }

      // Subscribe for future updates
      const unsubscribe = taskManager.subscribe(taskId, (event) => {
        writeSseEvent(res, event);
        if ("final" in event && event.final) {
          res.end();
        }
      });

      req.on("close", () => {
        unsubscribe();
      });
    },
  });

  // ── JSON-RPC Method Handlers ────────────────────────────────

  async function handleSendMessage(
    params: Record<string, unknown>,
    _ctx: A2ARequestContext,
  ): Promise<unknown> {
    const sendParams = params as unknown as A2ASendMessageParams;
    if (!sendParams.message) {
      throw new A2AProtocolError(
        A2A_ERROR.INVALID_PARAMS,
        "Missing message parameter",
      );
    }

    const task = taskManager.createTask({
      message: sendParams.message,
      sessionId: sendParams.metadata?.sessionId as string,
    });

    // Execute synchronously and wait for completion
    await executeTask(taskManager, task.id, sendParams.message, api);
    return taskManager.getTask(task.id);
  }

  async function handleGetTask(
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const { id } = params as unknown as A2AGetTaskParams;
    if (!id) {
      throw new A2AProtocolError(
        A2A_ERROR.INVALID_PARAMS,
        "Missing task id",
      );
    }
    return taskManager.getTaskOrThrow(id);
  }

  async function handleCancelTask(
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const { id } = params as unknown as A2ACancelTaskParams;
    if (!id) {
      throw new A2AProtocolError(
        A2A_ERROR.INVALID_PARAMS,
        "Missing task id",
      );
    }
    return taskManager.cancelTask(id);
  }
}

// ── Task Execution ──────────────────────────────────────────────

/**
 * Execute a task by converting the A2A message into OmniAgent input,
 * invoking the agent, and updating the task with results or errors.
 */
async function executeTask(
  taskManager: A2ATaskManager,
  taskId: string,
  message: A2AMessage,
  api: any,
): Promise<void> {
  try {
    taskManager.updateStatus(taskId, "working");

    // Convert A2A message to plain-text agent input
    const input = a2aMessageToAgentInput(message);

    // Execute via OmniAgent's embedded agent runner
    let responseText = "";

    try {
      // Use the plugin runtime to invoke the agent
      if (api.runtime?.invokeAgent) {
        const result = await api.runtime.invokeAgent({
          message: input,
          sessionKey: `a2a-${taskId}`,
          deliver: false,
        });
        responseText = result?.payloads?.[0]?.text ?? "Task completed.";
      } else {
        // Fallback: echo-style placeholder when no runtime is available
        responseText = `Processed: ${input.slice(0, 200)}`;
      }
    } catch (execErr: unknown) {
      const errMsg =
        execErr instanceof Error ? execErr.message : String(execErr);
      taskManager.updateStatus(
        taskId,
        "failed",
        agentOutputToA2AMessage(`Error: ${errMsg}`),
      );
      return;
    }

    // Add response artifacts
    const artifacts = agentOutputToA2AArtifacts(responseText);
    for (const artifact of artifacts) {
      taskManager.addArtifact(taskId, artifact);
    }

    // Mark completed with the response message
    taskManager.updateStatus(
      taskId,
      "completed",
      agentOutputToA2AMessage(responseText),
    );
  } catch (err: unknown) {
    try {
      const errMsg = err instanceof Error ? err.message : String(err);
      taskManager.updateStatus(
        taskId,
        "failed",
        agentOutputToA2AMessage(`Internal error: ${errMsg}`),
      );
    } catch {
      /* task may already be in terminal state */
    }
  }
}

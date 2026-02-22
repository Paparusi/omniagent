/**
 * Google A2A (Agent-to-Agent) Protocol v0.2 — TypeScript type definitions.
 *
 * Implements the open standard for AI agent interoperability.
 * Spec: https://a2a-protocol.org/latest/specification/
 */

// ── Agent Card ──────────────────────────────────────────────────

export interface A2AAgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: A2ACapabilities;
  skills: A2ASkill[];
  authentication?: A2AAuthentication;
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
  provider?: A2AProvider;
  documentationUrl?: string;
}

export interface A2AProvider {
  organization: string;
  url?: string;
}

export interface A2ACapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
  stateTransitionHistory?: boolean;
}

export interface A2ASkill {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
}

export interface A2AAuthentication {
  schemes: A2AAuthScheme[];
}

export interface A2AAuthScheme {
  scheme: "bearer" | "apiKey" | "oauth2";
  in?: "header" | "query";
  name?: string;
  flows?: Record<string, unknown>;
}

// ── Tasks ───────────────────────────────────────────────────────

export type A2ATaskState =
  | "submitted"
  | "working"
  | "input-required"
  | "completed"
  | "failed"
  | "canceled";

export interface A2ATask {
  id: string;
  sessionId?: string;
  status: A2ATaskStatus;
  artifacts?: A2AArtifact[];
  history?: A2AMessage[];
  metadata?: Record<string, unknown>;
}

export interface A2ATaskStatus {
  state: A2ATaskState;
  message?: A2AMessage;
  timestamp?: string;
}

// ── Messages ────────────────────────────────────────────────────

export interface A2AMessage {
  role: "user" | "agent";
  parts: A2APart[];
  metadata?: Record<string, unknown>;
}

export type A2APart = A2ATextPart | A2AFilePart | A2ADataPart;

export interface A2ATextPart {
  type: "text";
  text: string;
  metadata?: Record<string, unknown>;
}

export interface A2AFilePart {
  type: "file";
  file: A2AFileContent;
  metadata?: Record<string, unknown>;
}

export interface A2AFileContent {
  name?: string;
  mimeType?: string;
  bytes?: string; // base64
  uri?: string;
}

export interface A2ADataPart {
  type: "data";
  data: Record<string, unknown> | unknown[];
  metadata?: Record<string, unknown>;
}

// ── Artifacts ───────────────────────────────────────────────────

export interface A2AArtifact {
  name?: string;
  description?: string;
  parts: A2APart[];
  index?: number;
  append?: boolean;
  lastChunk?: boolean;
  metadata?: Record<string, unknown>;
}

// ── JSON-RPC 2.0 ────────────────────────────────────────────────

export interface A2AJsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface A2AJsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: A2AJsonRpcError;
}

export interface A2AJsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// ── Push Notifications ──────────────────────────────────────────

export interface A2APushNotificationConfig {
  id?: string;
  url: string;
  token?: string;
  authentication?: A2AAuthentication;
}

// ── Streaming Events ────────────────────────────────────────────

export interface A2ATaskStatusUpdateEvent {
  type: "task-status-update";
  taskId: string;
  status: A2ATaskStatus;
  final: boolean;
}

export interface A2ATaskArtifactUpdateEvent {
  type: "task-artifact-update";
  taskId: string;
  artifact: A2AArtifact;
}

export type A2AStreamEvent =
  | A2ATaskStatusUpdateEvent
  | A2ATaskArtifactUpdateEvent;

// ── Method Parameters ───────────────────────────────────────────

export interface A2ASendMessageParams {
  message: A2AMessage;
  configuration?: {
    acceptedOutputModes?: string[];
    pushNotificationConfig?: A2APushNotificationConfig;
    historyLength?: number;
    blocking?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface A2AGetTaskParams {
  id: string;
  historyLength?: number;
}

export interface A2ACancelTaskParams {
  id: string;
}

"use client";

/**
 * React hook for the OmniAgent gateway WebSocket connection.
 *
 * Manages connection lifecycle, agent streaming events, and chat message
 * state so consuming components can focus on rendering.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  GatewayClient,
  getGateway,
  type ConnectionState,
  type AgentEventPayload,
  type AgentIdentity,
} from "@/lib/gateway";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToolCall {
  name: string;
  arguments: unknown;
  result?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  thinking?: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
  runId?: string;
}

export interface UseGatewayReturn {
  /** Current WebSocket connection state. */
  state: ConnectionState;
  /** Ordered list of chat messages. */
  messages: ChatMessage[];
  /** Whether the agent is currently generating a response. */
  isAgentTyping: boolean;
  /** Send a user message to the agent. */
  sendMessage: (
    text: string,
    opts?: { agentId?: string; sessionKey?: string; thinking?: boolean }
  ) => Promise<void>;
  /** Clear all messages from local state. */
  clearMessages: () => void;
  /** The underlying gateway client instance (escape hatch). */
  gateway: GatewayClient | null;
  /** Agent identity, fetched once on connect. */
  agentIdentity: AgentIdentity | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateMessageId(): string {
  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGateway(): UseGatewayReturn {
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [agentIdentity, setAgentIdentity] = useState<AgentIdentity | null>(null);

  const gatewayRef = useRef<GatewayClient | null>(null);

  // We use a ref for the streaming message map so updates don't cause extra
  // re-renders; only the final setMessages calls trigger renders.
  const activeStreamsRef = useRef<
    Map<string, { messageId: string; content: string; thinking: string; toolCalls: ToolCall[] }>
  >(new Map());

  // -----------------------------------------------------------------------
  // Connection lifecycle
  // -----------------------------------------------------------------------

  useEffect(() => {
    const gw = getGateway();
    gatewayRef.current = gw;

    // --- State listener ---
    const unsubState = gw.onStateChange((next) => {
      setState(next);

      // Fetch identity once connected
      if (next === "connected") {
        gw.getAgentIdentity().then(setAgentIdentity).catch((err) => {
          console.warn("[useGateway] Failed to fetch agent identity:", err);
        });
      }
    });

    // --- Agent event listener ---
    const unsubAgent = gw.on("agent", (raw: unknown) => {
      const payload = raw as AgentEventPayload;
      if (!payload || !payload.runId) return;

      const { runId, stream, data } = payload;
      let entry = activeStreamsRef.current.get(runId);

      // First event for this run: create a new streaming message
      if (!entry) {
        const messageId = generateMessageId();
        entry = { messageId, content: "", thinking: "", toolCalls: [] };
        activeStreamsRef.current.set(runId, entry);
        setIsAgentTyping(true);

        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            role: "agent",
            content: "",
            thinking: "",
            timestamp: Date.now(),
            toolCalls: [],
            isStreaming: true,
            runId,
          },
        ]);
      }

      // Accumulate stream data
      switch (stream) {
        case "text": {
          entry.content += typeof data === "string" ? data : String(data ?? "");
          break;
        }
        case "thinking": {
          entry.thinking += typeof data === "string" ? data : String(data ?? "");
          break;
        }
        case "tool_call": {
          if (data && typeof data === "object") {
            const tc = data as Record<string, unknown>;
            entry.toolCalls.push({
              name: (tc.name as string) || "unknown",
              arguments: tc.arguments,
              result: tc.result as string | undefined,
            });
          }
          break;
        }
        default:
          break;
      }

      // Snapshot the entry for the closure
      const snapshot = { ...entry };

      setMessages((prev) =>
        prev.map((m) =>
          m.id === snapshot.messageId
            ? {
                ...m,
                content: snapshot.content,
                thinking: snapshot.thinking,
                toolCalls: [...snapshot.toolCalls],
              }
            : m
        )
      );
    });

    // --- Chat event listener (for message completion / external messages) ---
    const unsubChat = gw.on("chat", (raw: unknown) => {
      const payload = raw as Record<string, unknown> | undefined;
      if (!payload) return;

      const runId = payload.runId as string | undefined;

      // If this signals completion of a streaming run, finalise it
      if (runId && activeStreamsRef.current.has(runId)) {
        const entry = activeStreamsRef.current.get(runId)!;
        activeStreamsRef.current.delete(runId);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === entry.messageId
              ? { ...m, isStreaming: false }
              : m
          )
        );

        // If no more active streams, agent is done typing
        if (activeStreamsRef.current.size === 0) {
          setIsAgentTyping(false);
        }
        return;
      }

      // Otherwise treat it as a standalone chat message (e.g. system notice)
      if (payload.message && typeof payload.message === "string") {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            role: (payload.role as "user" | "agent") || "agent",
            content: payload.message as string,
            timestamp: Date.now(),
          },
        ]);
      }
    });

    // --- Connect ---
    gw.connect();

    // --- Cleanup ---
    return () => {
      unsubState();
      unsubAgent();
      unsubChat();
    };
  }, []);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const sendMessage = useCallback(
    async (
      text: string,
      opts?: { agentId?: string; sessionKey?: string; thinking?: boolean }
    ): Promise<void> => {
      const gw = gatewayRef.current;
      if (!gw) {
        console.error("[useGateway] Gateway not initialised");
        return;
      }

      if (gw.connectionState !== "connected") {
        console.error("[useGateway] Gateway not connected");
        return;
      }

      // Optimistically add the user message to state
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        await gw.sendMessage(text, {
          agentId: opts?.agentId,
          sessionKey: opts?.sessionKey,
          thinking: opts?.thinking,
        });
      } catch (err) {
        console.error("[useGateway] Failed to send message:", err);

        // Append an error message from the "agent" so the user sees feedback
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            role: "agent",
            content:
              err instanceof Error
                ? `Error: ${err.message}`
                : "An unknown error occurred while sending the message.",
            timestamp: Date.now(),
          },
        ]);
      }
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    activeStreamsRef.current.clear();
    setIsAgentTyping(false);
  }, []);

  // -----------------------------------------------------------------------
  // Return value
  // -----------------------------------------------------------------------

  return {
    state,
    messages,
    isAgentTyping,
    sendMessage,
    clearMessages,
    gateway: gatewayRef.current,
    agentIdentity,
  };
}

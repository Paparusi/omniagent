"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./message-bubble";
import { StreamingText } from "./streaming-text";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToolCall {
  name: string;
  arguments: unknown;
  result?: string;
  status?: "running" | "complete" | "error";
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MessageListProps {
  messages: ChatMessage[];
  isAgentTyping: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageList({ messages, isAgentTyping }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom whenever messages change or agent starts typing
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAgentTyping]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6",
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-dark-border",
        "scroll-smooth"
      )}
    >
      {messages.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-text-secondary">
              No messages yet
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Start a conversation to get going.
            </p>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isAgentTyping && (
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "rounded-xl border border-dark-border bg-dark-card px-4 py-3",
              "max-w-[75%]"
            )}
          >
            <StreamingText />
          </div>
        </div>
      )}

      {/* Invisible anchor for auto-scrolling */}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}

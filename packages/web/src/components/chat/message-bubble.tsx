"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ToolCard } from "./tool-card";
import type { ChatMessage } from "./message-list";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Very lightweight markdown-ish renderer.
 * Supports: **bold**, `inline code`, ```code blocks```, and unordered lists.
 */
function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = text.split("\n");

  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let key = 0;

  for (const line of lines) {
    // Toggle fenced code blocks
    if (line.trimStart().startsWith("```")) {
      if (inCodeBlock) {
        nodes.push(
          <pre
            key={key++}
            className="my-2 overflow-x-auto rounded-lg border border-dark-border bg-dark-bg p-3 font-mono text-xs leading-relaxed text-text-primary"
          >
            <code>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Unordered list items
    if (/^\s*[-*]\s+/.test(line)) {
      const content = line.replace(/^\s*[-*]\s+/, "");
      nodes.push(
        <li
          key={key++}
          className="ml-4 list-disc text-sm leading-relaxed text-text-primary"
        >
          {renderInline(content)}
        </li>
      );
      continue;
    }

    // Blank lines become spacers
    if (line.trim() === "") {
      nodes.push(<div key={key++} className="h-2" />);
      continue;
    }

    // Regular paragraph
    nodes.push(
      <p key={key++} className="text-sm leading-relaxed text-text-primary">
        {renderInline(line)}
      </p>
    );
  }

  // Flush dangling code block
  if (inCodeBlock && codeBuffer.length > 0) {
    nodes.push(
      <pre
        key={key++}
        className="my-2 overflow-x-auto rounded-lg border border-dark-border bg-dark-bg p-3 font-mono text-xs leading-relaxed text-text-primary"
      >
        <code>{codeBuffer.join("\n")}</code>
      </pre>
    );
  }

  return nodes;
}

/** Inline markdown: **bold** and `code` */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match **bold** or `code`
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // Bold
      parts.push(
        <strong key={key++} className="font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Inline code
      parts.push(
        <code
          key={key++}
          className="rounded bg-dark-bg px-1.5 py-0.5 font-mono text-xs text-accent-blue"
        >
          {match[3]}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: ChatMessage;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const renderedContent = useMemo(() => {
    if (isUser) return null;
    return renderMarkdown(message.content);
  }, [message.content, isUser]);

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "group relative max-w-[75%] rounded-xl px-4 py-3",
          isUser
            ? "border-l-2 border-accent-blue bg-accent-blue/10"
            : "border border-dark-border bg-dark-card"
        )}
      >
        {/* Message content */}
        <div className="space-y-1">
          {isUser ? (
            <p className="text-sm leading-relaxed text-text-primary">
              {message.content}
            </p>
          ) : (
            renderedContent
          )}
        </div>

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.toolCalls.map((tc, idx) => (
              <ToolCard key={`${message.id}-tool-${idx}`} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p
          className={cn(
            "mt-2 text-[11px] text-text-muted",
            isUser ? "text-right" : "text-left"
          )}
        >
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

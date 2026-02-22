"use client";

import { useState, useCallback } from "react";
import { ChevronDown, Wrench, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ToolCardProps {
  toolCall: {
    name: string;
    arguments: unknown;
    result?: string;
    status?: "running" | "complete" | "error";
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ToolCard({ toolCall }: ToolCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggle = useCallback(() => setIsExpanded((prev) => !prev), []);

  const statusIcon = (() => {
    switch (toolCall.status) {
      case "running":
        return <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-blue" />;
      case "complete":
        return <CheckCircle2 className="h-3.5 w-3.5 text-accent-green" />;
      case "error":
        return <XCircle className="h-3.5 w-3.5 text-red-400" />;
      default:
        return <CheckCircle2 className="h-3.5 w-3.5 text-text-muted" />;
    }
  })();

  const formattedArgs = (() => {
    try {
      if (typeof toolCall.arguments === "string") {
        return JSON.stringify(JSON.parse(toolCall.arguments), null, 2);
      }
      return JSON.stringify(toolCall.arguments, null, 2);
    } catch {
      return String(toolCall.arguments);
    }
  })();

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-dark-border bg-dark-card",
        "transition-colors duration-150"
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex w-full items-center gap-2.5 px-3 py-2.5 text-left",
          "transition-colors duration-150 hover:bg-dark-hover"
        )}
      >
        <Wrench className="h-3.5 w-3.5 shrink-0 text-accent-purple" />
        <span className="flex-1 truncate text-xs font-medium text-text-primary">
          {toolCall.name}
        </span>
        {statusIcon}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-text-muted transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Body */}
      {isExpanded && (
        <div className="border-t border-dark-border px-3 py-3 space-y-3">
          {/* Arguments */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Arguments
            </p>
            <pre
              className={cn(
                "overflow-x-auto rounded-md border border-dark-border bg-dark-bg p-2.5",
                "font-mono text-[11px] leading-relaxed text-text-secondary"
              )}
            >
              <code>{formattedArgs}</code>
            </pre>
          </div>

          {/* Result */}
          {toolCall.result !== undefined && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Result
              </p>
              <pre
                className={cn(
                  "overflow-x-auto rounded-md border border-dark-border bg-dark-bg p-2.5",
                  "font-mono text-[11px] leading-relaxed text-text-secondary"
                )}
              >
                <code>{toolCall.result}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

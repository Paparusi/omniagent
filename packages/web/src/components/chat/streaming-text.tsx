"use client";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StreamingText() {
  return (
    <div className="flex items-center gap-1.5 py-0.5" aria-label="Agent is typing">
      <span
        className={cn(
          "h-2 w-2 rounded-full bg-text-muted",
          "animate-pulse"
        )}
        style={{ animationDelay: "0ms", animationDuration: "1.2s" }}
      />
      <span
        className={cn(
          "h-2 w-2 rounded-full bg-text-muted",
          "animate-pulse"
        )}
        style={{ animationDelay: "200ms", animationDuration: "1.2s" }}
      />
      <span
        className={cn(
          "h-2 w-2 rounded-full bg-text-muted",
          "animate-pulse"
        )}
        style={{ animationDelay: "400ms", animationDuration: "1.2s" }}
      />
    </div>
  );
}

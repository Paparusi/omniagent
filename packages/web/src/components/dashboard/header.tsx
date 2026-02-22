"use client";

import { Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface HeaderProps {
  title: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Header({ title, description }: HeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between border-b border-dark-border bg-dark-bg px-6 py-4"
      )}
    >
      {/* Left: Title & description */}
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-text-primary">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 truncate text-sm text-text-secondary">
            {description}
          </p>
        )}
      </div>

      {/* Right: Action icons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Notifications"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            "text-text-muted transition-colors duration-150",
            "hover:bg-dark-hover hover:text-text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
          )}
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          aria-label="Settings"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            "text-text-muted transition-colors duration-150",
            "hover:bg-dark-hover hover:text-text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
          )}
        >
          <Settings className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}

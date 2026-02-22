"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  MessageSquare,
  Users,
  Store,
  ShieldCheck,
  CreditCard,
  Network,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

const navItems = [
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Agents", href: "/agents", icon: Users },
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Vault", href: "/vault", icon: ShieldCheck },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Network", href: "/network", icon: Network },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SidebarProps {
  connectionState?: "connected" | "connecting" | "disconnected";
}

// ---------------------------------------------------------------------------
// Connection status badge
// ---------------------------------------------------------------------------

function ConnectionBadge({
  state,
}: {
  state: "connected" | "connecting" | "disconnected";
}) {
  const label =
    state === "connected"
      ? "Connected"
      : state === "connecting"
        ? "Connecting"
        : "Disconnected";

  const dotColor =
    state === "connected"
      ? "bg-accent-green"
      : state === "connecting"
        ? "bg-yellow-400"
        : "bg-red-400";

  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          dotColor,
          state === "connecting" && "animate-pulse"
        )}
      />
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Sidebar({ connectionState = "disconnected" }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobile = useCallback(() => setIsMobileOpen((p) => !p), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={toggleMobile}
        aria-label="Toggle navigation"
        className={cn(
          "fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg",
          "border border-dark-border bg-dark-card text-text-primary",
          "transition-colors hover:bg-dark-hover",
          "lg:hidden"
        )}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Backdrop overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-dark-border bg-dark-bg",
          "transition-transform duration-300 ease-in-out",
          "lg:static lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-dark-border px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue/15">
            <Bot className="h-5 w-5 text-accent-blue" />
          </div>
          <span className="text-lg font-bold tracking-tight text-text-primary">
            OmniAgent
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              pathname === href || pathname?.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobile}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  "transition-colors duration-150",
                  isActive
                    ? "bg-accent-blue/10 text-accent-blue"
                    : "text-text-secondary hover:bg-dark-hover hover:text-text-primary"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    isActive
                      ? "text-accent-blue"
                      : "text-text-muted group-hover:text-text-primary"
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Connection status */}
        <div className="border-t border-dark-border px-2 py-3">
          <ConnectionBadge state={connectionState} />
        </div>
      </aside>
    </>
  );
}

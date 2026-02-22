"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Bot,
  Store,
  Shield,
  Wallet,
  Globe,
  Settings,
  Cpu,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/vault", label: "Vault", icon: Shield },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/network", label: "Network", icon: Globe },
  { href: "/settings", label: "Settings", icon: Settings },
];

function getPageTitle(pathname: string): string {
  const item = navItems.find((nav) => pathname.startsWith(nav.href));
  return item?.label ?? "Dashboard";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connected, setConnected] = useState(true);

  // Simulate connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setConnected(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 animate-backdrop-in lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-dark-border bg-dark-card transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-dark-border px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Cpu className="h-6 w-6 text-accent-blue" />
            <span className="text-lg font-bold text-text-primary">
              OmniAgent
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-text-muted hover:text-text-primary lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-accent-blue/10 text-accent-blue"
                        : "text-text-secondary hover:bg-dark-hover hover:text-text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Connection Status */}
        <div className="border-t border-dark-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              {connected && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
              )}
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  connected ? "bg-accent-green" : "bg-text-muted"
                }`}
              />
            </span>
            <span className="text-xs text-text-muted">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-dark-border bg-dark-card/50 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-text-muted hover:text-text-primary lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-text-primary">
              {getPageTitle(pathname)}
            </h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

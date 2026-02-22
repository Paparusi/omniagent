"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Store,
  Shield,
  Wallet,
  ArrowRight,
  Github,
  Cpu,
  Network,
  Terminal,
  Sparkles,
  ChevronRight,
} from "lucide-react";

function useAnimateOnMount(delay: number = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return visible;
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  delay: number;
}) {
  const visible = useAnimateOnMount(delay);
  const colorMap: Record<string, string> = {
    blue: "text-accent-blue border-accent-blue/20 bg-accent-blue/5",
    green: "text-accent-green border-accent-green/20 bg-accent-green/5",
    purple: "text-accent-purple border-accent-purple/20 bg-accent-purple/5",
  };
  const iconColorMap: Record<string, string> = {
    blue: "text-accent-blue",
    green: "text-accent-green",
    purple: "text-accent-purple",
  };

  return (
    <div
      className={`rounded-xl border border-dark-border bg-dark-card p-6 transition-all duration-500 hover:border-dark-hover hover:shadow-lg ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div
        className={`mb-4 inline-flex rounded-lg border p-3 ${colorMap[color]}`}
      >
        <Icon className={`h-6 w-6 ${iconColorMap[color]}`} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
    </div>
  );
}

export default function LandingPage() {
  const heroVisible = useAnimateOnMount(100);
  const subtitleVisible = useAnimateOnMount(250);
  const ctaVisible = useAnimateOnMount(400);
  const a2aVisible = useAnimateOnMount(700);
  const codeVisible = useAnimateOnMount(900);

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-dark-border bg-dark-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-6 w-6 text-accent-blue" />
            <span className="text-lg font-bold text-text-primary">
              OmniAgent
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/omniagent"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary transition-colors hover:text-text-primary"
            >
              <Github className="h-5 w-5" />
            </a>
            <Link
              href="/chat"
              className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24 md:pt-32">
        {/* Background gradient effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-accent-blue/5 blur-3xl" />
          <div className="absolute right-1/4 top-20 h-96 w-96 rounded-full bg-accent-purple/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <h1
            className={`mb-6 text-5xl font-extrabold leading-tight tracking-tight transition-all duration-700 md:text-7xl ${
              heroVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-6 opacity-0"
            }`}
          >
            <span className="bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
              OmniAgent
            </span>
          </h1>
          <p
            className={`mx-auto mb-8 max-w-2xl text-lg text-text-secondary transition-all duration-700 md:text-xl ${
              subtitleVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-6 opacity-0"
            }`}
          >
            The AI Agent Platform with Built-in Economy. Deploy autonomous
            agents, discover tools in the marketplace, and transact
            seamlessly with USDC-powered payments.
          </p>
          <div
            className={`flex items-center justify-center gap-4 transition-all duration-700 ${
              ctaVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-6 opacity-0"
            }`}
          >
            <Link
              href="/chat"
              className="group inline-flex items-center gap-2 rounded-lg bg-accent-blue px-6 py-3 font-medium text-white transition-all hover:bg-accent-blue/90 hover:shadow-lg hover:shadow-accent-blue/20"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="https://github.com/omniagent"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-dark-border px-6 py-3 font-medium text-text-secondary transition-all hover:border-text-muted hover:text-text-primary"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-text-primary">
              Core Modules
            </h2>
            <p className="text-text-secondary">
              Everything you need to build, deploy, and monetize AI agents
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={Store}
              title="AgentForge"
              description="A decentralized marketplace for AI tools and capabilities. Discover, publish, and monetize agent skills with built-in trust scoring and micro-payments."
              color="blue"
              delay={500}
            />
            <FeatureCard
              icon={Shield}
              title="PassBox"
              description="End-to-end encrypted vault for managing secrets, API keys, and credentials. Zero-knowledge architecture ensures only you and your agents have access."
              color="green"
              delay={600}
            />
            <FeatureCard
              icon={Wallet}
              title="APay"
              description="USDC-powered payment rails for agent-to-agent transactions. Escrow protection, automated payouts, and transparent on-chain settlement."
              color="purple"
              delay={700}
            />
          </div>
        </div>
      </section>

      {/* A2A Protocol Section */}
      <section className="border-y border-dark-border bg-dark-card/50 px-6 py-20">
        <div
          className={`mx-auto max-w-5xl transition-all duration-700 ${
            a2aVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-blue/20 bg-accent-blue/5 px-3 py-1 text-sm text-accent-blue">
                <Network className="h-4 w-4" />
                A2A Protocol
              </div>
              <h2 className="mb-4 text-3xl font-bold text-text-primary">
                Agent-to-Agent Interoperability
              </h2>
              <p className="mb-6 text-text-secondary leading-relaxed">
                Built on the open A2A protocol, OmniAgent enables seamless
                communication between agents across different platforms. Delegate
                tasks, share capabilities, and compose complex workflows through
                standardized agent cards and task management.
              </p>
              <ul className="space-y-3">
                {[
                  "Discover remote agents via Agent Cards",
                  "Delegate and compose multi-agent workflows",
                  "Standardized task lifecycle management",
                  "Cross-platform agent interoperability",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-text-secondary"
                  >
                    <ChevronRight className="h-4 w-4 text-accent-green" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-dark-border bg-dark-bg p-6">
              <div className="mb-4 flex items-center gap-2 text-sm text-text-muted">
                <Sparkles className="h-4 w-4" />
                Agent Card Schema
              </div>
              <pre className="overflow-x-auto font-mono text-sm leading-relaxed">
                <code className="text-text-secondary">
{`{
  "name": "OmniAgent",
  "url": "https://agent.omni.org",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true
  },
  "skills": [
    {
      "id": "code-gen",
      "name": "Code Generation"
    },
    {
      "id": "data-analysis",
      "name": "Data Analysis"
    }
  ]
}`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="px-6 py-20">
        <div
          className={`mx-auto max-w-3xl text-center transition-all duration-700 ${
            codeVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <h2 className="mb-3 text-3xl font-bold text-text-primary">
            Get Started in Seconds
          </h2>
          <p className="mb-8 text-text-secondary">
            Install the CLI and onboard your first agent with a single command
          </p>
          <div className="rounded-xl border border-dark-border bg-dark-card p-6">
            <div className="mb-3 flex items-center gap-2 text-sm text-text-muted">
              <Terminal className="h-4 w-4" />
              Terminal
            </div>
            <div className="rounded-lg bg-dark-bg p-4 text-left font-mono">
              <div className="flex items-center gap-2">
                <span className="text-accent-green">$</span>
                <span className="text-text-primary">
                  npm install -g omniorg && omniagent onboard
                </span>
              </div>
              <div className="mt-3 text-text-muted">
                <div>Installing omniorg@latest...</div>
                <div className="text-accent-green">
                  + omniorg@1.0.0 installed
                </div>
                <div className="mt-1">
                  Initializing OmniAgent environment...
                </div>
                <div className="text-accent-blue">
                  Agent onboarded successfully! Open http://localhost:3000
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-border px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-accent-blue" />
            <span className="font-semibold text-text-primary">OmniAgent</span>
            <span className="text-text-muted">
              &middot; The AI Agent Platform
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/omniagent"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <span className="text-text-muted text-sm">
              &copy; {new Date().getFullYear()} OmniOrg
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

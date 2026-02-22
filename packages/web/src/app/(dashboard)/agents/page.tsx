"use client";

import { useState } from "react";
import {
  Bot,
  Settings,
  Zap,
  Star,
  MoreVertical,
  Plus,
  Search,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  model: string;
  status: "online" | "offline";
  skillsCount: number;
  description: string;
  isDefault: boolean;
  lastActive: string;
}

const mockAgents: Agent[] = [
  {
    id: "agent-1",
    name: "OmniAgent Prime",
    emoji: "🤖",
    model: "gpt-4o",
    status: "online",
    skillsCount: 12,
    description:
      "Primary general-purpose agent with full platform access and tool orchestration capabilities.",
    isDefault: true,
    lastActive: "Active now",
  },
  {
    id: "agent-2",
    name: "CodeReviewer",
    emoji: "🔍",
    model: "claude-3.5-sonnet",
    status: "online",
    skillsCount: 5,
    description:
      "Specialized code review agent. Analyzes PRs, suggests improvements, and enforces coding standards.",
    isDefault: false,
    lastActive: "2 min ago",
  },
  {
    id: "agent-3",
    name: "DataPipeline",
    emoji: "📊",
    model: "gpt-4o-mini",
    status: "offline",
    skillsCount: 8,
    description:
      "Data processing and ETL agent. Handles structured data transformation and analysis workflows.",
    isDefault: false,
    lastActive: "3 hours ago",
  },
  {
    id: "agent-4",
    name: "SecurityScanner",
    emoji: "🛡️",
    model: "claude-3.5-sonnet",
    status: "online",
    skillsCount: 6,
    description:
      "Security-focused agent that scans for vulnerabilities, manages secrets rotation, and audits access.",
    isDefault: false,
    lastActive: "5 min ago",
  },
  {
    id: "agent-5",
    name: "ContentWriter",
    emoji: "✍️",
    model: "gpt-4o",
    status: "offline",
    skillsCount: 4,
    description:
      "Content generation agent for documentation, blog posts, and marketing copy.",
    isDefault: false,
    lastActive: "1 day ago",
  },
];

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div
      className={`group relative rounded-xl border bg-dark-card p-5 transition-all hover:shadow-lg ${
        agent.isDefault
          ? "border-accent-blue/30 shadow-sm shadow-accent-blue/5"
          : "border-dark-border hover:border-dark-hover"
      }`}
    >
      {/* Default badge */}
      {agent.isDefault && (
        <div className="absolute -top-2.5 left-4 rounded-full bg-accent-blue px-2.5 py-0.5 text-xs font-medium text-white">
          Default
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-dark-bg text-xl">
            {agent.emoji}
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{agent.name}</h3>
            <p className="text-xs text-text-muted">{agent.model}</p>
          </div>
        </div>
        <button className="rounded-lg p-1.5 text-text-muted opacity-0 transition-all hover:bg-dark-bg hover:text-text-secondary group-hover:opacity-100">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Description */}
      <p className="mb-4 text-sm leading-relaxed text-text-secondary line-clamp-2">
        {agent.description}
      </p>

      {/* Stats row */}
      <div className="mb-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {agent.status === "online" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                agent.status === "online" ? "bg-accent-green" : "bg-text-muted"
              }`}
            />
          </span>
          <span
            className={
              agent.status === "online" ? "text-accent-green" : "text-text-muted"
            }
          >
            {agent.status === "online" ? "Online" : "Offline"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-text-muted">
          <Zap className="h-3.5 w-3.5" />
          {agent.skillsCount} skills
        </div>
        <div className="text-text-muted">{agent.lastActive}</div>
      </div>

      {/* Action */}
      <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-sm font-medium text-text-secondary transition-all hover:border-accent-blue/30 hover:text-accent-blue">
        <Settings className="h-4 w-4" />
        Configure
      </button>
    </div>
  );
}

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = mockAgents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Agents</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Manage your AI agents, configure models, and monitor their status.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90">
            <Plus className="h-4 w-4" />
            Create Agent
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents..."
            className="w-full rounded-xl border border-dark-border bg-dark-card py-3 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-blue/50"
          />
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-dark-border bg-dark-card p-4">
            <p className="text-sm text-text-muted">Total Agents</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">
              {mockAgents.length}
            </p>
          </div>
          <div className="rounded-xl border border-dark-border bg-dark-card p-4">
            <p className="text-sm text-text-muted">Online</p>
            <p className="mt-1 text-2xl font-bold text-accent-green">
              {mockAgents.filter((a) => a.status === "online").length}
            </p>
          </div>
          <div className="rounded-xl border border-dark-border bg-dark-card p-4">
            <p className="text-sm text-text-muted">Total Skills</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">
              {mockAgents.reduce((sum, a) => sum + a.skillsCount, 0)}
            </p>
          </div>
          <div className="rounded-xl border border-dark-border bg-dark-card p-4">
            <p className="text-sm text-text-muted">Default Agent</p>
            <p className="mt-1 text-lg font-bold text-accent-blue">
              {mockAgents.find((a) => a.isDefault)?.name ?? "None"}
            </p>
          </div>
        </div>

        {/* Agent Grid */}
        {filteredAgents.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dark-border bg-dark-card py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-dark-bg">
              <Bot className="h-8 w-8 text-text-muted" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-text-primary">
              No agents found
            </h3>
            <p className="mb-6 max-w-sm text-sm text-text-secondary">
              {searchQuery
                ? `No agents matching "${searchQuery}". Try a different search term.`
                : "You haven't created any agents yet. Get started by creating your first agent."}
            </p>
            <button className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90">
              <Plus className="h-4 w-4" />
              Create Agent
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Globe,
  Search,
  Plus,
  ExternalLink,
  Wifi,
  WifiOff,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Tag,
  Server,
} from "lucide-react";

interface RemoteAgent {
  id: string;
  name: string;
  url: string;
  description: string;
  skills: string[];
  status: "online" | "offline";
  lastSeen: string;
}

interface Task {
  id: string;
  taskId: string;
  agentName: string;
  status: "submitted" | "working" | "completed" | "failed";
  timestamp: string;
  timestampRelative: string;
  description: string;
}

const mockAgents: RemoteAgent[] = [
  {
    id: "ra-1",
    name: "ResearchBot",
    url: "https://research.agents.io/.well-known/agent.json",
    description:
      "Specialized in academic research, paper summarization, and literature reviews. Supports streaming responses.",
    skills: ["research", "summarization", "citation-extraction"],
    status: "online",
    lastSeen: "Active now",
  },
  {
    id: "ra-2",
    name: "DeployAgent",
    url: "https://deploy.cloud-ops.dev/.well-known/agent.json",
    description:
      "Handles CI/CD pipeline management, container orchestration, and infrastructure provisioning.",
    skills: ["deployment", "docker", "kubernetes", "terraform"],
    status: "online",
    lastSeen: "1 min ago",
  },
  {
    id: "ra-3",
    name: "LegalReviewer",
    url: "https://legal.complianceai.com/.well-known/agent.json",
    description:
      "Reviews contracts, terms of service, and compliance documents. Flags potential legal risks.",
    skills: ["contract-review", "compliance", "risk-assessment"],
    status: "offline",
    lastSeen: "3 hours ago",
  },
  {
    id: "ra-4",
    name: "TranslationHub",
    url: "https://translate.polyglot.ai/.well-known/agent.json",
    description:
      "Multi-language translation with domain-specific terminology support. Handles 100+ language pairs.",
    skills: ["translation", "localization", "terminology"],
    status: "online",
    lastSeen: "Active now",
  },
];

const mockTasks: Task[] = [
  {
    id: "task-1",
    taskId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    agentName: "ResearchBot",
    status: "completed",
    timestamp: "2025-01-15T14:00:00Z",
    timestampRelative: "2 hours ago",
    description: "Summarize latest papers on multi-agent systems",
  },
  {
    id: "task-2",
    taskId: "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
    agentName: "DeployAgent",
    status: "working",
    timestamp: "2025-01-15T15:30:00Z",
    timestampRelative: "30 min ago",
    description: "Deploy staging environment for v2.1.0",
  },
  {
    id: "task-3",
    taskId: "11223344-5566-7788-99aa-bbccddeeff00",
    agentName: "LegalReviewer",
    status: "failed",
    timestamp: "2025-01-14T10:15:00Z",
    timestampRelative: "1 day ago",
    description: "Review updated Terms of Service document",
  },
  {
    id: "task-4",
    taskId: "aabbccdd-eeff-0011-2233-445566778899",
    agentName: "TranslationHub",
    status: "submitted",
    timestamp: "2025-01-15T16:00:00Z",
    timestampRelative: "Just now",
    description: "Translate documentation to Japanese and Korean",
  },
];

const taskStatusConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  submitted: {
    label: "Submitted",
    icon: Clock,
    color: "text-accent-blue bg-accent-blue/10 border-accent-blue/20",
  },
  working: {
    label: "Working",
    icon: Loader2,
    color: "text-accent-orange bg-accent-orange/10 border-accent-orange/20",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-accent-green bg-accent-green/10 border-accent-green/20",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    color: "text-danger bg-danger/10 border-danger/20",
  },
};

function AgentNetworkCard({ agent }: { agent: RemoteAgent }) {
  return (
    <div className="group rounded-xl border border-dark-border bg-dark-card p-5 transition-all hover:border-dark-hover hover:shadow-lg">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-bg">
            <Server className="h-5 w-5 text-text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{agent.name}</h3>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                {agent.status === "online" && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    agent.status === "online"
                      ? "bg-accent-green"
                      : "bg-text-muted"
                  }`}
                />
              </span>
              <span className="text-xs text-text-muted">{agent.lastSeen}</span>
            </div>
          </div>
        </div>
        <a
          href={agent.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-1.5 text-text-muted transition-all hover:bg-dark-bg hover:text-text-secondary"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* URL */}
      <p className="mb-3 truncate font-mono text-xs text-text-muted">
        {agent.url}
      </p>

      {/* Description */}
      <p className="mb-4 text-sm leading-relaxed text-text-secondary line-clamp-2">
        {agent.description}
      </p>

      {/* Skills */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {agent.skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-md border border-dark-border bg-dark-bg px-2 py-0.5 text-xs text-text-muted"
          >
            <Tag className="h-3 w-3" />
            {skill}
          </span>
        ))}
      </div>

      {/* Action */}
      <button
        disabled={agent.status === "offline"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-blue px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-blue/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send className="h-4 w-4" />
        Delegate Task
      </button>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const statusInfo = taskStatusConfig[task.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-dark-border bg-dark-card px-4 py-3 transition-all hover:border-dark-hover">
      {/* Status */}
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${statusInfo.color}`}
      >
        <StatusIcon
          className={`h-4 w-4 ${
            task.status === "working" ? "animate-spin" : ""
          }`}
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-text-primary">
            {task.description}
          </p>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-text-muted">
          <span className="font-mono">
            {task.taskId.substring(0, 8)}...
          </span>
          <span>{task.agentName}</span>
          <span>{task.timestampRelative}</span>
        </div>
      </div>

      {/* Status Badge */}
      <span
        className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}
      >
        {statusInfo.label}
      </span>
    </div>
  );
}

export default function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = mockAgents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.skills.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              A2A Network
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Discover remote agents, delegate tasks, and manage cross-platform
              workflows via the A2A protocol.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90">
            <Plus className="h-4 w-4" />
            Discover Agent
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents by name, description, or skill..."
            className="w-full rounded-xl border border-dark-border bg-dark-card py-3 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-blue/50"
          />
        </div>

        {/* Known Agents */}
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              Known Agents
            </h2>
            <span className="text-sm text-text-muted">
              {filteredAgents.length} agent{filteredAgents.length !== 1 ? "s" : ""}
            </span>
          </div>

          {filteredAgents.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredAgents.map((agent) => (
                <AgentNetworkCard key={agent.id} agent={agent} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dark-border bg-dark-card py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-dark-bg">
                <Globe className="h-7 w-7 text-text-muted" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">
                No remote agents discovered yet
              </h3>
              <p className="mb-6 max-w-sm text-sm text-text-secondary">
                {searchQuery
                  ? `No agents matching "${searchQuery}". Try a different search.`
                  : "Add a remote agent by providing its Agent Card URL to start delegating tasks."}
              </p>
              <button className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90">
                <Plus className="h-4 w-4" />
                Discover Agent
              </button>
            </div>
          )}
        </div>

        {/* Active Tasks */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              Active Tasks
            </h2>
            <span className="text-sm text-text-muted">
              {mockTasks.length} task{mockTasks.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-2.5">
            {mockTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

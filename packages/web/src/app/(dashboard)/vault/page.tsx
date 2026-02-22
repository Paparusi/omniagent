"use client";

import { useState } from "react";
import {
  Shield,
  Lock,
  Plus,
  Key,
  Users,
  Clock,
  MoreVertical,
  Search,
  ShieldCheck,
  Eye,
  EyeOff,
  Folder,
} from "lucide-react";

interface Vault {
  id: string;
  name: string;
  icon: string;
  secretsCount: number;
  membersCount: number;
  lastUpdated: string;
  lastUpdatedRelative: string;
  locked: boolean;
}

const mockVaults: Vault[] = [
  {
    id: "vault-1",
    name: "Production API Keys",
    icon: "🔑",
    secretsCount: 14,
    membersCount: 3,
    lastUpdated: "2025-01-15T10:30:00Z",
    lastUpdatedRelative: "2 hours ago",
    locked: true,
  },
  {
    id: "vault-2",
    name: "Agent Credentials",
    icon: "🤖",
    secretsCount: 8,
    membersCount: 2,
    lastUpdated: "2025-01-14T16:00:00Z",
    lastUpdatedRelative: "1 day ago",
    locked: true,
  },
  {
    id: "vault-3",
    name: "Database Connections",
    icon: "🗄️",
    secretsCount: 5,
    membersCount: 4,
    lastUpdated: "2025-01-13T09:15:00Z",
    lastUpdatedRelative: "2 days ago",
    locked: true,
  },
  {
    id: "vault-4",
    name: "OAuth Tokens",
    icon: "🔐",
    secretsCount: 11,
    membersCount: 2,
    lastUpdated: "2025-01-12T14:45:00Z",
    lastUpdatedRelative: "3 days ago",
    locked: true,
  },
  {
    id: "vault-5",
    name: "Webhook Secrets",
    icon: "🪝",
    secretsCount: 3,
    membersCount: 1,
    lastUpdated: "2025-01-10T08:00:00Z",
    lastUpdatedRelative: "5 days ago",
    locked: true,
  },
];

function VaultCard({ vault }: { vault: Vault }) {
  return (
    <div className="group flex items-center gap-4 rounded-xl border border-dark-border bg-dark-card p-5 transition-all hover:border-dark-hover hover:shadow-lg">
      {/* Icon */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-dark-bg text-2xl">
        {vault.icon}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-text-primary">
            {vault.name}
          </h3>
          <Lock className="h-3.5 w-3.5 flex-shrink-0 text-accent-green" />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-4 text-sm text-text-muted">
          <div className="flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5" />
            {vault.secretsCount} secret{vault.secretsCount !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {vault.membersCount} member{vault.membersCount !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {vault.lastUpdatedRelative}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="rounded-lg p-2 text-text-muted transition-all hover:bg-dark-bg hover:text-text-secondary">
          <Eye className="h-4 w-4" />
        </button>
        <button className="rounded-lg p-2 text-text-muted opacity-0 transition-all hover:bg-dark-bg hover:text-text-secondary group-hover:opacity-100">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function VaultPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showVaults, setShowVaults] = useState(true);

  const filteredVaults = mockVaults.filter((vault) =>
    vault.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSecrets = mockVaults.reduce((sum, v) => sum + v.secretsCount, 0);
  const totalMembers = new Set(mockVaults.flatMap((v) => Array(v.membersCount).fill(0))).size;

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              PassBox Vault
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Securely manage secrets, API keys, and credentials with
              end-to-end encryption.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90">
            <Plus className="h-4 w-4" />
            New Vault
          </button>
        </div>

        {/* E2E Encryption Badge */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-accent-green/20 bg-accent-green/5 px-4 py-3">
          <ShieldCheck className="h-5 w-5 text-accent-green" />
          <div>
            <p className="text-sm font-medium text-accent-green">
              End-to-End Encrypted
            </p>
            <p className="text-xs text-text-muted">
              All vault data is encrypted with AES-256-GCM. Zero-knowledge architecture
              ensures only you and authorized agents can access your secrets.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-dark-border bg-dark-card p-4">
            <p className="text-sm text-text-muted">Total Vaults</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">
              {mockVaults.length}
            </p>
          </div>
          <div className="rounded-xl border border-dark-border bg-dark-card p-4">
            <p className="text-sm text-text-muted">Total Secrets</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">
              {totalSecrets}
            </p>
          </div>
          <div className="rounded-xl border border-dark-border bg-dark-card p-4">
            <p className="text-sm text-text-muted">Encryption</p>
            <p className="mt-1 text-lg font-bold text-accent-green">
              AES-256
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vaults..."
            className="w-full rounded-xl border border-dark-border bg-dark-card py-3 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-blue/50"
          />
        </div>

        {/* Vault List */}
        {filteredVaults.length > 0 ? (
          <div className="space-y-3">
            {filteredVaults.map((vault) => (
              <VaultCard key={vault.id} vault={vault} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dark-border bg-dark-card py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-dark-bg">
              <Lock className="h-8 w-8 text-text-muted" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-text-primary">
              {searchQuery ? "No vaults found" : "No vaults yet"}
            </h3>
            <p className="mb-6 max-w-sm text-sm text-text-secondary">
              {searchQuery
                ? `No vaults matching "${searchQuery}". Try a different search.`
                : "Create your first vault to securely store API keys, tokens, and other credentials."}
            </p>
            <button className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90">
              <Plus className="h-4 w-4" />
              Create Vault
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

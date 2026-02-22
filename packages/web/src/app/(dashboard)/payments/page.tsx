"use client";

import { useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lock,
  Download,
  Upload,
  ExternalLink,
  Filter,
  ChevronDown,
} from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  dateRelative: string;
  type: "payment" | "payout" | "escrow";
  amount: string;
  amountRaw: number;
  status: "completed" | "pending" | "failed";
  counterparty: string;
  description: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "tx-001",
    date: "2025-01-15T14:30:00Z",
    dateRelative: "2 hours ago",
    type: "payment",
    amount: "-$12.50",
    amountRaw: -12.5,
    status: "completed",
    counterparty: "CodeGen Pro",
    description: "Tool execution (625 calls)",
  },
  {
    id: "tx-002",
    date: "2025-01-15T10:00:00Z",
    dateRelative: "6 hours ago",
    type: "payout",
    amount: "+$45.00",
    amountRaw: 45.0,
    status: "completed",
    counterparty: "WebScraper Users",
    description: "Weekly payout for WebScraper tool",
  },
  {
    id: "tx-003",
    date: "2025-01-14T18:45:00Z",
    dateRelative: "1 day ago",
    type: "escrow",
    amount: "-$25.00",
    amountRaw: -25.0,
    status: "pending",
    counterparty: "RemoteAgent-Alpha",
    description: "Escrow for delegated data analysis task",
  },
  {
    id: "tx-004",
    date: "2025-01-14T09:20:00Z",
    dateRelative: "1 day ago",
    type: "payment",
    amount: "-$3.20",
    amountRaw: -3.2,
    status: "completed",
    counterparty: "SentimentDetector",
    description: "Batch sentiment analysis (160 calls)",
  },
  {
    id: "tx-005",
    date: "2025-01-13T15:10:00Z",
    dateRelative: "2 days ago",
    type: "payout",
    amount: "+$120.00",
    amountRaw: 120.0,
    status: "completed",
    counterparty: "Multiple Users",
    description: "Monthly payout for published tools",
  },
];

const typeConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  payment: {
    label: "Payment",
    icon: ArrowUpRight,
    color: "text-red-400 bg-red-400/10",
  },
  payout: {
    label: "Payout",
    icon: ArrowDownLeft,
    color: "text-accent-green bg-accent-green/10",
  },
  escrow: {
    label: "Escrow",
    icon: Lock,
    color: "text-accent-orange bg-accent-orange/10",
  },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  completed: {
    label: "Completed",
    color: "text-accent-green bg-accent-green/10 border-accent-green/20",
  },
  pending: {
    label: "Pending",
    color: "text-accent-orange bg-accent-orange/10 border-accent-orange/20",
  },
  failed: {
    label: "Failed",
    color: "text-danger bg-danger/10 border-danger/20",
  },
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtext,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">{label}</p>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
      {subtext && <p className="mt-1 text-xs text-text-muted">{subtext}</p>}
    </div>
  );
}

export default function PaymentsPage() {
  const [filterType, setFilterType] = useState<string>("all");

  const filteredTransactions = mockTransactions.filter(
    (tx) => filterType === "all" || tx.type === filterType
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              APay Payments
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Manage your USDC balance, track transactions, and handle
              escrow payments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg border border-dark-border bg-dark-card px-4 py-2.5 text-sm font-medium text-text-secondary transition-all hover:border-accent-blue/30 hover:text-accent-blue">
              <Download className="h-4 w-4" />
              Deposit
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-dark-border bg-dark-card px-4 py-2.5 text-sm font-medium text-text-secondary transition-all hover:border-accent-blue/30 hover:text-accent-blue">
              <Upload className="h-4 w-4" />
              Withdraw
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="USDC Balance"
            value="$1,247.50"
            icon={Wallet}
            color="text-accent-blue bg-accent-blue/10"
            subtext="Available to spend"
          />
          <StatCard
            label="Total Earned"
            value="$2,340.00"
            icon={TrendingUp}
            color="text-accent-green bg-accent-green/10"
            subtext="All time"
          />
          <StatCard
            label="Total Spent"
            value="$1,067.50"
            icon={TrendingDown}
            color="text-accent-purple bg-accent-purple/10"
            subtext="All time"
          />
          <StatCard
            label="Pending Escrow"
            value="$25.00"
            icon={Lock}
            color="text-accent-orange bg-accent-orange/10"
            subtext="1 active escrow"
          />
        </div>

        {/* Transaction Table */}
        <div className="rounded-xl border border-dark-border bg-dark-card">
          {/* Table Header */}
          <div className="flex items-center justify-between border-b border-dark-border px-5 py-4">
            <h2 className="font-semibold text-text-primary">
              Recent Transactions
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-muted" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-lg border border-dark-border bg-dark-bg px-3 py-1.5 text-xs text-text-secondary outline-none focus:border-accent-blue/50"
              >
                <option value="all">All Types</option>
                <option value="payment">Payments</option>
                <option value="payout">Payouts</option>
                <option value="escrow">Escrow</option>
              </select>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border text-left text-xs text-text-muted">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Counterparty</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Amount (USDC)
                  </th>
                  <th className="px-5 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filteredTransactions.map((tx) => {
                  const typeInfo = typeConfig[tx.type];
                  const statusInfo = statusConfig[tx.status];
                  const TypeIcon = typeInfo.icon;

                  return (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-dark-hover/30"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm text-text-primary">
                          {tx.dateRelative}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-lg ${typeInfo.color}`}
                          >
                            <TypeIcon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm text-text-secondary">
                            {typeInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-text-secondary">
                          {tx.description}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-text-primary">
                          {tx.counterparty}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`text-sm font-semibold ${
                            tx.amountRaw >= 0
                              ? "text-accent-green"
                              : "text-text-primary"
                          }`}
                        >
                          {tx.amount}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="divide-y divide-dark-border md:hidden">
            {filteredTransactions.map((tx) => {
              const typeInfo = typeConfig[tx.type];
              const statusInfo = statusConfig[tx.status];
              const TypeIcon = typeInfo.icon;

              return (
                <div key={tx.id} className="px-5 py-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${typeInfo.color}`}
                      >
                        <TypeIcon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {tx.counterparty}
                        </p>
                        <p className="text-xs text-text-muted">
                          {tx.dateRelative}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          tx.amountRaw >= 0
                            ? "text-accent-green"
                            : "text-text-primary"
                        }`}
                      >
                        {tx.amount}
                      </p>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted">{tx.description}</p>
                </div>
              );
            })}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-text-muted">
                No transactions match the selected filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

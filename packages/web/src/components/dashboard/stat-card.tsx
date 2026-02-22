import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  trend?: {
    direction: "up" | "down";
    value: string;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StatCard({ icon, label, value, trend }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-dark-border bg-dark-card p-5",
        "transition-all duration-200",
        "hover:border-dark-hover hover:shadow-lg hover:shadow-black/20"
      )}
    >
      {/* Top row: Icon + Trend */}
      <div className="flex items-center justify-between">
        {/* Icon container */}
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            "bg-accent-blue/10 text-accent-blue"
          )}
        >
          {icon}
        </div>

        {/* Trend badge */}
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5",
              trend.direction === "up"
                ? "bg-accent-green/10 text-accent-green"
                : "bg-red-400/10 text-red-400"
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span className="text-[11px] font-semibold">{trend.value}</span>
          </div>
        )}
      </div>

      {/* Value + Label */}
      <div>
        <p className="text-2xl font-bold tracking-tight text-text-primary">
          {value}
        </p>
        <p className="mt-0.5 text-xs text-text-secondary">{label}</p>
      </div>
    </div>
  );
}

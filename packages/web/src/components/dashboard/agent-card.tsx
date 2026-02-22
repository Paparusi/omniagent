import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    emoji?: string;
    model?: string;
    skills?: string[];
    online?: boolean;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border border-dark-border bg-dark-card p-5",
        "transition-all duration-200",
        "hover:border-dark-hover hover:shadow-lg hover:shadow-black/20"
      )}
    >
      {/* Top row: Avatar + Status */}
      <div className="flex items-start justify-between">
        {/* Avatar / Emoji */}
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl text-xl",
            "bg-accent-purple/10"
          )}
        >
          {agent.emoji || "🤖"}
        </div>

        {/* Online status indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              agent.online ? "bg-accent-green" : "bg-text-muted"
            )}
          />
          <span className="text-[11px] text-text-muted">
            {agent.online ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* Name */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary">
          {agent.name}
        </h3>
        {agent.model && (
          <p className="mt-0.5 text-xs text-text-secondary">{agent.model}</p>
        )}
      </div>

      {/* Skills tags */}
      {agent.skills && agent.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {agent.skills.map((skill) => (
            <span
              key={skill}
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5",
                "border border-dark-border bg-dark-bg",
                "text-[11px] font-medium text-text-secondary"
              )}
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Swarm configuration — loaded from environment variables.
 *
 * Env vars:
 *   SWARM_ENABLED          — Enable swarm system (default: true)
 *   SWARM_MAX_AGENTS       — Max agents per swarm (default: 10)
 *   SWARM_MAX_SWARMS       — Max concurrent swarms (default: 5)
 *   SWARM_AGENT_TIMEOUT_MS — Per-agent task timeout (default: 300000 = 5 min)
 *   SWARM_CONSENSUS        — Default consensus strategy: "merge" | "vote" | "chain" | "best" (default: "merge")
 */

export type ConsensusStrategy = "merge" | "vote" | "chain" | "best";

export interface SwarmConfig {
  enabled: boolean;
  maxAgentsPerSwarm: number;
  maxConcurrentSwarms: number;
  agentTimeoutMs: number;
  defaultConsensus: ConsensusStrategy;
}

export function loadSwarmConfig(): SwarmConfig {
  return {
    enabled: process.env.SWARM_ENABLED !== "false",
    maxAgentsPerSwarm: parseInt(process.env.SWARM_MAX_AGENTS ?? "10", 10),
    maxConcurrentSwarms: parseInt(process.env.SWARM_MAX_SWARMS ?? "5", 10),
    agentTimeoutMs: parseInt(process.env.SWARM_AGENT_TIMEOUT_MS ?? "300000", 10),
    defaultConsensus: (process.env.SWARM_CONSENSUS as ConsensusStrategy) ?? "merge",
  };
}

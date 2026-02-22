/**
 * Swarm task planner and result aggregator.
 *
 * Planner: decomposes a complex task into role-specific sub-tasks.
 * Aggregator: combines agent outputs using consensus strategies.
 */
import type { SwarmRole } from "./roles.js";
import type { AgentTask } from "./agent.js";
import type { AgentResult } from "./agent.js";
import type { ConsensusStrategy } from "./config.js";

// ── Task Decomposition ─────────────────────────────────────────

/**
 * Decompose a task into sub-tasks based on agent roles.
 * Each agent gets a task tailored to their specialization.
 */
export function decomposeTask(
  task: string,
  roles: SwarmRole[],
  context?: string,
  autoDecompose = true,
): AgentTask[] {
  if (!autoDecompose) {
    // All agents get the same task
    return roles.map((role) => ({
      description: task,
      context,
      priority: role.priority,
    }));
  }

  return roles.map((role) => {
    const subTask = generateSubTask(task, role, context);
    return {
      description: subTask,
      context,
      priority: role.priority,
    };
  });
}

/** Generate a role-specific sub-task from the main task */
function generateSubTask(
  task: string,
  role: SwarmRole,
  context?: string,
): string {
  const taskContext = context ? ` Context: ${context}` : "";

  switch (role.id) {
    case "architect":
      return (
        `Design the architecture and technical approach for: ${task}` +
        ` Produce a clear plan with components, interfaces, and data flow.${taskContext}`
      );

    case "coder":
      return (
        `Implement the following task: ${task}` +
        ` Write clean, production-ready code. Follow project conventions.${taskContext}`
      );

    case "researcher":
      return (
        `Research and gather information relevant to: ${task}` +
        ` Find best practices, examples, documentation, and prior art.${taskContext}`
      );

    case "reviewer":
      return (
        `Review the approach and outputs for: ${task}` +
        ` Check for bugs, anti-patterns, security issues, and improvements.` +
        ` Wait for other agents' results via message bus.${taskContext}`
      );

    case "security":
      return (
        `Perform a security analysis for: ${task}` +
        ` Identify vulnerabilities (OWASP Top 10), attack vectors, and remediations.` +
        ` Use Shannon scanner if a URL target is involved.${taskContext}`
      );

    case "tester":
      return (
        `Write comprehensive tests for: ${task}` +
        ` Cover happy paths, edge cases, error conditions.` +
        ` Use the project's testing framework.${taskContext}`
      );

    case "devops":
      return (
        `Plan the infrastructure and deployment for: ${task}` +
        ` Consider CI/CD, Docker, monitoring, and scalability.${taskContext}`
      );

    case "analyst":
      return (
        `Analyze and report on: ${task}` +
        ` Provide data-driven insights, metrics, and actionable recommendations.${taskContext}`
      );

    default:
      return `Contribute to: ${task}${taskContext}`;
  }
}

// ── Result Aggregation ──────────────────────────────────────────

/**
 * Aggregate results from multiple agents using a consensus strategy.
 *
 * Strategies:
 *   - merge: Combine all outputs sequentially (default)
 *   - vote: Let agents vote on the best approach
 *   - chain: Pass output of one agent as input to the next
 *   - best: Pick the output with the highest quality signals
 */
export function aggregateResults(
  results: AgentResult[],
  strategy: ConsensusStrategy,
  originalTask: string,
): string {
  const successful = results.filter((r) => r.status === "done");
  const failed = results.filter((r) => r.status === "failed");

  if (successful.length === 0) {
    return (
      `All agents failed.\n\n` +
      failed
        .map((r) => `${r.role}: ${r.output}`)
        .join("\n")
    );
  }

  switch (strategy) {
    case "merge":
      return mergeStrategy(successful, failed, originalTask);
    case "vote":
      return voteStrategy(successful, originalTask);
    case "chain":
      return chainStrategy(successful, originalTask);
    case "best":
      return bestStrategy(successful, originalTask);
    default:
      return mergeStrategy(successful, failed, originalTask);
  }
}

/** Merge: combine all outputs with role headers */
function mergeStrategy(
  successful: AgentResult[],
  failed: AgentResult[],
  task: string,
): string {
  const sections: string[] = [
    `# Swarm Result: ${task}`,
    ``,
    `**Agents:** ${successful.length} succeeded, ${failed.length} failed`,
    `**Total time:** ${Math.round(
      Math.max(...successful.map((r) => r.durationMs)) / 1000,
    )}s (wall clock)`,
    ``,
  ];

  // Sort by role priority (architect first, reviewer last)
  const sorted = [...successful].sort(
    (a, b) => roleOrder(a.role) - roleOrder(b.role),
  );

  for (const result of sorted) {
    sections.push(
      `## ${roleEmoji(result.role)} ${result.role.toUpperCase()}`,
      ``,
      result.output,
      ``,
      `---`,
      ``,
    );
  }

  if (failed.length > 0) {
    sections.push(
      `## Failed Agents`,
      ``,
      ...failed.map((r) => `- **${r.role}**: ${r.output}`),
    );
  }

  return sections.join("\n");
}

/** Vote: extract key decisions and find consensus */
function voteStrategy(successful: AgentResult[], task: string): string {
  const sections: string[] = [
    `# Swarm Consensus: ${task}`,
    ``,
    `**Strategy:** Voting (${successful.length} agents)`,
    ``,
  ];

  // Each agent's summary
  for (const result of successful) {
    sections.push(
      `### ${roleEmoji(result.role)} ${result.role}`,
      ``,
      result.output.slice(0, 500),
      ``,
    );
  }

  sections.push(
    ``,
    `## Consensus`,
    ``,
    `All ${successful.length} agents contributed. Review individual outputs above for the full picture.`,
  );

  return sections.join("\n");
}

/** Chain: treat outputs as a pipeline */
function chainStrategy(successful: AgentResult[], task: string): string {
  const sorted = [...successful].sort(
    (a, b) => roleOrder(a.role) - roleOrder(b.role),
  );

  const sections: string[] = [
    `# Swarm Pipeline: ${task}`,
    ``,
    `**Strategy:** Chain (${sorted.length} stages)`,
    ``,
  ];

  for (let i = 0; i < sorted.length; i++) {
    const result = sorted[i];
    sections.push(
      `## Stage ${i + 1}: ${roleEmoji(result.role)} ${result.role}`,
      ``,
      result.output,
      ``,
    );
  }

  // Final output is the last agent's
  sections.push(
    `---`,
    ``,
    `**Final output** from ${sorted[sorted.length - 1].role}:`,
    ``,
    sorted[sorted.length - 1].output,
  );

  return sections.join("\n");
}

/** Best: pick the highest quality output */
function bestStrategy(successful: AgentResult[], task: string): string {
  // Heuristic: longest meaningful output with the most structure
  const scored = successful.map((r) => ({
    result: r,
    score:
      r.output.length * 0.1 +
      (r.output.match(/\n/g)?.length ?? 0) * 2 +
      (r.output.match(/^#+\s/gm)?.length ?? 0) * 10 +
      (r.output.match(/```/g)?.length ?? 0) * 5 +
      (r.status === "done" ? 50 : 0),
  }));

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  return [
    `# Best Result: ${task}`,
    ``,
    `**Selected:** ${roleEmoji(best.result.role)} ${best.result.role} (score: ${Math.round(best.score)})`,
    `**Other candidates:** ${scored
      .slice(1)
      .map((s) => `${s.result.role} (${Math.round(s.score)})`)
      .join(", ")}`,
    ``,
    `---`,
    ``,
    best.result.output,
  ].join("\n");
}

// ── Helpers ─────────────────────────────────────────────────────

const ROLE_ORDER: Record<string, number> = {
  architect: 1,
  researcher: 2,
  coder: 3,
  security: 4,
  tester: 5,
  devops: 6,
  analyst: 7,
  reviewer: 8,
};

function roleOrder(role: string): number {
  return ROLE_ORDER[role] ?? 99;
}

const ROLE_EMOJI: Record<string, string> = {
  architect: "\u{1F3D7}\uFE0F",
  coder: "\u{1F4BB}",
  researcher: "\u{1F50D}",
  reviewer: "\u{1F441}\uFE0F",
  security: "\u{1F6E1}\uFE0F",
  tester: "\u{1F9EA}",
  devops: "\u2699\uFE0F",
  analyst: "\u{1F4CA}",
};

function roleEmoji(role: string): string {
  return ROLE_EMOJI[role] ?? "\u{1F916}";
}

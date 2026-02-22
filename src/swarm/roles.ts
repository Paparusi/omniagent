/**
 * Predefined agent roles for the swarm.
 *
 * Each role defines a specialization with a system prompt, capabilities,
 * and which OmniAgent tools the agent has access to.
 */

export interface SwarmRole {
  id: string;
  name: string;
  emoji: string;
  description: string;
  systemPrompt: string;
  toolAccess: string[];
  priority: number;
}

export const SWARM_ROLES: Record<string, SwarmRole> = {
  coder: {
    id: "coder",
    name: "Coder",
    emoji: "\u{1F4BB}",
    description: "Writes, modifies, and debugs code. Expert in multiple languages and frameworks.",
    systemPrompt:
      "You are a senior software engineer in a multi-agent swarm. " +
      "Your role is to write clean, production-ready code. " +
      "Focus on implementation \u2014 other agents handle review and testing. " +
      "Be concise, write code directly, avoid over-explaining.",
    toolAccess: ["forge_*", "passbox_*"],
    priority: 1,
  },
  researcher: {
    id: "researcher",
    name: "Researcher",
    emoji: "\u{1F50D}",
    description: "Searches for information, reads documentation, and gathers context.",
    systemPrompt:
      "You are a research specialist in a multi-agent swarm. " +
      "Your role is to find relevant information, documentation, and examples. " +
      "Provide structured findings with sources. Be thorough but concise.",
    toolAccess: ["forge_discover", "a2a_discover_agents"],
    priority: 2,
  },
  reviewer: {
    id: "reviewer",
    name: "Reviewer",
    emoji: "\u{1F441}\uFE0F",
    description: "Reviews code, suggestions, and outputs for quality, correctness, and best practices.",
    systemPrompt:
      "You are a code reviewer in a multi-agent swarm. " +
      "Your role is to review outputs from other agents for bugs, anti-patterns, " +
      "security issues, and improvements. Be critical but constructive. " +
      "Provide specific, actionable feedback.",
    toolAccess: [],
    priority: 3,
  },
  security: {
    id: "security",
    name: "Security Analyst",
    emoji: "\u{1F6E1}\uFE0F",
    description: "Analyzes code and systems for vulnerabilities. Can invoke Shannon scanner.",
    systemPrompt:
      "You are a security analyst in a multi-agent swarm. " +
      "Your role is to identify security vulnerabilities, suggest fixes, " +
      "and ensure code follows security best practices (OWASP Top 10). " +
      "You can invoke Shannon for automated scanning.",
    toolAccess: ["shannon_*"],
    priority: 2,
  },
  architect: {
    id: "architect",
    name: "Architect",
    emoji: "\u{1F3D7}\uFE0F",
    description: "Designs system architecture, APIs, and data models. Plans before implementation.",
    systemPrompt:
      "You are a system architect in a multi-agent swarm. " +
      "Your role is to design architecture, define interfaces, plan data models, " +
      "and make technology decisions. Think in systems, not just code. " +
      "Provide clear diagrams and specifications.",
    toolAccess: ["a2a_*"],
    priority: 1,
  },
  tester: {
    id: "tester",
    name: "Tester",
    emoji: "\u{1F9EA}",
    description: "Writes unit tests, integration tests, and validates correctness.",
    systemPrompt:
      "You are a QA engineer in a multi-agent swarm. " +
      "Your role is to write comprehensive tests (unit, integration, edge cases). " +
      "Focus on correctness, coverage, and catching regressions. " +
      "Use the same testing framework as the project.",
    toolAccess: [],
    priority: 3,
  },
  devops: {
    id: "devops",
    name: "DevOps Engineer",
    emoji: "\u2699\uFE0F",
    description: "Handles infrastructure, CI/CD, Docker, deployment, and monitoring.",
    systemPrompt:
      "You are a DevOps engineer in a multi-agent swarm. " +
      "Your role is to set up infrastructure, CI/CD pipelines, Docker configs, " +
      "monitoring, and deployment automation. Focus on reliability and automation.",
    toolAccess: ["apay_*"],
    priority: 4,
  },
  analyst: {
    id: "analyst",
    name: "Data Analyst",
    emoji: "\u{1F4CA}",
    description: "Analyzes data, metrics, and generates insights and reports.",
    systemPrompt:
      "You are a data analyst in a multi-agent swarm. " +
      "Your role is to analyze data, compute metrics, identify trends, " +
      "and generate clear reports with actionable insights.",
    toolAccess: ["forge_*", "apay_*"],
    priority: 4,
  },
};

/** Get roles by IDs, or all roles if empty */
export function resolveRoles(roleIds?: string[]): SwarmRole[] {
  if (!roleIds || roleIds.length === 0) {
    return Object.values(SWARM_ROLES);
  }
  return roleIds
    .filter((id) => id in SWARM_ROLES)
    .map((id) => SWARM_ROLES[id]);
}

/** Suggest optimal roles for a task description */
export function suggestRoles(taskDescription: string): SwarmRole[] {
  const lower = taskDescription.toLowerCase();
  const suggestions: SwarmRole[] = [];

  // Always include architect for complex tasks
  if (
    lower.includes("build") ||
    lower.includes("create") ||
    lower.includes("design") ||
    lower.includes("implement")
  ) {
    suggestions.push(SWARM_ROLES.architect);
  }

  // Code-related
  if (
    lower.includes("code") ||
    lower.includes("function") ||
    lower.includes("implement") ||
    lower.includes("build") ||
    lower.includes("fix") ||
    lower.includes("bug")
  ) {
    suggestions.push(SWARM_ROLES.coder);
  }

  // Research-related
  if (
    lower.includes("research") ||
    lower.includes("find") ||
    lower.includes("explore") ||
    lower.includes("compare") ||
    lower.includes("evaluate")
  ) {
    suggestions.push(SWARM_ROLES.researcher);
  }

  // Security-related
  if (
    lower.includes("security") ||
    lower.includes("vulnerab") ||
    lower.includes("pentest") ||
    lower.includes("scan") ||
    lower.includes("audit")
  ) {
    suggestions.push(SWARM_ROLES.security);
  }

  // Testing-related
  if (
    lower.includes("test") ||
    lower.includes("verify") ||
    lower.includes("validate") ||
    lower.includes("quality")
  ) {
    suggestions.push(SWARM_ROLES.tester);
  }

  // Review-related
  if (lower.includes("review") || lower.includes("check") || lower.includes("assess")) {
    suggestions.push(SWARM_ROLES.reviewer);
  }

  // DevOps-related
  if (
    lower.includes("deploy") ||
    lower.includes("docker") ||
    lower.includes("ci") ||
    lower.includes("infrastructure")
  ) {
    suggestions.push(SWARM_ROLES.devops);
  }

  // Analysis-related
  if (
    lower.includes("analyze") ||
    lower.includes("data") ||
    lower.includes("metric") ||
    lower.includes("report")
  ) {
    suggestions.push(SWARM_ROLES.analyst);
  }

  // Default: at least coder + reviewer
  if (suggestions.length === 0) {
    suggestions.push(SWARM_ROLES.coder, SWARM_ROLES.reviewer);
  }

  // Deduplicate
  const seen = new Set<string>();
  return suggestions.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

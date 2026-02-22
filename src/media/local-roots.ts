import path from "node:path";
import { resolveAgentWorkspaceDir } from "../agents/agent-scope.js";
import type { OmniAgentConfig } from "../config/config.js";
import { resolveStateDir } from "../config/paths.js";
import { resolvePreferredOmniAgentTmpDir } from "../infra/tmp-omniagent-dir.js";

function buildMediaLocalRoots(stateDir: string): string[] {
  const resolvedStateDir = path.resolve(stateDir);
  const preferredTmpDir = resolvePreferredOmniAgentTmpDir();
  return [
    preferredTmpDir,
    path.join(resolvedStateDir, "media"),
    path.join(resolvedStateDir, "agents"),
    path.join(resolvedStateDir, "workspace"),
    path.join(resolvedStateDir, "sandboxes"),
  ];
}

export function getDefaultMediaLocalRoots(): readonly string[] {
  return buildMediaLocalRoots(resolveStateDir());
}

export function getAgentScopedMediaLocalRoots(
  cfg: OmniAgentConfig,
  agentId?: string,
): readonly string[] {
  const roots = buildMediaLocalRoots(resolveStateDir());
  if (!agentId?.trim()) {
    return roots;
  }
  const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
  if (!workspaceDir) {
    return roots;
  }
  const normalizedWorkspaceDir = path.resolve(workspaceDir);
  if (!roots.includes(normalizedWorkspaceDir)) {
    roots.push(normalizedWorkspaceDir);
  }
  return roots;
}

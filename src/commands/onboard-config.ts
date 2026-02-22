import type { OmniAgentConfig } from "../config/config.js";

export function applyOnboardingLocalWorkspaceConfig(
  baseConfig: OmniAgentConfig,
  workspaceDir: string,
): OmniAgentConfig {
  return {
    ...baseConfig,
    agents: {
      ...baseConfig.agents,
      defaults: {
        ...baseConfig.agents?.defaults,
        workspace: workspaceDir,
      },
    },
    gateway: {
      ...baseConfig.gateway,
      mode: "local",
    },
  };
}

import type { OmniAgentConfig } from "./config.js";

export function ensurePluginAllowlisted(cfg: OmniAgentConfig, pluginId: string): OmniAgentConfig {
  const allow = cfg.plugins?.allow;
  if (!Array.isArray(allow) || allow.includes(pluginId)) {
    return cfg;
  }
  return {
    ...cfg,
    plugins: {
      ...cfg.plugins,
      allow: [...allow, pluginId],
    },
  };
}

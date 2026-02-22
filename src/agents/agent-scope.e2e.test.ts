import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OmniAgentConfig } from "../config/config.js";
import {
  resolveAgentConfig,
  resolveAgentDir,
  resolveEffectiveModelFallbacks,
  resolveAgentModelFallbacksOverride,
  resolveAgentModelPrimary,
  resolveAgentWorkspaceDir,
} from "./agent-scope.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveAgentConfig", () => {
  it("should return undefined when no agents config exists", () => {
    const cfg: OmniAgentConfig = {};
    const result = resolveAgentConfig(cfg, "main");
    expect(result).toBeUndefined();
  });

  it("should return undefined when agent id does not exist", () => {
    const cfg: OmniAgentConfig = {
      agents: {
        list: [{ id: "main", workspace: "~/omniagent" }],
      },
    };
    const result = resolveAgentConfig(cfg, "nonexistent");
    expect(result).toBeUndefined();
  });

  it("should return basic agent config", () => {
    const cfg: OmniAgentConfig = {
      agents: {
        list: [
          {
            id: "main",
            name: "Main Agent",
            workspace: "~/omniagent",
            agentDir: "~/.omniagent/agents/main",
            model: "anthropic/claude-opus-4",
          },
        ],
      },
    };
    const result = resolveAgentConfig(cfg, "main");
    expect(result).toEqual({
      name: "Main Agent",
      workspace: "~/omniagent",
      agentDir: "~/.omniagent/agents/main",
      model: "anthropic/claude-opus-4",
      identity: undefined,
      groupChat: undefined,
      subagents: undefined,
      sandbox: undefined,
      tools: undefined,
    });
  });

  it("supports per-agent model primary+fallbacks", () => {
    const cfg: OmniAgentConfig = {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4",
            fallbacks: ["openai/gpt-4.1"],
          },
        },
        list: [
          {
            id: "linus",
            model: {
              primary: "anthropic/claude-opus-4",
              fallbacks: ["openai/gpt-5.2"],
            },
          },
        ],
      },
    };

    expect(resolveAgentModelPrimary(cfg, "linus")).toBe("anthropic/claude-opus-4");
    expect(resolveAgentModelFallbacksOverride(cfg, "linus")).toEqual(["openai/gpt-5.2"]);

    // If fallbacks isn't present, we don't override the global fallbacks.
    const cfgNoOverride: OmniAgentConfig = {
      agents: {
        list: [
          {
            id: "linus",
            model: {
              primary: "anthropic/claude-opus-4",
            },
          },
        ],
      },
    };
    expect(resolveAgentModelFallbacksOverride(cfgNoOverride, "linus")).toBe(undefined);

    // Explicit empty list disables global fallbacks for that agent.
    const cfgDisable: OmniAgentConfig = {
      agents: {
        list: [
          {
            id: "linus",
            model: {
              primary: "anthropic/claude-opus-4",
              fallbacks: [],
            },
          },
        ],
      },
    };
    expect(resolveAgentModelFallbacksOverride(cfgDisable, "linus")).toEqual([]);

    expect(
      resolveEffectiveModelFallbacks({
        cfg,
        agentId: "linus",
        hasSessionModelOverride: false,
      }),
    ).toEqual(["openai/gpt-5.2"]);
    expect(
      resolveEffectiveModelFallbacks({
        cfg,
        agentId: "linus",
        hasSessionModelOverride: true,
      }),
    ).toEqual(["openai/gpt-5.2"]);
    expect(
      resolveEffectiveModelFallbacks({
        cfg: cfgNoOverride,
        agentId: "linus",
        hasSessionModelOverride: true,
      }),
    ).toEqual([]);

    const cfgInheritDefaults: OmniAgentConfig = {
      agents: {
        defaults: {
          model: {
            fallbacks: ["openai/gpt-4.1"],
          },
        },
        list: [
          {
            id: "linus",
            model: {
              primary: "anthropic/claude-opus-4",
            },
          },
        ],
      },
    };
    expect(
      resolveEffectiveModelFallbacks({
        cfg: cfgInheritDefaults,
        agentId: "linus",
        hasSessionModelOverride: true,
      }),
    ).toEqual(["openai/gpt-4.1"]);
    expect(
      resolveEffectiveModelFallbacks({
        cfg: cfgDisable,
        agentId: "linus",
        hasSessionModelOverride: true,
      }),
    ).toEqual([]);
  });

  it("should return agent-specific sandbox config", () => {
    const cfg: OmniAgentConfig = {
      agents: {
        list: [
          {
            id: "work",
            workspace: "~/omniagent-work",
            sandbox: {
              mode: "all",
              scope: "agent",
              perSession: false,
              workspaceAccess: "ro",
              workspaceRoot: "~/sandboxes",
            },
          },
        ],
      },
    };
    const result = resolveAgentConfig(cfg, "work");
    expect(result?.sandbox).toEqual({
      mode: "all",
      scope: "agent",
      perSession: false,
      workspaceAccess: "ro",
      workspaceRoot: "~/sandboxes",
    });
  });

  it("should return agent-specific tools config", () => {
    const cfg: OmniAgentConfig = {
      agents: {
        list: [
          {
            id: "restricted",
            workspace: "~/omniagent-restricted",
            tools: {
              allow: ["read"],
              deny: ["exec", "write", "edit"],
              elevated: {
                enabled: false,
                allowFrom: { whatsapp: ["+15555550123"] },
              },
            },
          },
        ],
      },
    };
    const result = resolveAgentConfig(cfg, "restricted");
    expect(result?.tools).toEqual({
      allow: ["read"],
      deny: ["exec", "write", "edit"],
      elevated: {
        enabled: false,
        allowFrom: { whatsapp: ["+15555550123"] },
      },
    });
  });

  it("should return both sandbox and tools config", () => {
    const cfg: OmniAgentConfig = {
      agents: {
        list: [
          {
            id: "family",
            workspace: "~/omniagent-family",
            sandbox: {
              mode: "all",
              scope: "agent",
            },
            tools: {
              allow: ["read"],
              deny: ["exec"],
            },
          },
        ],
      },
    };
    const result = resolveAgentConfig(cfg, "family");
    expect(result?.sandbox?.mode).toBe("all");
    expect(result?.tools?.allow).toEqual(["read"]);
  });

  it("should normalize agent id", () => {
    const cfg: OmniAgentConfig = {
      agents: {
        list: [{ id: "main", workspace: "~/omniagent" }],
      },
    };
    // Should normalize to "main" (default)
    const result = resolveAgentConfig(cfg, "");
    expect(result).toBeDefined();
    expect(result?.workspace).toBe("~/omniagent");
  });

  it("uses OMNIAGENT_HOME for default agent workspace", () => {
    const home = path.join(path.sep, "srv", "omniagent-home");
    vi.stubEnv("OMNIAGENT_HOME", home);

    const workspace = resolveAgentWorkspaceDir({} as OmniAgentConfig, "main");
    expect(workspace).toBe(path.join(path.resolve(home), ".omniagent", "workspace"));
  });

  it("uses OMNIAGENT_HOME for default agentDir", () => {
    const home = path.join(path.sep, "srv", "omniagent-home");
    vi.stubEnv("OMNIAGENT_HOME", home);
    // Clear state dir so it falls back to OMNIAGENT_HOME
    vi.stubEnv("OMNIAGENT_STATE_DIR", "");

    const agentDir = resolveAgentDir({} as OmniAgentConfig, "main");
    expect(agentDir).toBe(path.join(path.resolve(home), ".omniagent", "agents", "main", "agent"));
  });
});

/**
 * Tests for index.ts — Plugin registration, feature-flagging, lifecycle hooks, and service.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all tool registration functions and service.
// The paths must match how index.ts imports them (relative from src/).
const mockRegisterForgeTools = vi.hoisted(() => vi.fn());
const mockRegisterPassBoxTools = vi.hoisted(() => vi.fn());
const mockRegisterApayTools = vi.hoisted(() => vi.fn());
const mockRegisterCompositeTools = vi.hoisted(() => vi.fn());
const mockRegisterA2ACommands = vi.hoisted(() => vi.fn());
const mockCheckPlatformStatus = vi.hoisted(() =>
  vi.fn(async () => ({
    agentforge: { connected: true },
    passbox: { connected: false },
    apay: { connected: true },
  })),
);

vi.mock("../tools/forge.js", () => ({
  registerForgeTools: mockRegisterForgeTools,
}));

vi.mock("../tools/passbox.js", () => ({
  registerPassBoxTools: mockRegisterPassBoxTools,
}));

vi.mock("../tools/apay.js", () => ({
  registerApayTools: mockRegisterApayTools,
}));

vi.mock("../tools/composite.js", () => ({
  registerCompositeTools: mockRegisterCompositeTools,
}));

vi.mock("../commands.js", () => ({
  registerA2ACommands: mockRegisterA2ACommands,
}));

vi.mock("../service.js", () => ({
  checkPlatformStatus: mockCheckPlatformStatus,
}));

import plugin from "../index.js";

/**
 * Create a mock OmniAgentPluginApi.
 */
function createMockApi(pluginConfig: any = {}) {
  const eventHandlers: Record<string, Function[]> = {};
  const services: any[] = [];

  return {
    api: {
      pluginConfig,
      logger: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      registerTool: vi.fn(),
      registerCommand: vi.fn(),
      registerService: vi.fn((svc: any) => services.push(svc)),
      on: vi.fn((event: string, handler: Function) => {
        if (!eventHandlers[event]) eventHandlers[event] = [];
        eventHandlers[event].push(handler);
      }),
    },
    eventHandlers,
    services,
  };
}

describe("plugin (index.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Plugin metadata ─────────────────────────────────────────────

  it("exports plugin with correct id, name, and version", () => {
    expect(plugin.id).toBe("a2a-corp");
    expect(plugin.name).toBe("A2A Corp");
    expect(plugin.version).toBe("2.0.0");
  });

  it("has a register function", () => {
    expect(typeof plugin.register).toBe("function");
  });

  // ── Feature-flagged tool registration ───────────────────────────

  it("registers forge tools when agentforge.apiKey is set", () => {
    const { api } = createMockApi({ agentforge: { apiKey: "k" } });
    plugin.register(api as any);

    expect(mockRegisterForgeTools).toHaveBeenCalledOnce();
    expect(mockRegisterForgeTools).toHaveBeenCalledWith(
      api,
      expect.objectContaining({ agentforge: { apiKey: "k" } }),
    );
    expect(api.logger.info).toHaveBeenCalledWith(
      expect.stringContaining("AgentForge tools registered"),
    );
  });

  it("does NOT register forge tools when agentforge.apiKey is missing", () => {
    const { api } = createMockApi({});
    plugin.register(api as any);

    expect(mockRegisterForgeTools).not.toHaveBeenCalled();
  });

  it("registers passbox tools when passbox.token is set", () => {
    const { api } = createMockApi({ passbox: { token: "t" } });
    plugin.register(api as any);

    expect(mockRegisterPassBoxTools).toHaveBeenCalledOnce();
    expect(mockRegisterPassBoxTools).toHaveBeenCalledWith(
      api,
      expect.objectContaining({ passbox: { token: "t" } }),
    );
    expect(api.logger.info).toHaveBeenCalledWith(
      expect.stringContaining("PassBox tools registered"),
    );
  });

  it("does NOT register passbox tools when passbox.token is missing", () => {
    const { api } = createMockApi({});
    plugin.register(api as any);

    expect(mockRegisterPassBoxTools).not.toHaveBeenCalled();
  });

  it("registers apay tools when apay.apiKey is set", () => {
    const { api } = createMockApi({ apay: { apiKey: "a" } });
    plugin.register(api as any);

    expect(mockRegisterApayTools).toHaveBeenCalledOnce();
    expect(mockRegisterApayTools).toHaveBeenCalledWith(
      api,
      expect.objectContaining({ apay: { apiKey: "a" } }),
    );
    expect(api.logger.info).toHaveBeenCalledWith(
      expect.stringContaining("APay tools registered"),
    );
  });

  it("does NOT register apay tools when apay.apiKey is missing", () => {
    const { api } = createMockApi({});
    plugin.register(api as any);

    expect(mockRegisterApayTools).not.toHaveBeenCalled();
  });

  // ── Composite tools (require 2+ platforms) ──────────────────────

  it("registers composite tools when 2 platforms are configured", () => {
    const { api } = createMockApi({
      agentforge: { apiKey: "k" },
      apay: { apiKey: "a" },
    });
    plugin.register(api as any);

    expect(mockRegisterCompositeTools).toHaveBeenCalledOnce();
    expect(api.logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Composite tools registered"),
    );
  });

  it("registers composite tools when all 3 platforms are configured", () => {
    const { api } = createMockApi({
      agentforge: { apiKey: "k" },
      passbox: { token: "t" },
      apay: { apiKey: "a" },
    });
    plugin.register(api as any);

    expect(mockRegisterCompositeTools).toHaveBeenCalledOnce();
  });

  it("does NOT register composite tools with only 1 platform", () => {
    const { api } = createMockApi({ agentforge: { apiKey: "k" } });
    plugin.register(api as any);

    expect(mockRegisterCompositeTools).not.toHaveBeenCalled();
  });

  it("does NOT register composite tools with 0 platforms", () => {
    const { api } = createMockApi({});
    plugin.register(api as any);

    expect(mockRegisterCompositeTools).not.toHaveBeenCalled();
  });

  // ── Commands ────────────────────────────────────────────────────

  it("always registers CLI commands", () => {
    const { api } = createMockApi({});
    plugin.register(api as any);

    expect(mockRegisterA2ACommands).toHaveBeenCalledOnce();
  });

  // ── Lifecycle hooks ─────────────────────────────────────────────

  it("registers before_prompt_build hook", () => {
    const { api, eventHandlers } = createMockApi({
      agentforge: { apiKey: "k" },
    });
    plugin.register(api as any);

    expect(api.on).toHaveBeenCalledWith(
      "before_prompt_build",
      expect.any(Function),
    );
    expect(eventHandlers["before_prompt_build"]).toHaveLength(1);
  });

  it("before_prompt_build returns platform context when platforms configured", async () => {
    const { api, eventHandlers } = createMockApi({
      agentforge: { apiKey: "k" },
      passbox: { token: "t" },
    });
    plugin.register(api as any);

    const handler = eventHandlers["before_prompt_build"][0];
    const result = await handler();

    expect(result.prependContext).toContain("AgentForge (marketplace)");
    expect(result.prependContext).toContain("PassBox (vault)");
    expect(result.prependContext).not.toContain("APay");
  });

  it("before_prompt_build returns empty object when no platforms configured", async () => {
    const { api, eventHandlers } = createMockApi({});
    plugin.register(api as any);

    const handler = eventHandlers["before_prompt_build"][0];
    const result = await handler();

    expect(result).toEqual({});
  });

  it("registers after_tool_call hook", () => {
    const { api, eventHandlers } = createMockApi({});
    plugin.register(api as any);

    expect(api.on).toHaveBeenCalledWith(
      "after_tool_call",
      expect.any(Function),
    );
    expect(eventHandlers["after_tool_call"]).toHaveLength(1);
  });

  it("after_tool_call logs A2A tool calls", async () => {
    const { api, eventHandlers } = createMockApi({});
    plugin.register(api as any);

    const handler = eventHandlers["after_tool_call"][0];

    await handler({ toolName: "forge_discover" });
    expect(api.logger.debug).toHaveBeenCalledWith(
      "A2A tool called: forge_discover",
    );

    await handler({ toolName: "passbox_get_secret" });
    expect(api.logger.debug).toHaveBeenCalledWith(
      "A2A tool called: passbox_get_secret",
    );

    await handler({ toolName: "apay_pay_service" });
    expect(api.logger.debug).toHaveBeenCalledWith(
      "A2A tool called: apay_pay_service",
    );

    await handler({ toolName: "a2a_full_pipeline" });
    expect(api.logger.debug).toHaveBeenCalledWith(
      "A2A tool called: a2a_full_pipeline",
    );
  });

  it("after_tool_call ignores non-A2A tool calls", async () => {
    const { api, eventHandlers } = createMockApi({});
    plugin.register(api as any);

    const handler = eventHandlers["after_tool_call"][0];
    await handler({ toolName: "some_other_tool" });

    expect(api.logger.debug).not.toHaveBeenCalled();
  });

  // ── Service registration ────────────────────────────────────────

  it("registers a service with id 'a2a-corp'", () => {
    const { api, services } = createMockApi({});
    plugin.register(api as any);

    expect(api.registerService).toHaveBeenCalledTimes(1);
    expect(services).toHaveLength(1);
    expect(services[0].id).toBe("a2a-corp");
  });

  it("service start() calls checkPlatformStatus and logs connected count", async () => {
    const { api, services } = createMockApi({
      agentforge: { apiKey: "k" },
    });
    plugin.register(api as any);

    await services[0].start();

    expect(mockCheckPlatformStatus).toHaveBeenCalled();
    expect(api.logger.info).toHaveBeenCalledWith(
      expect.stringContaining("2/3 platforms connected"),
    );
  });

  it("service stop() logs shutdown message", () => {
    const { api, services } = createMockApi({});
    plugin.register(api as any);

    services[0].stop();

    expect(api.logger.info).toHaveBeenCalledWith(
      "A2A Corp: service stopped",
    );
  });
});

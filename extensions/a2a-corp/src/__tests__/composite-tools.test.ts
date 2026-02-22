/**
 * Tests for tools/composite.ts — Cross-platform workflow tools.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all three service clients
const mockForgeClient = vi.hoisted(() => ({
  discoverTools: vi.fn(),
  executeTool: vi.fn(),
  getBalance: vi.fn(),
}));

const mockPassBoxClient = vi.hoisted(() => ({
  getSecret: vi.fn(),
}));

const mockApayFetch = vi.hoisted(() => vi.fn());

vi.mock("../service.js", () => ({
  getForgeClient: vi.fn(() => mockForgeClient),
  getPassBoxClient: vi.fn(async () => mockPassBoxClient),
  getApayClient: vi.fn(() => ({
    baseUrl: "http://localhost:3003",
    apiKey: "test-key",
    fetch: mockApayFetch,
  })),
}));

import { registerCompositeTools } from "../tools/composite.js";
import type { A2AConfig } from "../service.js";

function createMockRegistrar() {
  const tools: any[] = [];
  return {
    registrar: {
      registerTool(tool: any) {
        tools.push(tool);
      },
    },
    tools,
  };
}

const fullCfg: A2AConfig = {
  agentforge: { apiKey: "forge-key" },
  passbox: { token: "pb-token" },
  apay: { apiKey: "apay-key" },
};

describe("composite tools", () => {
  let tools: any[];
  let registrar: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockRegistrar();
    tools = mock.tools;
    registrar = mock.registrar;
    registerCompositeTools(registrar, fullCfg);
  });

  it("registers exactly 4 tools", () => {
    expect(tools).toHaveLength(4);
  });

  it("registers tools with correct names", () => {
    const names = tools.map((t) => t.name);
    expect(names).toEqual([
      "a2a_discover_and_pay",
      "a2a_secure_execute",
      "a2a_full_pipeline",
      "a2a_budget_status",
    ]);
  });

  // ── a2a_discover_and_pay ──────────────────────────────────────────

  describe("a2a_discover_and_pay", () => {
    it("returns 'no tools found' when discovery returns empty", async () => {
      mockForgeClient.discoverTools.mockResolvedValueOnce([]);

      const tool = tools.find((t) => t.name === "a2a_discover_and_pay");
      const result = await tool.execute("call-1", { query: "nothing" });

      expect(result.content[0].text).toContain("No tools found");
    });

    it("discovers tool and estimates cost without auto-pay", async () => {
      mockForgeClient.discoverTools.mockResolvedValueOnce([
        { id: "t1", name: "Summarizer", price: 0.05 },
      ]);
      mockApayFetch.mockResolvedValueOnce({ total: "0.05", fee: "0.0003" });

      const tool = tools.find((t) => t.name === "a2a_discover_and_pay");
      const result = await tool.execute("call-2", {
        query: "summarize",
        autoPay: false,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.tool.id).toBe("t1");
      expect(parsed.estimate.total).toBe("0.05");
      expect(parsed.paid).toBe(false);
    });

    it("discovers tool and auto-pays when autoPay is true", async () => {
      mockForgeClient.discoverTools.mockResolvedValueOnce([
        { id: "t1", name: "Summarizer", price: 0.05 },
      ]);
      mockApayFetch
        .mockResolvedValueOnce({ total: "0.05", fee: "0.0003" }) // estimate
        .mockResolvedValueOnce({ txHash: "0xabc" }); // pay

      const tool = tools.find((t) => t.name === "a2a_discover_and_pay");
      const result = await tool.execute("call-3", {
        query: "summarize",
        autoPay: true,
        maxPrice: 1.0,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.paid).toBe(true);
      expect(parsed.payment.txHash).toBe("0xabc");
    });

    it("does not auto-pay when tool price exceeds maxPrice", async () => {
      mockForgeClient.discoverTools.mockResolvedValueOnce([
        { id: "t1", name: "Expensive", price: 5.0 },
      ]);
      mockApayFetch.mockResolvedValueOnce({ total: "5.03", fee: "0.03" });

      const tool = tools.find((t) => t.name === "a2a_discover_and_pay");
      const result = await tool.execute("call-4", {
        query: "expensive tool",
        autoPay: true,
        maxPrice: 1.0,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.paid).toBe(false);
      // pay should not have been called (only estimate was called)
      expect(mockApayFetch).toHaveBeenCalledTimes(1);
    });

    it("handles estimate failure gracefully with fallback", async () => {
      mockForgeClient.discoverTools.mockResolvedValueOnce([
        { id: "t1", name: "Tool", price: 0.01 },
      ]);
      mockApayFetch.mockRejectedValueOnce(new Error("APay down"));

      const tool = tools.find((t) => t.name === "a2a_discover_and_pay");
      const result = await tool.execute("call-5", { query: "test" });

      const parsed = JSON.parse(result.content[0].text);
      // Falls back to default estimate
      expect(parsed.estimate.total).toBe(0.01);
      expect(parsed.estimate.fee).toBe("0.00");
    });
  });

  // ── a2a_secure_execute ────────────────────────────────────────────

  describe("a2a_secure_execute", () => {
    it("resolves {{SECRET}} placeholders from PassBox vault", async () => {
      mockPassBoxClient.getSecret.mockResolvedValueOnce({
        key: "API_TOKEN",
        value: "resolved-token-123",
      });
      mockForgeClient.executeTool.mockResolvedValueOnce({ output: "done" });

      const tool = tools.find((t) => t.name === "a2a_secure_execute");
      const result = await tool.execute("call-6", {
        toolId: "tool-xyz",
        input: { token: "{{API_TOKEN}}" },
        vault: "myapp",
        environment: "prod",
      });

      // Should have resolved the secret
      expect(mockPassBoxClient.getSecret).toHaveBeenCalledWith(
        "myapp",
        "API_TOKEN",
        "prod",
      );
      // Should have called executeTool with resolved value
      expect(mockForgeClient.executeTool).toHaveBeenCalledWith("tool-xyz", {
        token: "resolved-token-123",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.secretsInjected).toBe(1);
      expect(parsed.result.output).toBe("done");
    });

    it("leaves placeholder when secret is not found", async () => {
      mockPassBoxClient.getSecret.mockRejectedValueOnce(
        new Error("Secret not found"),
      );
      mockForgeClient.executeTool.mockResolvedValueOnce({ output: "ok" });

      const tool = tools.find((t) => t.name === "a2a_secure_execute");
      await tool.execute("call-7", {
        toolId: "tool-abc",
        input: { key: "{{MISSING_SECRET}}" },
      });

      // executeTool should be called with the original placeholder intact
      expect(mockForgeClient.executeTool).toHaveBeenCalledWith("tool-abc", {
        key: "{{MISSING_SECRET}}",
      });
    });

    it("uses default vault when vault param is not provided", async () => {
      mockPassBoxClient.getSecret.mockResolvedValueOnce({
        key: "KEY",
        value: "val",
      });
      mockForgeClient.executeTool.mockResolvedValueOnce({});

      const tool = tools.find((t) => t.name === "a2a_secure_execute");
      await tool.execute("call-8", {
        toolId: "t1",
        input: { x: "{{KEY}}" },
      });

      expect(mockPassBoxClient.getSecret).toHaveBeenCalledWith(
        "default",
        "KEY",
        undefined,
      );
    });
  });

  // ── a2a_full_pipeline ─────────────────────────────────────────────

  describe("a2a_full_pipeline", () => {
    it("runs full pipeline: discover -> budget -> credentials -> execute", async () => {
      mockForgeClient.discoverTools.mockResolvedValueOnce([
        { id: "t1", name: "Tool1", price: 0.1 },
      ]);
      mockApayFetch.mockResolvedValueOnce({ affordable: true });
      mockPassBoxClient.getSecret.mockResolvedValueOnce({
        key: "TOKEN",
        value: "secret-val",
      });
      mockForgeClient.executeTool.mockResolvedValueOnce({
        output: "pipeline-result",
      });

      const tool = tools.find((t) => t.name === "a2a_full_pipeline");
      const result = await tool.execute("call-9", {
        query: "translate",
        input: { auth: "{{TOKEN}}" },
        vault: "myvault",
        environment: "prod",
        maxPrice: 1.0,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.steps).toHaveLength(4);
      expect(parsed.steps[0].step).toBe("discover");
      expect(parsed.steps[1].step).toBe("budget_check");
      expect(parsed.steps[2].step).toBe("credentials");
      expect(parsed.steps[3].step).toBe("execute");
      expect(parsed.steps[3].success).toBe(true);
      expect(parsed.result.output).toBe("pipeline-result");
    });

    it("stops early when no tools are found", async () => {
      mockForgeClient.discoverTools.mockResolvedValueOnce([]);

      const tool = tools.find((t) => t.name === "a2a_full_pipeline");
      const result = await tool.execute("call-10", { query: "nonexistent" });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBe("No tools found");
      expect(parsed.steps).toHaveLength(1);
    });

    it("stops early when tool price exceeds maxPrice", async () => {
      mockForgeClient.discoverTools.mockResolvedValueOnce([
        { id: "t1", name: "Expensive", price: 50.0 },
      ]);

      const tool = tools.find((t) => t.name === "a2a_full_pipeline");
      const result = await tool.execute("call-11", {
        query: "expensive",
        maxPrice: 5.0,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("exceeds max");
    });

    it("skips credentials step when passbox is not configured", async () => {
      const noPbCfg: A2AConfig = {
        agentforge: { apiKey: "k" },
        apay: { apiKey: "a" },
      };

      const mock = createMockRegistrar();
      registerCompositeTools(mock.registrar, noPbCfg);
      const tool = mock.tools.find((t: any) => t.name === "a2a_full_pipeline");

      mockForgeClient.discoverTools.mockResolvedValueOnce([
        { id: "t1", name: "Tool", price: 0.01 },
      ]);
      mockApayFetch.mockResolvedValueOnce({ affordable: true });
      mockForgeClient.executeTool.mockResolvedValueOnce({ out: "ok" });

      const result = await tool.execute("call-12", { query: "test" });
      const parsed = JSON.parse(result.content[0].text);

      // Should only have discover, budget_check, execute (no credentials step)
      const stepNames = parsed.steps.map((s: any) => s.step);
      expect(stepNames).not.toContain("credentials");
      expect(stepNames).toContain("execute");
    });
  });

  // ── a2a_budget_status ─────────────────────────────────────────────

  describe("a2a_budget_status", () => {
    it("aggregates balances from both platforms", async () => {
      mockForgeClient.getBalance.mockResolvedValueOnce({
        balance: "25.00",
        tier: "pro",
      });
      mockApayFetch.mockResolvedValueOnce({
        balance: "100.00",
        network: "base-sepolia",
      });

      const tool = tools.find((t) => t.name === "a2a_budget_status");
      const result = await tool.execute();

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.agentforge.balance).toBe("25.00");
      expect(parsed.apay.balance).toBe("100.00");
    });

    it("reports error when forge balance check fails", async () => {
      mockForgeClient.getBalance.mockRejectedValueOnce(
        new Error("Forge unavailable"),
      );
      mockApayFetch.mockResolvedValueOnce({ balance: "50.00" });

      const tool = tools.find((t) => t.name === "a2a_budget_status");
      const result = await tool.execute();

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.agentforge.error).toBe("Forge unavailable");
      expect(parsed.apay.balance).toBe("50.00");
    });

    it("omits platforms without config", async () => {
      const minimalCfg: A2AConfig = { agentforge: { apiKey: "k" } };
      const mock = createMockRegistrar();
      registerCompositeTools(mock.registrar, minimalCfg);
      const tool = mock.tools.find((t: any) => t.name === "a2a_budget_status");

      mockForgeClient.getBalance.mockResolvedValueOnce({ balance: "10.00" });

      const result = await tool.execute();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.agentforge).toBeDefined();
      expect(parsed.apay).toBeUndefined();
    });
  });
});

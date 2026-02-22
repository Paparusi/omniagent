/**
 * Tests for tools/forge.ts — AgentForge marketplace tool registration and execution.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the service module
const mockForgeClient = vi.hoisted(() => ({
  discoverTools: vi.fn(),
  executeTool: vi.fn(),
  getToolSchema: vi.fn(),
  getBalance: vi.fn(),
  listCategories: vi.fn(),
  batchExecute: vi.fn(),
}));

vi.mock("../service.js", () => ({
  getForgeClient: vi.fn(() => mockForgeClient),
}));

import { registerForgeTools } from "../tools/forge.js";
import type { A2AConfig } from "../service.js";

// Helper: create a mock ToolRegistrar that captures registerTool calls
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

const cfg: A2AConfig = { agentforge: { apiKey: "test-key" } };

describe("forge tools", () => {
  let tools: any[];
  let registrar: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockRegistrar();
    tools = mock.tools;
    registrar = mock.registrar;
    registerForgeTools(registrar, cfg);
  });

  it("registers exactly 6 tools", () => {
    expect(tools).toHaveLength(6);
  });

  it("registers tools with correct names", () => {
    const names = tools.map((t) => t.name);
    expect(names).toEqual([
      "forge_discover",
      "forge_execute",
      "forge_get_schema",
      "forge_balance",
      "forge_list_categories",
      "forge_batch_execute",
    ]);
  });

  it("all tools have label, description, parameters, and execute", () => {
    for (const tool of tools) {
      expect(tool.label).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.parameters).toBeDefined();
      expect(typeof tool.execute).toBe("function");
    }
  });

  // ── forge_discover ──────────────────────────────────────────────

  describe("forge_discover", () => {
    it("calls discoverTools with params and returns formatted result", async () => {
      const mockTools = [{ id: "t1", name: "Summarizer", price: 0.05 }];
      mockForgeClient.discoverTools.mockResolvedValueOnce(mockTools);

      const tool = tools.find((t) => t.name === "forge_discover");
      const params = { query: "summarize", category: "nlp" };
      const result = await tool.execute("call-1", params);

      expect(mockForgeClient.discoverTools).toHaveBeenCalledWith(params);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual(mockTools);
    });
  });

  // ── forge_execute ───────────────────────────────────────────────

  describe("forge_execute", () => {
    it("calls executeTool with toolId and input", async () => {
      const mockResult = { output: "Hello world" };
      mockForgeClient.executeTool.mockResolvedValueOnce(mockResult);

      const tool = tools.find((t) => t.name === "forge_execute");
      const result = await tool.execute("call-2", {
        toolId: "tool-abc",
        input: { text: "test" },
      });

      expect(mockForgeClient.executeTool).toHaveBeenCalledWith("tool-abc", {
        text: "test",
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual(mockResult);
    });
  });

  // ── forge_get_schema ────────────────────────────────────────────

  describe("forge_get_schema", () => {
    it("calls getToolSchema and returns schema JSON", async () => {
      const schema = { input: { type: "object" }, output: { type: "string" } };
      mockForgeClient.getToolSchema.mockResolvedValueOnce(schema);

      const tool = tools.find((t) => t.name === "forge_get_schema");
      const result = await tool.execute("call-3", { toolId: "tool-xyz" });

      expect(mockForgeClient.getToolSchema).toHaveBeenCalledWith("tool-xyz");
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual(schema);
    });
  });

  // ── forge_balance ───────────────────────────────────────────────

  describe("forge_balance", () => {
    it("calls getBalance and returns balance info", async () => {
      const balance = { balance: "25.50", tier: "pro", totalSpent: "100.00" };
      mockForgeClient.getBalance.mockResolvedValueOnce(balance);

      const tool = tools.find((t) => t.name === "forge_balance");
      const result = await tool.execute();

      expect(mockForgeClient.getBalance).toHaveBeenCalled();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.balance).toBe("25.50");
      expect(parsed.tier).toBe("pro");
    });
  });

  // ── forge_list_categories ───────────────────────────────────────

  describe("forge_list_categories", () => {
    it("calls listCategories and returns category list", async () => {
      const categories = ["nlp", "vision", "code", "audio"];
      mockForgeClient.listCategories.mockResolvedValueOnce(categories);

      const tool = tools.find((t) => t.name === "forge_list_categories");
      const result = await tool.execute();

      expect(mockForgeClient.listCategories).toHaveBeenCalled();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual(categories);
    });
  });

  // ── forge_batch_execute ─────────────────────────────────────────

  describe("forge_batch_execute", () => {
    it("calls batchExecute with calls array", async () => {
      const batchResults = [
        { toolId: "t1", output: "r1" },
        { toolId: "t2", output: "r2" },
      ];
      mockForgeClient.batchExecute.mockResolvedValueOnce(batchResults);

      const calls = [
        { toolId: "t1", input: { a: 1 } },
        { toolId: "t2", input: { b: 2 } },
      ];
      const tool = tools.find((t) => t.name === "forge_batch_execute");
      const result = await tool.execute("call-5", { calls });

      expect(mockForgeClient.batchExecute).toHaveBeenCalledWith(calls);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveLength(2);
    });
  });
});

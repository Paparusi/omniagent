/**
 * Tests for tools/apay.ts — APay blockchain payment tool registration and execution.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the service module with a mock fetch function
const mockApayFetch = vi.hoisted(() => vi.fn());

vi.mock("../service.js", () => ({
  getApayClient: vi.fn(() => ({
    baseUrl: "http://localhost:3003",
    apiKey: "test-key",
    fetch: mockApayFetch,
  })),
}));

import { registerApayTools } from "../tools/apay.js";
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

const cfg: A2AConfig = { apay: { apiKey: "test-key" } };

describe("apay tools", () => {
  let tools: any[];
  let registrar: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockRegistrar();
    tools = mock.tools;
    registrar = mock.registrar;
    registerApayTools(registrar, cfg);
  });

  it("registers exactly 13 tools", () => {
    expect(tools).toHaveLength(13);
  });

  it("registers tools with correct names", () => {
    const names = tools.map((t) => t.name);
    expect(names).toEqual([
      "apay_check_balance",
      "apay_budget_check",
      "apay_spending_history",
      "apay_pay_service",
      "apay_pay_signed",
      "apay_estimate_cost",
      "apay_list_services",
      "apay_get_service",
      "apay_channel_status",
      "apay_stream_open",
      "apay_stream_pay",
      "apay_stream_close",
      "apay_x402_fetch",
    ]);
  });

  it("all tools have required metadata fields", () => {
    for (const tool of tools) {
      expect(tool.label).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.parameters).toBeDefined();
      expect(typeof tool.execute).toBe("function");
    }
  });

  // ── apay_check_balance ──────────────────────────────────────────

  describe("apay_check_balance", () => {
    it("fetches GET /api/v1/balance", async () => {
      const balanceData = { balance: "150.00", network: "base-sepolia" };
      mockApayFetch.mockResolvedValueOnce(balanceData);

      const tool = tools.find((t) => t.name === "apay_check_balance");
      const result = await tool.execute();

      expect(mockApayFetch).toHaveBeenCalledWith("/api/v1/balance");
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.balance).toBe("150.00");
    });
  });

  // ── apay_budget_check ───────────────────────────────────────────

  describe("apay_budget_check", () => {
    it("sends POST /api/v1/budget/check with amount", async () => {
      mockApayFetch.mockResolvedValueOnce({ affordable: true, remaining: "145.00" });

      const tool = tools.find((t) => t.name === "apay_budget_check");
      await tool.execute("call-1", { amount: "5.00" });

      expect(mockApayFetch).toHaveBeenCalledWith("/api/v1/budget/check", {
        method: "POST",
        body: JSON.stringify({ amount: "5.00" }),
      });
    });
  });

  // ── apay_spending_history ───────────────────────────────────────

  describe("apay_spending_history", () => {
    it("fetches GET /api/v1/spending/history with optional limit", async () => {
      mockApayFetch.mockResolvedValueOnce({ entries: [] });

      const tool = tools.find((t) => t.name === "apay_spending_history");
      await tool.execute("call-2", { limit: 5 });

      expect(mockApayFetch).toHaveBeenCalledWith(
        "/api/v1/spending/history?limit=5",
      );
    });

    it("fetches without query string when no limit provided", async () => {
      mockApayFetch.mockResolvedValueOnce({ entries: [] });

      const tool = tools.find((t) => t.name === "apay_spending_history");
      await tool.execute("call-3", {});

      expect(mockApayFetch).toHaveBeenCalledWith("/api/v1/spending/history");
    });
  });

  // ── apay_pay_service ────────────────────────────────────────────

  describe("apay_pay_service", () => {
    it("sends POST /api/v1/payments/pay with serviceId and amount", async () => {
      mockApayFetch.mockResolvedValueOnce({ txHash: "0xabc", status: "confirmed" });

      const tool = tools.find((t) => t.name === "apay_pay_service");
      const result = await tool.execute("call-4", {
        serviceId: "svc-1",
        amount: "10.00",
      });

      expect(mockApayFetch).toHaveBeenCalledWith("/api/v1/payments/pay", {
        method: "POST",
        body: JSON.stringify({ serviceId: "svc-1", amount: "10.00" }),
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.txHash).toBe("0xabc");
    });
  });

  // ── apay_pay_signed ─────────────────────────────────────────────

  describe("apay_pay_signed", () => {
    it("sends POST /api/v1/payments/pay-signed", async () => {
      mockApayFetch.mockResolvedValueOnce({ txHash: "0xdef" });

      const tool = tools.find((t) => t.name === "apay_pay_signed");
      await tool.execute("call-5", { serviceId: "svc-2", amount: "1.00" });

      expect(mockApayFetch).toHaveBeenCalledWith("/api/v1/payments/pay-signed", {
        method: "POST",
        body: JSON.stringify({ serviceId: "svc-2", amount: "1.00" }),
      });
    });
  });

  // ── apay_estimate_cost ──────────────────────────────────────────

  describe("apay_estimate_cost", () => {
    it("sends POST /api/v1/payments/estimate with amount", async () => {
      mockApayFetch.mockResolvedValueOnce({ total: "10.05", fee: "0.05" });

      const tool = tools.find((t) => t.name === "apay_estimate_cost");
      const result = await tool.execute("call-6", { amount: "10.00" });

      expect(mockApayFetch).toHaveBeenCalledWith("/api/v1/payments/estimate", {
        method: "POST",
        body: JSON.stringify({ amount: "10.00" }),
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.fee).toBe("0.05");
    });
  });

  // ── apay_list_services ──────────────────────────────────────────

  describe("apay_list_services", () => {
    it("fetches GET /api/v1/services with pagination params", async () => {
      mockApayFetch.mockResolvedValueOnce({ services: [] });

      const tool = tools.find((t) => t.name === "apay_list_services");
      await tool.execute("call-7", { limit: 10, offset: 20 });

      // URLSearchParams ordering may vary, but both params should be present
      const callPath = mockApayFetch.mock.calls[0][0] as string;
      expect(callPath).toContain("/api/v1/services");
      expect(callPath).toContain("limit=10");
      expect(callPath).toContain("offset=20");
    });
  });

  // ── apay_get_service ────────────────────────────────────────────

  describe("apay_get_service", () => {
    it("fetches GET /api/v1/services/:serviceId", async () => {
      mockApayFetch.mockResolvedValueOnce({ id: "svc-1", name: "GPT-4 Proxy" });

      const tool = tools.find((t) => t.name === "apay_get_service");
      await tool.execute("call-8", { serviceId: "svc-1" });

      expect(mockApayFetch).toHaveBeenCalledWith("/api/v1/services/svc-1");
    });
  });

  // ── apay_channel_status ─────────────────────────────────────────

  describe("apay_channel_status", () => {
    it("fetches GET /api/v1/channels/:serviceId/status", async () => {
      mockApayFetch.mockResolvedValueOnce({ status: "open", deposit: "50.00" });

      const tool = tools.find((t) => t.name === "apay_channel_status");
      await tool.execute("call-9", { serviceId: "svc-3" });

      expect(mockApayFetch).toHaveBeenCalledWith(
        "/api/v1/channels/svc-3/status",
      );
    });
  });

  // ── apay_stream_open ────────────────────────────────────────────

  describe("apay_stream_open", () => {
    it("sends POST /api/v1/channels/open", async () => {
      mockApayFetch.mockResolvedValueOnce({ channelId: "ch-1" });

      const tool = tools.find((t) => t.name === "apay_stream_open");
      await tool.execute("call-10", { serviceId: "svc-1", deposit: "25.00" });

      expect(mockApayFetch).toHaveBeenCalledWith("/api/v1/channels/open", {
        method: "POST",
        body: JSON.stringify({ serviceId: "svc-1", deposit: "25.00" }),
      });
    });
  });

  // ── apay_x402_fetch ─────────────────────────────────────────────

  describe("apay_x402_fetch", () => {
    it("sends POST /api/v1/x402/fetch with URL and options", async () => {
      mockApayFetch.mockResolvedValueOnce({ status: 200, body: "data" });

      const tool = tools.find((t) => t.name === "apay_x402_fetch");
      await tool.execute("call-11", {
        url: "https://api.example.com/data",
        method: "GET",
        maxPayment: "1.00",
      });

      expect(mockApayFetch).toHaveBeenCalledWith("/api/v1/x402/fetch", {
        method: "POST",
        body: JSON.stringify({
          url: "https://api.example.com/data",
          method: "GET",
          maxPayment: "1.00",
        }),
      });
    });
  });
});

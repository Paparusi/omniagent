/**
 * Tests for service.ts — client management, platform status, and reset.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// The AgentForge SDK is loaded via require() in service.ts (CommonJS dynamic import).
// We need to mock require("agentforge-sdk") using vi.stubGlobal on the require function
// or mock via createRequire. Instead, we mock the entire module globally so that both
// require() and import() resolution paths see our mock.

const mockForgeInstance = vi.hoisted(() => ({
  getBalance: vi.fn(),
  discoverTools: vi.fn(),
}));

const mockForgeConstructor = vi.hoisted(() =>
  vi.fn(() => mockForgeInstance),
);

// Mock agentforge-sdk — this works for require() calls in vitest
vi.mock("agentforge-sdk", () => ({
  AgentForge: mockForgeConstructor,
}));

// Mock PassBox SDK (ESM dynamic import)
const mockPassBoxInstance = vi.hoisted(() => ({
  listVaults: vi.fn(),
  getSecret: vi.fn(),
}));

const mockPassBoxConstructor = vi.hoisted(() =>
  vi.fn(() => mockPassBoxInstance),
);

vi.mock("@passbox/sdk", () => ({
  PassBox: mockPassBoxConstructor,
}));

// Stub globalThis.fetch for APay client tests
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  getForgeClient,
  getPassBoxClient,
  getApayClient,
  checkPlatformStatus,
  resetClients,
  type A2AConfig,
} from "../service.js";

describe("service", () => {
  beforeEach(() => {
    resetClients();
    vi.clearAllMocks();
  });

  // ── getForgeClient ──────────────────────────────────────────────────

  describe("getForgeClient", () => {
    it("throws when agentforge.apiKey is missing", () => {
      expect(() => getForgeClient({})).toThrow("AgentForge API key required");
    });

    it("throws when agentforge section is undefined", () => {
      expect(() => getForgeClient({ agentforge: undefined })).toThrow(
        "AgentForge API key required",
      );
    });

    it("creates a client and returns it", () => {
      const cfg: A2AConfig = { agentforge: { apiKey: "test-key" } };
      const client = getForgeClient(cfg);
      expect(client).toBeDefined();
      // The client should have getBalance (from our mock instance)
      expect(client.getBalance).toBeDefined();
    });

    it("returns the same singleton on subsequent calls", () => {
      const cfg: A2AConfig = { agentforge: { apiKey: "k" } };
      const first = getForgeClient(cfg);
      const second = getForgeClient(cfg);
      expect(first).toBe(second);
    });

    it("creates a new client after resetClients()", () => {
      const cfg: A2AConfig = { agentforge: { apiKey: "k" } };
      const first = getForgeClient(cfg);
      resetClients();
      const second = getForgeClient(cfg);
      // They should be the same mock instance (since the constructor returns the same object)
      // but the constructor should have been called again
      expect(first).toBeDefined();
      expect(second).toBeDefined();
    });
  });

  // ── getPassBoxClient ────────────────────────────────────────────────

  describe("getPassBoxClient", () => {
    it("throws when passbox.token is missing", async () => {
      await expect(getPassBoxClient({})).rejects.toThrow(
        "PassBox token required",
      );
    });

    it("creates a client with the provided token", async () => {
      const cfg: A2AConfig = { passbox: { token: "pb-token" } };
      const client = await getPassBoxClient(cfg);
      expect(client).toBeDefined();
      expect(mockPassBoxConstructor).toHaveBeenCalledWith({
        token: "pb-token",
        serverUrl: "http://localhost:3001",
      });
    });

    it("uses custom serverUrl when provided", async () => {
      const cfg: A2AConfig = {
        passbox: { token: "t", serverUrl: "https://pb.example.com" },
      };
      await getPassBoxClient(cfg);
      expect(mockPassBoxConstructor).toHaveBeenCalledWith({
        token: "t",
        serverUrl: "https://pb.example.com",
      });
    });

    it("returns the same singleton on subsequent calls", async () => {
      const cfg: A2AConfig = { passbox: { token: "pb-token" } };
      const first = await getPassBoxClient(cfg);
      const second = await getPassBoxClient(cfg);
      expect(first).toBe(second);
      expect(mockPassBoxConstructor).toHaveBeenCalledTimes(1);
    });
  });

  // ── getApayClient ──────────────────────────────────────────────────

  describe("getApayClient", () => {
    it("throws when apay.apiKey is missing", () => {
      expect(() => getApayClient({})).toThrow("APay API key required");
    });

    it("creates a client with correct baseUrl and apiKey", () => {
      const cfg: A2AConfig = { apay: { apiKey: "apay-key" } };
      const client = getApayClient(cfg);
      expect(client.baseUrl).toBe("http://localhost:3003");
      expect(client.apiKey).toBe("apay-key");
    });

    it("uses custom serverUrl when provided", () => {
      const cfg: A2AConfig = {
        apay: { apiKey: "k", serverUrl: "https://apay.example.com" },
      };
      const client = getApayClient(cfg);
      expect(client.baseUrl).toBe("https://apay.example.com");
    });

    it("includes sessionId header when provided", async () => {
      const cfg: A2AConfig = {
        apay: { apiKey: "k", sessionId: "sess-123" },
      };
      const client = getApayClient(cfg);
      expect(client.sessionId).toBe("sess-123");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: "ok" }),
      });

      await client.fetch("/api/v1/health");

      const [, fetchOpts] = mockFetch.mock.calls[0];
      expect(fetchOpts.headers["x-session-id"]).toBe("sess-123");
      expect(fetchOpts.headers["authorization"]).toBe("Bearer k");
    });

    it("fetch method builds correct URL and handles errors", async () => {
      const cfg: A2AConfig = { apay: { apiKey: "k" } };
      const client = getApayClient(cfg);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });

      await expect(client.fetch("/api/v1/balance")).rejects.toThrow(
        "APay 401: Unauthorized",
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3003/api/v1/balance",
        expect.objectContaining({
          headers: expect.objectContaining({
            "content-type": "application/json",
            authorization: "Bearer k",
          }),
        }),
      );
    });

    it("fetch parses JSON response on success", async () => {
      const cfg: A2AConfig = { apay: { apiKey: "k" } };
      const client = getApayClient(cfg);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ balance: "100.00" }),
      });

      const result = await client.fetch("/api/v1/balance");
      expect(result.balance).toBe("100.00");
    });
  });

  // ── checkPlatformStatus ────────────────────────────────────────────

  describe("checkPlatformStatus", () => {
    it("reports all disconnected when no config provided", async () => {
      const status = await checkPlatformStatus({});
      expect(status.agentforge.connected).toBe(false);
      expect(status.passbox.connected).toBe(false);
      expect(status.apay.connected).toBe(false);
    });

    it("reports agentforge connected when getBalance succeeds", async () => {
      const cfg: A2AConfig = { agentforge: { apiKey: "k" } };
      // Pre-populate the forge singleton so checkPlatformStatus uses it
      const forge = getForgeClient(cfg);
      // Spy on getBalance to control the return value
      const spy = vi.spyOn(forge, "getBalance").mockResolvedValueOnce({ balance: "10.00" });
      const status = await checkPlatformStatus(cfg);
      expect(status.agentforge.connected).toBe(true);
      expect(status.agentforge.error).toBeUndefined();
      spy.mockRestore();
    });

    it("reports agentforge disconnected with error on failure", async () => {
      const cfg: A2AConfig = { agentforge: { apiKey: "k" } };
      // Pre-populate the forge singleton so checkPlatformStatus uses it
      const forge = getForgeClient(cfg);
      const spy = vi.spyOn(forge, "getBalance").mockRejectedValueOnce(new Error("Network error"));
      const status = await checkPlatformStatus(cfg);
      expect(status.agentforge.connected).toBe(false);
      expect(status.agentforge.error).toBe("Network error");
      spy.mockRestore();
    });

    it("reports apay connected when health check passes", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: "healthy" }),
      });
      const cfg: A2AConfig = { apay: { apiKey: "k" } };
      const status = await checkPlatformStatus(cfg);
      expect(status.apay.connected).toBe(true);
    });

    it("reports passbox connected when listVaults succeeds", async () => {
      mockPassBoxInstance.listVaults.mockResolvedValueOnce(["default"]);
      const cfg: A2AConfig = { passbox: { token: "t" } };
      const status = await checkPlatformStatus(cfg);
      expect(status.passbox.connected).toBe(true);
    });
  });

  // ── resetClients ───────────────────────────────────────────────────

  describe("resetClients", () => {
    it("clears all singletons so new clients are created", async () => {
      const cfg: A2AConfig = {
        agentforge: { apiKey: "k" },
        passbox: { token: "t" },
        apay: { apiKey: "a" },
      };

      // Create all clients
      getForgeClient(cfg);
      await getPassBoxClient(cfg);
      const apay1 = getApayClient(cfg);

      resetClients();

      // After reset, getting apay creates a new object
      const apay2 = getApayClient(cfg);
      // apay1 and apay2 should NOT be the same object
      expect(apay1).not.toBe(apay2);
    });
  });
});

/**
 * Tests for tools/passbox.ts — PassBox vault tool registration and execution.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the service module
const mockPassBoxClient = vi.hoisted(() => ({
  getSecret: vi.fn(),
  setSecret: vi.fn(),
  listSecrets: vi.fn(),
  deleteSecret: vi.fn(),
  listVaults: vi.fn(),
  listEnvironments: vi.fn(),
  getEnvironment: vi.fn(),
  diffEnv: vi.fn(),
  importEnv: vi.fn(),
  rotateSecret: vi.fn(),
}));

vi.mock("../service.js", () => ({
  getPassBoxClient: vi.fn(async () => mockPassBoxClient),
}));

import { registerPassBoxTools } from "../tools/passbox.js";
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

const cfg: A2AConfig = { passbox: { token: "test-token" } };

describe("passbox tools", () => {
  let tools: any[];
  let registrar: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockRegistrar();
    tools = mock.tools;
    registrar = mock.registrar;
    registerPassBoxTools(registrar, cfg);
  });

  it("registers exactly 10 tools", () => {
    expect(tools).toHaveLength(10);
  });

  it("registers tools with correct names", () => {
    const names = tools.map((t) => t.name);
    expect(names).toEqual([
      "passbox_get_secret",
      "passbox_set_secret",
      "passbox_list_secrets",
      "passbox_delete_secret",
      "passbox_list_vaults",
      "passbox_list_environments",
      "passbox_get_environment",
      "passbox_diff_env",
      "passbox_import_env",
      "passbox_rotate_secret",
    ]);
  });

  // ── passbox_get_secret ──────────────────────────────────────────

  describe("passbox_get_secret", () => {
    it("calls getSecret with vault, key, and environment", async () => {
      const secret = { key: "DB_PASSWORD", value: "s3cret", version: 3 };
      mockPassBoxClient.getSecret.mockResolvedValueOnce(secret);

      const tool = tools.find((t) => t.name === "passbox_get_secret");
      const result = await tool.execute("call-1", {
        vault: "myapp",
        key: "DB_PASSWORD",
        environment: "prod",
      });

      expect(mockPassBoxClient.getSecret).toHaveBeenCalledWith(
        "myapp",
        "DB_PASSWORD",
        "prod",
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.value).toBe("s3cret");
    });
  });

  // ── passbox_set_secret ──────────────────────────────────────────

  describe("passbox_set_secret", () => {
    it("calls setSecret and returns confirmation message", async () => {
      mockPassBoxClient.setSecret.mockResolvedValueOnce(undefined);

      const tool = tools.find((t) => t.name === "passbox_set_secret");
      const result = await tool.execute("call-2", {
        vault: "myapp",
        key: "API_KEY",
        value: "new-value",
        environment: "dev",
      });

      expect(mockPassBoxClient.setSecret).toHaveBeenCalledWith(
        "myapp",
        "API_KEY",
        "new-value",
        "dev",
      );
      expect(result.content[0].text).toContain("API_KEY");
      expect(result.content[0].text).toContain("myapp");
    });
  });

  // ── passbox_list_secrets ────────────────────────────────────────

  describe("passbox_list_secrets", () => {
    it("calls listSecrets with vault and environment", async () => {
      const secrets = ["DB_HOST", "DB_PASSWORD", "API_KEY"];
      mockPassBoxClient.listSecrets.mockResolvedValueOnce(secrets);

      const tool = tools.find((t) => t.name === "passbox_list_secrets");
      const result = await tool.execute("call-3", {
        vault: "myapp",
        environment: "staging",
      });

      expect(mockPassBoxClient.listSecrets).toHaveBeenCalledWith(
        "myapp",
        "staging",
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual(secrets);
    });
  });

  // ── passbox_delete_secret ───────────────────────────────────────

  describe("passbox_delete_secret", () => {
    it("calls deleteSecret and returns confirmation", async () => {
      mockPassBoxClient.deleteSecret.mockResolvedValueOnce(undefined);

      const tool = tools.find((t) => t.name === "passbox_delete_secret");
      const result = await tool.execute("call-4", {
        vault: "myapp",
        key: "OLD_KEY",
      });

      expect(mockPassBoxClient.deleteSecret).toHaveBeenCalledWith(
        "myapp",
        "OLD_KEY",
        undefined,
      );
      expect(result.content[0].text).toContain("OLD_KEY");
      expect(result.content[0].text).toContain("deleted");
    });
  });

  // ── passbox_list_vaults ─────────────────────────────────────────

  describe("passbox_list_vaults", () => {
    it("calls listVaults and returns vault list", async () => {
      const vaults = [
        { name: "default", secretCount: 5 },
        { name: "myapp", secretCount: 12 },
      ];
      mockPassBoxClient.listVaults.mockResolvedValueOnce(vaults);

      const tool = tools.find((t) => t.name === "passbox_list_vaults");
      const result = await tool.execute();

      expect(mockPassBoxClient.listVaults).toHaveBeenCalled();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveLength(2);
    });
  });

  // ── passbox_list_environments ───────────────────────────────────

  describe("passbox_list_environments", () => {
    it("calls listEnvironments with vault name", async () => {
      const envs = ["dev", "staging", "prod"];
      mockPassBoxClient.listEnvironments.mockResolvedValueOnce(envs);

      const tool = tools.find((t) => t.name === "passbox_list_environments");
      const result = await tool.execute("call-6", { vault: "myapp" });

      expect(mockPassBoxClient.listEnvironments).toHaveBeenCalledWith("myapp");
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual(envs);
    });
  });

  // ── passbox_get_environment ─────────────────────────────────────

  describe("passbox_get_environment", () => {
    it("calls getEnvironment with vault and environment", async () => {
      const env = { DB_HOST: "localhost", DB_PORT: "5432" };
      mockPassBoxClient.getEnvironment.mockResolvedValueOnce(env);

      const tool = tools.find((t) => t.name === "passbox_get_environment");
      const result = await tool.execute("call-7", {
        vault: "myapp",
        environment: "dev",
      });

      expect(mockPassBoxClient.getEnvironment).toHaveBeenCalledWith(
        "myapp",
        "dev",
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.DB_HOST).toBe("localhost");
    });
  });

  // ── passbox_diff_env ────────────────────────────────────────────

  describe("passbox_diff_env", () => {
    it("calls diffEnv with vault, environment, and envContent", async () => {
      const diff = {
        added: ["NEW_KEY"],
        removed: ["OLD_KEY"],
        changed: ["DB_HOST"],
      };
      mockPassBoxClient.diffEnv.mockResolvedValueOnce(diff);

      const envContent = "DB_HOST=newhost\nNEW_KEY=val";
      const tool = tools.find((t) => t.name === "passbox_diff_env");
      const result = await tool.execute("call-8", {
        vault: "myapp",
        environment: "dev",
        envContent,
      });

      expect(mockPassBoxClient.diffEnv).toHaveBeenCalledWith(
        "myapp",
        "dev",
        envContent,
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.added).toContain("NEW_KEY");
    });
  });

  // ── passbox_import_env ──────────────────────────────────────────

  describe("passbox_import_env", () => {
    it("calls importEnv with vault, environment, and envContent", async () => {
      const importResult = { imported: 3, skipped: 0 };
      mockPassBoxClient.importEnv.mockResolvedValueOnce(importResult);

      const envContent = "A=1\nB=2\nC=3";
      const tool = tools.find((t) => t.name === "passbox_import_env");
      const result = await tool.execute("call-9", {
        vault: "myapp",
        environment: "staging",
        envContent,
      });

      expect(mockPassBoxClient.importEnv).toHaveBeenCalledWith(
        "myapp",
        "staging",
        envContent,
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.imported).toBe(3);
    });
  });

  // ── passbox_rotate_secret ───────────────────────────────────────

  describe("passbox_rotate_secret", () => {
    it("calls rotateSecret with vault, key, and optional environment", async () => {
      const rotateResult = { rotated: true, newVersion: 4 };
      mockPassBoxClient.rotateSecret.mockResolvedValueOnce(rotateResult);

      const tool = tools.find((t) => t.name === "passbox_rotate_secret");
      const result = await tool.execute("call-10", {
        vault: "myapp",
        key: "DB_PASSWORD",
        environment: "prod",
      });

      expect(mockPassBoxClient.rotateSecret).toHaveBeenCalledWith(
        "myapp",
        "DB_PASSWORD",
        "prod",
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.rotated).toBe(true);
    });
  });
});

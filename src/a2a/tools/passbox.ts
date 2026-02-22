/**
 * PassBox vault tools — zero-knowledge secrets management for AI agents.
 */
import { Type } from "@sinclair/typebox";
import type { A2AConfig } from "../config.js";
import { getPassBoxClient } from "../service.js";

export interface ToolRegistrar {
  registerTool(tool: any, opts?: any): void;
}

export function registerPassBoxTools(api: ToolRegistrar, cfg: A2AConfig) {
  // ── passbox_get_secret ─────────────────────────────────────────
  api.registerTool({
    name: "passbox_get_secret",
    label: "Get Secret",
    description: "Retrieve a secret value from a PassBox vault. The value is decrypted client-side.",
    parameters: Type.Object({
      vault: Type.String({ description: "Vault name" }),
      key: Type.String({ description: "Secret key name" }),
      environment: Type.Optional(Type.String({ description: "Environment (dev, staging, prod)" })),
    }),
    async execute(_id: string, params: any) {
      const pb = await getPassBoxClient(cfg);
      const secret = await pb.getSecret(params.vault, params.key, params.environment);
      return { content: [{ type: "text", text: JSON.stringify(secret, null, 2) }] };
    },
  });

  // ── passbox_set_secret ─────────────────────────────────────────
  api.registerTool({
    name: "passbox_set_secret",
    label: "Set Secret",
    description: "Create or update a secret in a PassBox vault. Encrypted before upload.",
    parameters: Type.Object({
      vault: Type.String({ description: "Vault name" }),
      key: Type.String({ description: "Secret key name" }),
      value: Type.String({ description: "Secret value (encrypted before storage)" }),
      environment: Type.Optional(Type.String({ description: "Environment (dev, staging, prod)" })),
    }),
    async execute(_id: string, params: any) {
      const pb = await getPassBoxClient(cfg);
      await pb.setSecret(params.vault, params.key, params.value, params.environment);
      return { content: [{ type: "text", text: `Secret '${params.key}' saved to vault '${params.vault}'` }] };
    },
  });

  // ── passbox_list_secrets ───────────────────────────────────────
  api.registerTool({
    name: "passbox_list_secrets",
    label: "List Secrets",
    description: "List all secret names in a PassBox vault (values are not returned).",
    parameters: Type.Object({
      vault: Type.String({ description: "Vault name" }),
      environment: Type.Optional(Type.String({ description: "Environment filter" })),
    }),
    async execute(_id: string, params: any) {
      const pb = await getPassBoxClient(cfg);
      const secrets = await pb.listSecrets(params.vault, params.environment);
      return { content: [{ type: "text", text: JSON.stringify(secrets, null, 2) }] };
    },
  });

  // ── passbox_delete_secret ──────────────────────────────────────
  api.registerTool({
    name: "passbox_delete_secret",
    label: "Delete Secret",
    description: "Delete a secret from a PassBox vault.",
    parameters: Type.Object({
      vault: Type.String({ description: "Vault name" }),
      key: Type.String({ description: "Secret key name" }),
      environment: Type.Optional(Type.String({ description: "Environment" })),
    }),
    async execute(_id: string, params: any) {
      const pb = await getPassBoxClient(cfg);
      await pb.deleteSecret(params.vault, params.key, params.environment);
      return { content: [{ type: "text", text: `Secret '${params.key}' deleted from vault '${params.vault}'` }] };
    },
  });

  // ── passbox_list_vaults ────────────────────────────────────────
  api.registerTool({
    name: "passbox_list_vaults",
    label: "List Vaults",
    description: "List all available PassBox vaults.",
    parameters: Type.Object({}),
    async execute() {
      const pb = await getPassBoxClient(cfg);
      const vaults = await pb.listVaults();
      return { content: [{ type: "text", text: JSON.stringify(vaults, null, 2) }] };
    },
  });

  // ── passbox_list_environments ──────────────────────────────────
  api.registerTool({
    name: "passbox_list_environments",
    label: "List Environments",
    description: "List environments in a PassBox vault (e.g. dev, staging, prod).",
    parameters: Type.Object({
      vault: Type.String({ description: "Vault name" }),
    }),
    async execute(_id: string, params: any) {
      const pb = await getPassBoxClient(cfg);
      const envs = await pb.listEnvironments(params.vault);
      return { content: [{ type: "text", text: JSON.stringify(envs, null, 2) }] };
    },
  });

  // ── passbox_get_environment ────────────────────────────────────
  api.registerTool({
    name: "passbox_get_environment",
    label: "Get Environment",
    description: "Get all secrets in an environment as key-value pairs.",
    parameters: Type.Object({
      vault: Type.String({ description: "Vault name" }),
      environment: Type.String({ description: "Environment name" }),
    }),
    async execute(_id: string, params: any) {
      const pb = await getPassBoxClient(cfg);
      const env = await pb.getEnvironment(params.vault, params.environment);
      return { content: [{ type: "text", text: JSON.stringify(env, null, 2) }] };
    },
  });

  // ── passbox_diff_env ───────────────────────────────────────────
  api.registerTool({
    name: "passbox_diff_env",
    label: "Diff .env",
    description: "Compare a local .env file with PassBox vault secrets. Shows additions, removals, and changes.",
    parameters: Type.Object({
      vault: Type.String({ description: "Vault name" }),
      environment: Type.String({ description: "Environment name" }),
      envContent: Type.String({ description: ".env file content (KEY=VALUE lines)" }),
    }),
    async execute(_id: string, params: any) {
      const pb = await getPassBoxClient(cfg);
      const diff = await pb.diffEnv(params.vault, params.environment, params.envContent);
      return { content: [{ type: "text", text: JSON.stringify(diff, null, 2) }] };
    },
  });

  // ── passbox_import_env ─────────────────────────────────────────
  api.registerTool({
    name: "passbox_import_env",
    label: "Import .env",
    description: "Import .env file content into a PassBox vault environment.",
    parameters: Type.Object({
      vault: Type.String({ description: "Vault name" }),
      environment: Type.String({ description: "Environment name" }),
      envContent: Type.String({ description: ".env file content (KEY=VALUE lines)" }),
    }),
    async execute(_id: string, params: any) {
      const pb = await getPassBoxClient(cfg);
      const result = await pb.importEnv(params.vault, params.environment, params.envContent);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  // ── passbox_rotate_secret ──────────────────────────────────────
  api.registerTool({
    name: "passbox_rotate_secret",
    label: "Rotate Secret",
    description: "Trigger manual rotation for a secret in PassBox.",
    parameters: Type.Object({
      vault: Type.String({ description: "Vault name" }),
      key: Type.String({ description: "Secret key to rotate" }),
      environment: Type.Optional(Type.String({ description: "Environment" })),
    }),
    async execute(_id: string, params: any) {
      const pb = await getPassBoxClient(cfg);
      const result = await pb.rotateSecret(params.vault, params.key, params.environment);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });
}

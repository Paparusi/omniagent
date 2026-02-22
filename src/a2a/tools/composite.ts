/**
 * Composite cross-platform tools — workflows spanning AgentForge + PassBox + APay.
 */
import { Type } from "@sinclair/typebox";
import type { A2AConfig } from "../config.js";
import { getForgeClient, getPassBoxClient, getApayClient } from "../service.js";

export interface ToolRegistrar {
  registerTool(tool: any, opts?: any): void;
}

export function registerCompositeTools(api: ToolRegistrar, cfg: A2AConfig) {
  // ── a2a_discover_and_pay ───────────────────────────────────────
  api.registerTool({
    name: "a2a_discover_and_pay",
    label: "Discover & Pay",
    description:
      "Find a tool on AgentForge, estimate cost via APay, and optionally pay. Combined workflow.",
    parameters: Type.Object({
      query: Type.String({ description: "Search query for tool discovery" }),
      autoPay: Type.Optional(Type.Boolean({ description: "Auto-pay if affordable (default false)" })),
      maxPrice: Type.Optional(Type.Number({ description: "Max price in USD" })),
    }),
    async execute(_id: string, params: any) {
      const forge = getForgeClient(cfg);
      const apay = getApayClient(cfg);

      // 1. Discover tools
      const tools = await forge.discoverTools({ query: params.query, limit: 5 });
      if (!tools?.length) {
        return { content: [{ type: "text", text: "No tools found for query: " + params.query }] };
      }

      // 2. Pick the top result
      const tool = tools[0];

      // 3. Estimate cost
      let estimate;
      try {
        estimate = await apay.fetch("/api/v1/payments/estimate", {
          method: "POST",
          body: JSON.stringify({ amount: String(tool.price || "0.01") }),
        });
      } catch {
        estimate = { total: tool.price || "0.01", fee: "0.00" };
      }

      const result: any = {
        tool: { id: tool.id, name: tool.name, price: tool.price },
        estimate,
        paid: false,
      };

      // 4. Auto-pay if requested and affordable
      if (params.autoPay && (!params.maxPrice || (tool.price || 0) <= params.maxPrice)) {
        try {
          const payment = await apay.fetch("/api/v1/payments/pay", {
            method: "POST",
            body: JSON.stringify({ serviceId: tool.id, amount: String(tool.price || "0.01") }),
          });
          result.paid = true;
          result.payment = payment;
        } catch (e: any) {
          result.paymentError = e.message;
        }
      }

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  // ── a2a_secure_execute ─────────────────────────────────────────
  api.registerTool({
    name: "a2a_secure_execute",
    label: "Secure Execute",
    description:
      "Execute an AgentForge tool with PassBox credentials automatically injected. " +
      "Secrets referenced as {{SECRET_NAME}} in the input are resolved from the vault.",
    parameters: Type.Object({
      toolId: Type.String({ description: "AgentForge tool ID" }),
      input: Type.Unknown({ description: "Tool input (may contain {{SECRET_NAME}} placeholders)" }),
      vault: Type.Optional(Type.String({ description: "PassBox vault for credentials (default 'default')" })),
      environment: Type.Optional(Type.String({ description: "Environment (dev, staging, prod)" })),
    }),
    async execute(_id: string, params: any) {
      const forge = getForgeClient(cfg);
      const pb = await getPassBoxClient(cfg);

      // Resolve secret placeholders in input
      let inputStr = JSON.stringify(params.input);
      const placeholders = inputStr.match(/\{\{(\w+)\}\}/g) || [];

      for (const ph of placeholders) {
        const key = ph.replace(/\{\{|\}\}/g, "");
        try {
          const secret = await pb.getSecret(
            params.vault || "default",
            key,
            params.environment,
          );
          inputStr = inputStr.replace(ph, secret.value || "");
        } catch {
          // Leave placeholder if secret not found
        }
      }

      const resolvedInput = JSON.parse(inputStr);
      const result = await forge.executeTool(params.toolId, resolvedInput);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            toolId: params.toolId,
            secretsInjected: placeholders.length,
            result,
          }, null, 2),
        }],
      };
    },
  });

  // ── a2a_full_pipeline ──────────────────────────────────────────
  api.registerTool({
    name: "a2a_full_pipeline",
    label: "Full Pipeline",
    description:
      "End-to-end workflow: discover tool -> budget check -> resolve credentials -> execute. " +
      "Combines AgentForge, APay, and PassBox in a single call.",
    parameters: Type.Object({
      query: Type.String({ description: "What you need the tool to do" }),
      input: Type.Optional(Type.Unknown({ description: "Tool input (may contain {{SECRET_NAME}} placeholders)" })),
      vault: Type.Optional(Type.String({ description: "PassBox vault (default 'default')" })),
      environment: Type.Optional(Type.String({ description: "Environment for secrets" })),
      maxPrice: Type.Optional(Type.Number({ description: "Max acceptable price in USD" })),
    }),
    async execute(_id: string, params: any) {
      const forge = getForgeClient(cfg);
      const apay = getApayClient(cfg);

      const pipeline: any = { steps: [] };

      // Step 1: Discover
      const tools = await forge.discoverTools({ query: params.query, limit: 3 });
      pipeline.steps.push({ step: "discover", found: tools?.length || 0 });

      if (!tools?.length) {
        pipeline.error = "No tools found";
        return { content: [{ type: "text", text: JSON.stringify(pipeline, null, 2) }] };
      }

      const tool = tools[0];
      pipeline.tool = { id: tool.id, name: tool.name, price: tool.price };

      // Step 2: Budget check
      if (params.maxPrice && (tool.price || 0) > params.maxPrice) {
        pipeline.error = `Tool price $${tool.price} exceeds max $${params.maxPrice}`;
        return { content: [{ type: "text", text: JSON.stringify(pipeline, null, 2) }] };
      }

      try {
        const budget = await apay.fetch("/api/v1/budget/check", {
          method: "POST",
          body: JSON.stringify({ amount: String(tool.price || "0.01") }),
        });
        pipeline.steps.push({ step: "budget_check", affordable: budget.affordable !== false });
      } catch {
        pipeline.steps.push({ step: "budget_check", skipped: true });
      }

      // Step 3: Resolve credentials
      let resolvedInput = params.input || {};
      if (cfg.passbox?.token) {
        try {
          const pb = await getPassBoxClient(cfg);
          let inputStr = JSON.stringify(resolvedInput);
          const placeholders = inputStr.match(/\{\{(\w+)\}\}/g) || [];
          for (const ph of placeholders) {
            const key = ph.replace(/\{\{|\}\}/g, "");
            try {
              const secret = await pb.getSecret(params.vault || "default", key, params.environment);
              inputStr = inputStr.replace(ph, secret.value || "");
            } catch { /* skip */ }
          }
          resolvedInput = JSON.parse(inputStr);
          pipeline.steps.push({ step: "credentials", injected: placeholders.length });
        } catch {
          pipeline.steps.push({ step: "credentials", skipped: true });
        }
      }

      // Step 4: Execute
      try {
        const result = await forge.executeTool(tool.id, resolvedInput);
        pipeline.steps.push({ step: "execute", success: true });
        pipeline.result = result;
      } catch (e: any) {
        pipeline.steps.push({ step: "execute", error: e.message });
      }

      return { content: [{ type: "text", text: JSON.stringify(pipeline, null, 2) }] };
    },
  });

  // ── a2a_budget_status ──────────────────────────────────────────
  api.registerTool({
    name: "a2a_budget_status",
    label: "Budget Status",
    description: "Unified budget overview across AgentForge (USD) and APay (USDC).",
    parameters: Type.Object({}),
    async execute() {
      const status: any = {};

      // AgentForge balance
      if (cfg.agentforge?.apiKey) {
        try {
          const forge = getForgeClient(cfg);
          status.agentforge = await forge.getBalance();
        } catch (e: any) {
          status.agentforge = { error: e.message };
        }
      }

      // APay balance
      if (cfg.apay?.apiKey) {
        try {
          const apay = getApayClient(cfg);
          status.apay = await apay.fetch("/api/v1/balance");
        } catch (e: any) {
          status.apay = { error: e.message };
        }
      }

      return { content: [{ type: "text", text: JSON.stringify(status, null, 2) }] };
    },
  });
}

/**
 * APay blockchain payment tools — USDC payments, channels, and x402.
 */
import { Type } from "@sinclair/typebox";
import type { A2AConfig } from "../config.js";
import { getApayClient } from "../service.js";

export interface ToolRegistrar {
  registerTool(tool: any, opts?: any): void;
}

export function registerApayTools(api: ToolRegistrar, cfg: A2AConfig) {
  // ── apay_check_balance ─────────────────────────────────────────
  api.registerTool({
    name: "apay_check_balance",
    label: "Check Balance",
    description: "Check USDC balance, daily available budget, and spending limits.",
    parameters: Type.Object({}),
    async execute() {
      const apay = getApayClient(cfg);
      const result = await apay.fetch("/api/v1/balance");
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  // ── apay_budget_check ──────────────────────────────────────────
  api.registerTool({
    name: "apay_budget_check",
    label: "Budget Check",
    description: "Verify if a specific amount is affordable against balance and spending limits.",
    parameters: Type.Object({
      amount: Type.String({ description: "Amount in USDC to check (e.g. '5.00')" }),
    }),
    async execute(_id: string, params: any) {
      const apay = getApayClient(cfg);
      const result = await apay.fetch("/api/v1/budget/check", {
        method: "POST",
        body: JSON.stringify({ amount: params.amount }),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  // ── apay_spending_history ──────────────────────────────────────
  api.registerTool({
    name: "apay_spending_history",
    label: "Spending History",
    description: "Get spending analytics and session history.",
    parameters: Type.Object({
      limit: Type.Optional(Type.Number({ description: "Max entries (default 20)" })),
    }),
    async execute(_id: string, params: any) {
      const apay = getApayClient(cfg);
      const qs = params.limit ? `?limit=${params.limit}` : "";
      const result = await apay.fetch(`/api/v1/spending/history${qs}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  // ── apay_pay_service ───────────────────────────────────────────
  api.registerTool({
    name: "apay_pay_service",
    label: "Pay Service",
    description: "Pay a service provider. The agent pays gas from the escrow session.",
    parameters: Type.Object({
      serviceId: Type.String({ description: "Service ID to pay" }),
      amount: Type.String({ description: "Amount in USDC" }),
    }),
    async execute(_id: string, params: any) {
      const apay = getApayClient(cfg);
      const result = await apay.fetch("/api/v1/payments/pay", {
        method: "POST",
        body: JSON.stringify(params),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  // ── apay_pay_signed ────────────────────────────────────────────
  api.registerTool({
    name: "apay_pay_signed",
    label: "Gasless Payment",
    description: "Gasless signed payment — agent signs off-chain, server submits on-chain.",
    parameters: Type.Object({
      serviceId: Type.String({ description: "Service ID to pay" }),
      amount: Type.String({ description: "Amount in USDC" }),
    }),
    async execute(_id: string, params: any) {
      const apay = getApayClient(cfg);
      const result = await apay.fetch("/api/v1/payments/pay-signed", {
        method: "POST",
        body: JSON.stringify(params),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  // ── apay_estimate_cost ─────────────────────────────────────────
  api.registerTool({
    name: "apay_estimate_cost",
    label: "Estimate Cost",
    description: "Estimate payment cost including 0.5% platform fee.",
    parameters: Type.Object({
      amount: Type.String({ description: "Amount in USDC" }),
    }),
    async execute(_id: string, params: any) {
      const apay = getApayClient(cfg);
      const result = await apay.fetch("/api/v1/payments/estimate", {
        method: "POST",
        body: JSON.stringify({ amount: params.amount }),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  // ── apay_list_services ─────────────────────────────────────────
  api.registerTool({
    name: "apay_list_services",
    label: "List Services",
    description: "List available APay services with pagination.",
    parameters: Type.Object({
      limit: Type.Optional(Type.Number({ description: "Max results (default 20)" })),
      offset: Type.Optional(Type.Number({ description: "Pagination offset" })),
    }),
    async execute(_id: string, params: any) {
      const apay = getApayClient(cfg);
      const qs = new URLSearchParams();
      if (params.limit) qs.set("limit", String(params.limit));
      if (params.offset) qs.set("offset", String(params.offset));
      const q = qs.toString() ? `?${qs}` : "";
      const result = await apay.fetch(`/api/v1/services${q}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  // ── apay_get_service ───────────────────────────────────────────
  api.registerTool({
    name: "apay_get_service",
    label: "Get Service",
    description: "Get detailed info about a specific APay service.",
    parameters: Type.Object({
      serviceId: Type.String({ description: "Service ID" }),
    }),
    async execute(_id: string, params: any) {
      const apay = getApayClient(cfg);
      const result = await apay.fetch(`/api/v1/services/${params.serviceId}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  // ── apay_channel_status ────────────────────────────────────────
  api.registerTool({
    name: "apay_channel_status",
    label: "Channel Status",
    description: "Check payment channel status to a service.",
    parameters: Type.Object({
      serviceId: Type.String({ description: "Service ID" }),
    }),
    async execute(_id: string, params: any) {
      const apay = getApayClient(cfg);
      const result = await apay.fetch(`/api/v1/channels/${params.serviceId}/status`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  // ── apay_stream_open ───────────────────────────────────────────
  api.registerTool({
    name: "apay_stream_open",
    label: "Open Channel",
    description: "Open a streaming payment channel with USDC deposit.",
    parameters: Type.Object({
      serviceId: Type.String({ description: "Service ID" }),
      deposit: Type.String({ description: "Deposit amount in USDC" }),
    }),
    async execute(_id: string, params: any) {
      const apay = getApayClient(cfg);
      const result = await apay.fetch("/api/v1/channels/open", {
        method: "POST",
        body: JSON.stringify(params),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  // ── apay_stream_pay ────────────────────────────────────────────
  api.registerTool({
    name: "apay_stream_pay",
    label: "Stream Payment",
    description: "Sign off-chain streaming micropayment.",
    parameters: Type.Object({
      channelId: Type.String({ description: "Channel ID" }),
      amount: Type.String({ description: "Micropayment amount in USDC" }),
    }),
    async execute(_id: string, params: any) {
      const apay = getApayClient(cfg);
      const result = await apay.fetch("/api/v1/channels/pay", {
        method: "POST",
        body: JSON.stringify(params),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  // ── apay_stream_close ──────────────────────────────────────────
  api.registerTool({
    name: "apay_stream_close",
    label: "Close Channel",
    description: "Close payment channel and refund unspent funds.",
    parameters: Type.Object({
      channelId: Type.String({ description: "Channel ID" }),
    }),
    async execute(_id: string, params: any) {
      const apay = getApayClient(cfg);
      const result = await apay.fetch("/api/v1/channels/close", {
        method: "POST",
        body: JSON.stringify({ channelId: params.channelId }),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });

  // ── apay_x402_fetch ────────────────────────────────────────────
  api.registerTool({
    name: "apay_x402_fetch",
    label: "x402 Fetch",
    description:
      "Fetch a URL with automatic x402 payment handling. If the server responds with HTTP 402, automatically pays and retries.",
    parameters: Type.Object({
      url: Type.String({ description: "URL to fetch" }),
      method: Type.Optional(Type.String({ description: "HTTP method (default GET)" })),
      body: Type.Optional(Type.String({ description: "Request body (JSON string)" })),
      maxPayment: Type.Optional(Type.String({ description: "Maximum auto-payment in USDC (default 1.00)" })),
    }),
    async execute(_id: string, params: any) {
      const apay = getApayClient(cfg);
      const result = await apay.fetch("/api/v1/x402/fetch", {
        method: "POST",
        body: JSON.stringify(params),
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  });
}

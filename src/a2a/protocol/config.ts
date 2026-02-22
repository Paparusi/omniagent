/**
 * A2A Protocol configuration — types and environment variable loading.
 */

export interface A2AProtocolConfig {
  enabled: boolean;
  baseUrl?: string;

  server?: {
    enabled?: boolean;
    exposeAgents?: string[];
    maxTasks?: number;
    taskExpiryMinutes?: number;
    streaming?: boolean;
    pushNotifications?: boolean;
  };

  client?: {
    enabled?: boolean;
    timeoutSeconds?: number;
    cacheTtlMinutes?: number;
    agents?: Array<{
      url: string;
      name?: string;
      authToken?: string;
      authVault?: string;
      authSecretKey?: string;
    }>;
  };

  auth?: {
    mode?: "gateway" | "token" | "none";
    token?: string;
    allowPublicDiscovery?: boolean;
  };

  agentforge?: {
    registerInMarketplace?: boolean;
    useForDiscovery?: boolean;
  };

  apay?: {
    requirePayment?: boolean;
    pricePerTask?: number;
    pricePerMessage?: number;
  };
}

export function loadA2AProtocolConfig(): A2AProtocolConfig {
  const enabled = process.env.A2A_PROTOCOL_ENABLED === "true";

  return {
    enabled,
    baseUrl: process.env.A2A_BASE_URL || process.env.OMNIAGENT_BASE_URL,
    server: {
      enabled: enabled && process.env.A2A_SERVER_ENABLED !== "false",
      exposeAgents: process.env.A2A_EXPOSE_AGENTS
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      maxTasks: Number(process.env.A2A_MAX_TASKS) || 100,
      taskExpiryMinutes: Number(process.env.A2A_TASK_EXPIRY_MINUTES) || 60,
      streaming: process.env.A2A_STREAMING !== "false",
      pushNotifications: process.env.A2A_PUSH_NOTIFICATIONS === "true",
    },
    client: {
      enabled: enabled && process.env.A2A_CLIENT_ENABLED !== "false",
      timeoutSeconds: Number(process.env.A2A_TIMEOUT_SECONDS) || 120,
      cacheTtlMinutes: Number(process.env.A2A_CACHE_TTL_MINUTES) || 5,
    },
    auth: {
      mode:
        (process.env.A2A_AUTH_MODE as "gateway" | "token" | "none") ??
        "gateway",
      token: process.env.A2A_AUTH_TOKEN,
      allowPublicDiscovery: process.env.A2A_PUBLIC_DISCOVERY !== "false",
    },
    agentforge: {
      registerInMarketplace:
        process.env.A2A_REGISTER_IN_MARKETPLACE === "true",
      useForDiscovery: process.env.A2A_USE_FORGE_DISCOVERY !== "false",
    },
    apay: {
      requirePayment: process.env.A2A_REQUIRE_PAYMENT === "true",
      pricePerTask: Number(process.env.A2A_PRICE_PER_TASK) || 0,
      pricePerMessage: Number(process.env.A2A_PRICE_PER_MESSAGE) || 0,
    },
  };
}

/**
 * A2A Corp configuration — types and environment variable loading.
 *
 * When running as a core module the config is derived from process.env
 * rather than from the plugin config block in omniagent.json.
 */

export interface A2AConfig {
  enabled: boolean;
  agentforge?: { apiKey: string; baseUrl: string };
  passbox?: { token: string; serverUrl: string };
  apay?: {
    apiKey: string;
    serverUrl: string;
    sessionId?: string;
    chain?: string;
    agentPrivateKey?: string;
    escrowAddress?: string;
    serviceRegistryAddress?: string;
  };
}

export function loadA2AConfig(): A2AConfig {
  const enabled = process.env.A2A_ENABLED !== "false";

  const agentforge = process.env.AGENTFORGE_API_KEY
    ? {
        apiKey: process.env.AGENTFORGE_API_KEY,
        baseUrl: process.env.AGENTFORGE_BASE_URL || "http://localhost:3002",
      }
    : undefined;

  const passbox = process.env.PASSBOX_TOKEN
    ? {
        token: process.env.PASSBOX_TOKEN,
        serverUrl: process.env.PASSBOX_SERVER || "http://localhost:3001",
      }
    : undefined;

  const apay = process.env.APAY_API_KEY
    ? {
        apiKey: process.env.APAY_API_KEY,
        serverUrl: process.env.APAY_SERVER_URL || "http://localhost:3003",
        sessionId: process.env.APAY_SESSION_ID,
        chain: process.env.APAY_CHAIN || "base",
        agentPrivateKey: process.env.APAY_AGENT_PRIVATE_KEY,
        escrowAddress: process.env.APAY_ESCROW_ADDRESS,
        serviceRegistryAddress: process.env.APAY_SERVICE_REGISTRY_ADDRESS,
      }
    : undefined;

  return { enabled, agentforge, passbox, apay };
}

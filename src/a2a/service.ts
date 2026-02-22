/**
 * A2A Corp client management — lazy-initialized singletons for each platform.
 *
 * Core module version: uses A2AConfig from ./config.js instead of the
 * plugin's local config interface.
 */

import type { A2AConfig } from "./config.js";

// Re-export for convenience (tools import A2AConfig from here or config.js)
export type { A2AConfig };

// ---------------------------------------------------------------------------
// AgentForge client
// ---------------------------------------------------------------------------

let forgeClient: any = null;

export function getForgeClient(cfg: A2AConfig): any {
  if (forgeClient) return forgeClient;
  if (!cfg.agentforge?.apiKey) {
    throw new Error("AgentForge API key required — set AGENTFORGE_API_KEY in env");
  }
  // Dynamic import to avoid hard dependency at load time
  const { AgentForge } = require("agentforge-sdk");
  forgeClient = new AgentForge({
    apiKey: cfg.agentforge.apiKey,
    baseUrl: cfg.agentforge.baseUrl || "http://localhost:3002",
  });
  return forgeClient;
}

// ---------------------------------------------------------------------------
// PassBox client
// ---------------------------------------------------------------------------

let passboxClient: any = null;

export async function getPassBoxClient(cfg: A2AConfig): Promise<any> {
  if (passboxClient) return passboxClient;
  if (!cfg.passbox?.token) {
    throw new Error("PassBox token required — set PASSBOX_TOKEN in env");
  }
  // PassBox SDK is ESM-only, use dynamic import
  const { PassBox } = await import("@passbox/sdk");
  passboxClient = new PassBox({
    token: cfg.passbox.token,
    serverUrl: cfg.passbox.serverUrl || "http://localhost:3001",
  });
  return passboxClient;
}

// ---------------------------------------------------------------------------
// APay — lightweight HTTP client (no heavy blockchain deps)
// ---------------------------------------------------------------------------

export interface ApayHttpClient {
  baseUrl: string;
  apiKey: string;
  sessionId?: string;
  fetch(path: string, opts?: RequestInit): Promise<any>;
}

let apayClient: ApayHttpClient | null = null;

export function getApayClient(cfg: A2AConfig): ApayHttpClient {
  if (apayClient) return apayClient;
  if (!cfg.apay?.apiKey) {
    throw new Error("APay API key required — set APAY_API_KEY in env");
  }
  const baseUrl = cfg.apay.serverUrl || "http://localhost:3003";
  const apiKey = cfg.apay.apiKey;
  const sessionId = cfg.apay.sessionId;

  apayClient = {
    baseUrl,
    apiKey,
    sessionId,
    async fetch(path: string, opts: RequestInit = {}) {
      const url = `${baseUrl}${path}`;
      const headers: Record<string, string> = {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        ...(opts.headers as Record<string, string> || {}),
      };
      if (sessionId) headers["x-session-id"] = sessionId;

      const res = await globalThis.fetch(url, { ...opts, headers });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`APay ${res.status}: ${text}`);
      }
      return res.json();
    },
  };
  return apayClient;
}

// ---------------------------------------------------------------------------
// Platform status
// ---------------------------------------------------------------------------

export interface PlatformStatus {
  agentforge: { connected: boolean; error?: string };
  passbox: { connected: boolean; error?: string };
  apay: { connected: boolean; error?: string };
}

export async function checkPlatformStatus(cfg: A2AConfig): Promise<PlatformStatus> {
  const status: PlatformStatus = {
    agentforge: { connected: false },
    passbox: { connected: false },
    apay: { connected: false },
  };

  // AgentForge
  if (cfg.agentforge?.apiKey) {
    try {
      const forge = getForgeClient(cfg);
      await forge.getBalance();
      status.agentforge.connected = true;
    } catch (e: any) {
      status.agentforge.error = e.message;
    }
  }

  // PassBox
  if (cfg.passbox?.token) {
    try {
      const pb = await getPassBoxClient(cfg);
      await pb.listVaults();
      status.passbox.connected = true;
    } catch (e: any) {
      status.passbox.error = e.message;
    }
  }

  // APay
  if (cfg.apay?.apiKey) {
    try {
      const apay = getApayClient(cfg);
      await apay.fetch("/api/v1/health");
      status.apay.connected = true;
    } catch (e: any) {
      status.apay.error = e.message;
    }
  }

  return status;
}

// ---------------------------------------------------------------------------
// Reset (for testing)
// ---------------------------------------------------------------------------

export function resetClients(): void {
  forgeClient = null;
  passboxClient = null;
  apayClient = null;
}

/**
 * A2A Protocol server authentication — validates incoming A2A requests
 * against the configured auth mode.
 *
 * Supported modes:
 *   - "none"    — all requests are accepted (local dev only).
 *   - "token"   — bearer token must match the configured secret.
 *   - "gateway" — same as token mode; the token is validated against the
 *                 gateway's shared secret (default).
 *
 * Token comparison uses `timingSafeEqual` to prevent timing side-channels.
 */
import { timingSafeEqual } from "node:crypto";

// ── Protocol Config ─────────────────────────────────────────────

/**
 * A2A Protocol-level configuration for the server module.
 *
 * This is separate from the top-level `A2AConfig` (which covers
 * AgentForge/PassBox/APay credentials) and focuses solely on the
 * A2A protocol server behaviour.
 */
export interface A2AProtocolConfig {
  /** Base URL where the A2A server is reachable. */
  baseUrl?: string;
  /** Authentication settings for incoming A2A requests. */
  auth?: {
    /** Auth mode: "none" disables auth, "token" and "gateway" require a bearer token. */
    mode?: "none" | "token" | "gateway";
    /** The expected bearer token. */
    token?: string;
  };
  /** Server-specific settings. */
  server?: {
    /** List of agent IDs to expose via the A2A protocol. */
    exposeAgents?: string[];
    /** Enable SSE streaming support (default: true). */
    streaming?: boolean;
    /** Enable push notification support (default: false). */
    pushNotifications?: boolean;
  };
}

// ── Auth Result ─────────────────────────────────────────────────

export interface A2AAuthResult {
  ok: boolean;
  error?: string;
}

// ── Authorization ───────────────────────────────────────────────

/**
 * Authorize an incoming A2A request by validating the bearer token
 * in the `Authorization` header against the server configuration.
 */
export function authorizeA2ARequest(params: {
  authHeader?: string;
  config: A2AProtocolConfig;
}): A2AAuthResult {
  const { authHeader, config } = params;
  const mode = config.auth?.mode ?? "gateway";

  // "none" mode — accept everything
  if (mode === "none") {
    return { ok: true };
  }

  // All other modes require a header
  if (!authHeader) {
    return { ok: false, error: "Authorization header required" };
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return { ok: false, error: "Empty bearer token" };
  }

  // Resolve the expected token — both "token" and "gateway" modes
  // use the configured secret.
  const expectedToken = config.auth?.token;

  if (!expectedToken) {
    return { ok: false, error: "No auth token configured on server" };
  }

  // Timing-safe comparison to prevent side-channel attacks
  const a = Buffer.from(token);
  const b = Buffer.from(expectedToken);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, error: "Invalid token" };
  }

  return { ok: true };
}

import type { A2AAgentCard } from "../types.js";
import { A2A_DEFAULT_CACHE_TTL_MS } from "../constants.js";

interface CacheEntry {
  card: A2AAgentCard;
  fetchedAt: number;
}

export interface CardCacheOptions {
  ttlMs?: number;
}

export class A2ACardCache {
  private cache = new Map<string, CacheEntry>();
  private ttlMs: number;

  constructor(opts: CardCacheOptions = {}) {
    this.ttlMs = opts.ttlMs ?? A2A_DEFAULT_CACHE_TTL_MS;
  }

  async fetchCard(baseUrl: string, opts?: { timeout?: number; forceRefresh?: boolean }): Promise<A2AAgentCard> {
    const normalized = baseUrl.replace(/\/$/, "");

    if (!opts?.forceRefresh) {
      const cached = this.getCached(normalized);
      if (cached) return cached;
    }

    const cardUrl = `${normalized}/.well-known/agent-card.json`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts?.timeout ?? 10_000);

    try {
      const res = await fetch(cardUrl, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch agent card from ${cardUrl}: ${res.status} ${res.statusText}`);
      }

      const card = (await res.json()) as A2AAgentCard;
      this.cache.set(normalized, { card, fetchedAt: Date.now() });
      return card;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  getCached(baseUrl: string): A2AAgentCard | undefined {
    const normalized = baseUrl.replace(/\/$/, "");
    const entry = this.cache.get(normalized);
    if (!entry) return undefined;
    if (Date.now() - entry.fetchedAt > this.ttlMs) {
      this.cache.delete(normalized);
      return undefined;
    }
    return entry.card;
  }

  listCached(): A2AAgentCard[] {
    const now = Date.now();
    const results: A2AAgentCard[] = [];
    for (const [key, entry] of this.cache) {
      if (now - entry.fetchedAt > this.ttlMs) {
        this.cache.delete(key);
      } else {
        results.push(entry.card);
      }
    }
    return results;
  }

  clear(): void {
    this.cache.clear();
  }
}

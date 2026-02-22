import type { A2AAgentCard } from "../types.js";
import { A2ACardCache } from "./card-cache.js";

export interface RegistryAgent {
  url: string;
  name?: string;
  authToken?: string;
  authVault?: string;
  authSecretKey?: string;
}

export class A2AAgentRegistry {
  private knownAgents: RegistryAgent[] = [];
  private cardCache: A2ACardCache;

  constructor(cardCache: A2ACardCache) {
    this.cardCache = cardCache;
  }

  registerAgent(agent: RegistryAgent): void {
    const exists = this.knownAgents.some(a => a.url === agent.url);
    if (!exists) this.knownAgents.push(agent);
  }

  unregisterAgent(url: string): void {
    this.knownAgents = this.knownAgents.filter(a => a.url !== url);
  }

  getKnownAgents(): RegistryAgent[] {
    return [...this.knownAgents];
  }

  getAgentAuth(url: string): RegistryAgent | undefined {
    return this.knownAgents.find(a => a.url === url);
  }

  async discover(params: {
    query?: string;
    tags?: string[];
    limit?: number;
  }): Promise<A2AAgentCard[]> {
    const results: A2AAgentCard[] = [];
    const limit = params.limit ?? 10;

    // Fetch cards from all known agents
    const fetchPromises = this.knownAgents.map(async (agent) => {
      try {
        return await this.cardCache.fetchCard(agent.url);
      } catch {
        return undefined;
      }
    });

    const cards = (await Promise.all(fetchPromises)).filter(Boolean) as A2AAgentCard[];

    // Also include already-cached cards
    for (const cached of this.cardCache.listCached()) {
      if (!cards.some(c => c.url === cached.url)) {
        cards.push(cached);
      }
    }

    // Filter by query
    for (const card of cards) {
      if (results.length >= limit) break;

      let matches = true;

      if (params.query) {
        const q = params.query.toLowerCase();
        const searchable = `${card.name} ${card.description} ${card.skills.map(s => `${s.name} ${s.description} ${(s.tags ?? []).join(" ")}`).join(" ")}`.toLowerCase();
        matches = searchable.includes(q);
      }

      if (matches && params.tags?.length) {
        const allTags = card.skills.flatMap(s => s.tags ?? []);
        matches = params.tags.some(t => allTags.includes(t));
      }

      if (matches) results.push(card);
    }

    return results;
  }

  loadFromConfig(agents: RegistryAgent[]): void {
    for (const agent of agents) {
      this.registerAgent(agent);
    }
  }
}

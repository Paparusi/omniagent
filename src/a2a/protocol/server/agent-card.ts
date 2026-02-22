/**
 * A2A Agent Card generator — builds A2A Agent Card descriptors from
 * OmniAgent configuration.
 *
 * The Agent Card is served at `/.well-known/agent-card.json` and describes
 * the agent's capabilities, skills, and authentication requirements so that
 * remote A2A clients can discover and interact with the agent.
 */
import type { A2AAgentCard, A2ACapabilities, A2ASkill } from "../types.js";
import { A2A_PROTOCOL_VERSION } from "../constants.js";

// ── Parameters ──────────────────────────────────────────────────

export interface AgentCardParams {
  agentId: string;
  agentName: string;
  description?: string;
  baseUrl: string;
  skills?: A2ASkill[];
  capabilities?: Partial<A2ACapabilities>;
  toolNames?: string[];
}

// ── Generator ───────────────────────────────────────────────────

/**
 * Generate an A2A v0.2 Agent Card from OmniAgent configuration.
 *
 * When explicit `skills` are not provided, they are derived from the
 * supplied `toolNames` — each tool becomes a skill entry with a
 * human-readable name, a generic description, and the first segment of
 * the tool name used as a tag.
 */
export function generateAgentCard(params: AgentCardParams): A2AAgentCard {
  // Build skills from toolNames if not explicitly provided
  const skills: A2ASkill[] =
    params.skills ??
    (params.toolNames ?? []).map((name) => ({
      id: name,
      name: name.replace(/_/g, " "),
      description: `Execute ${name} tool`,
      tags: [name.split("_")[0]],
    }));

  return {
    name: params.agentName,
    description:
      params.description ?? `${params.agentName} — OmniAgent A2A service`,
    url: params.baseUrl,
    version: A2A_PROTOCOL_VERSION,
    capabilities: {
      streaming: params.capabilities?.streaming ?? true,
      pushNotifications: params.capabilities?.pushNotifications ?? false,
      stateTransitionHistory:
        params.capabilities?.stateTransitionHistory ?? true,
    },
    skills,
    defaultInputModes: ["text"],
    defaultOutputModes: ["text"],
    provider: {
      organization: "OmniAgent",
      url: "https://github.com/Paparusi/omniagent",
    },
    authentication: {
      schemes: [{ scheme: "bearer", in: "header", name: "Authorization" }],
    },
  };
}

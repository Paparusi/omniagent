/**
 * A2A Protocol translator — converts between A2A protocol messages and
 * OmniAgent's internal agent format.
 *
 * Inbound (A2A -> OmniAgent):
 *   - Text parts become plain text.
 *   - File parts become descriptive placeholders with URI or base64 note.
 *   - Data parts are serialized as fenced JSON blocks.
 *
 * Outbound (OmniAgent -> A2A):
 *   - Plain text becomes an A2A message with a single text part.
 *   - Files become A2A artifacts with file parts.
 */
import type {
  A2AMessage,
  A2APart,
  A2AArtifact,
  A2ATextPart,
  A2ADataPart,
} from "../types.js";

// ── Inbound: A2A -> OmniAgent ───────────────────────────────────

/**
 * Convert an A2A message into a plain-text string suitable for
 * OmniAgent agent input.
 *
 * Each part type is converted to a human-readable text representation
 * so that downstream agents can process the content regardless of
 * whether they natively support file or structured-data parts.
 */
export function a2aMessageToAgentInput(message: A2AMessage): string {
  const segments: string[] = [];

  for (const part of message.parts) {
    switch (part.type) {
      case "text":
        segments.push(part.text);
        break;
      case "file":
        if (part.file.uri) {
          segments.push(
            `[File: ${part.file.name ?? "attachment"} — ${part.file.uri}]`,
          );
        } else if (part.file.bytes) {
          segments.push(
            `[File: ${part.file.name ?? "attachment"} (${part.file.mimeType ?? "application/octet-stream"}, inline base64)]`,
          );
        }
        break;
      case "data":
        segments.push(
          "```json\n" + JSON.stringify(part.data, null, 2) + "\n```",
        );
        break;
    }
  }

  return segments.join("\n\n");
}

// ── Outbound: OmniAgent -> A2A ──────────────────────────────────

/**
 * Convert agent text output into an A2A message with a single text part.
 */
export function agentOutputToA2AMessage(text: string): A2AMessage {
  return {
    role: "agent",
    parts: [{ type: "text", text }],
  };
}

/**
 * Convert agent output into A2A artifacts.
 *
 * A text response becomes the primary artifact at index 0. Any files
 * are appended as subsequent artifacts with their original names and
 * MIME types preserved.
 */
export function agentOutputToA2AArtifacts(
  text: string,
  files?: Array<{ name: string; mimeType: string; bytes: string }>,
): A2AArtifact[] {
  const artifacts: A2AArtifact[] = [];

  // Text artifact
  if (text) {
    artifacts.push({
      name: "response",
      parts: [{ type: "text", text }],
      index: 0,
      lastChunk: true,
    });
  }

  // File artifacts
  if (files) {
    for (let i = 0; i < files.length; i++) {
      artifacts.push({
        name: files[i].name,
        parts: [
          {
            type: "file",
            file: {
              name: files[i].name,
              mimeType: files[i].mimeType,
              bytes: files[i].bytes,
            },
          },
        ],
        index: (text ? 1 : 0) + i,
        lastChunk: true,
      });
    }
  }

  return artifacts;
}

// ── Extraction Helpers ──────────────────────────────────────────

/**
 * Extract plain text from an A2A message by concatenating all text parts.
 */
export function extractTextFromMessage(message: A2AMessage): string {
  return message.parts
    .filter((p): p is A2ATextPart => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

/**
 * Extract structured data from an A2A message. Each data part is
 * returned as a record; array-typed data is wrapped in an `{ items }`
 * envelope for consistency.
 */
export function extractDataFromMessage(
  message: A2AMessage,
): Record<string, unknown>[] {
  return message.parts
    .filter((p): p is A2ADataPart => p.type === "data")
    .map((p) => (Array.isArray(p.data) ? { items: p.data } : p.data));
}

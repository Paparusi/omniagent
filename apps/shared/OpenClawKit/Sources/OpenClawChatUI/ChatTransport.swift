import Foundation

public enum OmniAgentChatTransportEvent: Sendable {
    case health(ok: Bool)
    case tick
    case chat(OmniAgentChatEventPayload)
    case agent(OmniAgentAgentEventPayload)
    case seqGap
}

public protocol OmniAgentChatTransport: Sendable {
    func requestHistory(sessionKey: String) async throws -> OmniAgentChatHistoryPayload
    func sendMessage(
        sessionKey: String,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [OmniAgentChatAttachmentPayload]) async throws -> OmniAgentChatSendResponse

    func abortRun(sessionKey: String, runId: String) async throws
    func listSessions(limit: Int?) async throws -> OmniAgentChatSessionsListResponse

    func requestHealth(timeoutMs: Int) async throws -> Bool
    func events() -> AsyncStream<OmniAgentChatTransportEvent>

    func setActiveSessionKey(_ sessionKey: String) async throws
}

extension OmniAgentChatTransport {
    public func setActiveSessionKey(_: String) async throws {}

    public func abortRun(sessionKey _: String, runId _: String) async throws {
        throw NSError(
            domain: "OmniAgentChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "chat.abort not supported by this transport"])
    }

    public func listSessions(limit _: Int?) async throws -> OmniAgentChatSessionsListResponse {
        throw NSError(
            domain: "OmniAgentChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.list not supported by this transport"])
    }
}

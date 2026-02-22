import Foundation

public enum OmniAgentLocationMode: String, Codable, Sendable, CaseIterable {
    case off
    case whileUsing
    case always
}

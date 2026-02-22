import Foundation

public enum OmniAgentCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum OmniAgentCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum OmniAgentCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum OmniAgentCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct OmniAgentCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: OmniAgentCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: OmniAgentCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: OmniAgentCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: OmniAgentCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct OmniAgentCameraClipParams: Codable, Sendable, Equatable {
    public var facing: OmniAgentCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: OmniAgentCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: OmniAgentCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: OmniAgentCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}

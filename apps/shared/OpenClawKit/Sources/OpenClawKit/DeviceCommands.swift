import Foundation

public enum OmniAgentDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum OmniAgentBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum OmniAgentThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum OmniAgentNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum OmniAgentNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct OmniAgentBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: OmniAgentBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: OmniAgentBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct OmniAgentThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: OmniAgentThermalState

    public init(state: OmniAgentThermalState) {
        self.state = state
    }
}

public struct OmniAgentStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct OmniAgentNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: OmniAgentNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [OmniAgentNetworkInterfaceType]

    public init(
        status: OmniAgentNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [OmniAgentNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct OmniAgentDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: OmniAgentBatteryStatusPayload
    public var thermal: OmniAgentThermalStatusPayload
    public var storage: OmniAgentStorageStatusPayload
    public var network: OmniAgentNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: OmniAgentBatteryStatusPayload,
        thermal: OmniAgentThermalStatusPayload,
        storage: OmniAgentStorageStatusPayload,
        network: OmniAgentNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct OmniAgentDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}

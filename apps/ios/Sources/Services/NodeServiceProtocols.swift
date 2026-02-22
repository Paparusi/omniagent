import CoreLocation
import Foundation
import OmniAgentKit
import UIKit

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: OmniAgentCameraSnapParams) async throws -> (format: String, base64: String, width: Int, height: Int)
    func clip(params: OmniAgentCameraClipParams) async throws -> (format: String, base64: String, durationMs: Int, hasAudio: Bool)
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: OmniAgentLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: OmniAgentLocationGetParams,
        desiredAccuracy: OmniAgentLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
    func startLocationUpdates(
        desiredAccuracy: OmniAgentLocationAccuracy,
        significantChangesOnly: Bool) -> AsyncStream<CLLocation>
    func stopLocationUpdates()
    func startMonitoringSignificantLocationChanges(onUpdate: @escaping @Sendable (CLLocation) -> Void)
    func stopMonitoringSignificantLocationChanges()
}

protocol DeviceStatusServicing: Sendable {
    func status() async throws -> OmniAgentDeviceStatusPayload
    func info() -> OmniAgentDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: OmniAgentPhotosLatestParams) async throws -> OmniAgentPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: OmniAgentContactsSearchParams) async throws -> OmniAgentContactsSearchPayload
    func add(params: OmniAgentContactsAddParams) async throws -> OmniAgentContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: OmniAgentCalendarEventsParams) async throws -> OmniAgentCalendarEventsPayload
    func add(params: OmniAgentCalendarAddParams) async throws -> OmniAgentCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: OmniAgentRemindersListParams) async throws -> OmniAgentRemindersListPayload
    func add(params: OmniAgentRemindersAddParams) async throws -> OmniAgentRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: OmniAgentMotionActivityParams) async throws -> OmniAgentMotionActivityPayload
    func pedometer(params: OmniAgentPedometerParams) async throws -> OmniAgentPedometerPayload
}

struct WatchMessagingStatus: Sendable, Equatable {
    var supported: Bool
    var paired: Bool
    var appInstalled: Bool
    var reachable: Bool
    var activationState: String
}

struct WatchQuickReplyEvent: Sendable, Equatable {
    var replyId: String
    var promptId: String
    var actionId: String
    var actionLabel: String?
    var sessionKey: String?
    var note: String?
    var sentAtMs: Int?
    var transport: String
}

struct WatchNotificationSendResult: Sendable, Equatable {
    var deliveredImmediately: Bool
    var queuedForDelivery: Bool
    var transport: String
}

protocol WatchMessagingServicing: AnyObject, Sendable {
    func status() async -> WatchMessagingStatus
    func setReplyHandler(_ handler: (@Sendable (WatchQuickReplyEvent) -> Void)?)
    func sendNotification(
        id: String,
        params: OmniAgentWatchNotifyParams) async throws -> WatchNotificationSendResult
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}

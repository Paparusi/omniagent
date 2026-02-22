import Foundation

public enum OmniAgentRemindersCommand: String, Codable, Sendable {
    case list = "reminders.list"
    case add = "reminders.add"
}

public enum OmniAgentReminderStatusFilter: String, Codable, Sendable {
    case incomplete
    case completed
    case all
}

public struct OmniAgentRemindersListParams: Codable, Sendable, Equatable {
    public var status: OmniAgentReminderStatusFilter?
    public var limit: Int?

    public init(status: OmniAgentReminderStatusFilter? = nil, limit: Int? = nil) {
        self.status = status
        self.limit = limit
    }
}

public struct OmniAgentRemindersAddParams: Codable, Sendable, Equatable {
    public var title: String
    public var dueISO: String?
    public var notes: String?
    public var listId: String?
    public var listName: String?

    public init(
        title: String,
        dueISO: String? = nil,
        notes: String? = nil,
        listId: String? = nil,
        listName: String? = nil)
    {
        self.title = title
        self.dueISO = dueISO
        self.notes = notes
        self.listId = listId
        self.listName = listName
    }
}

public struct OmniAgentReminderPayload: Codable, Sendable, Equatable {
    public var identifier: String
    public var title: String
    public var dueISO: String?
    public var completed: Bool
    public var listName: String?

    public init(
        identifier: String,
        title: String,
        dueISO: String? = nil,
        completed: Bool,
        listName: String? = nil)
    {
        self.identifier = identifier
        self.title = title
        self.dueISO = dueISO
        self.completed = completed
        self.listName = listName
    }
}

public struct OmniAgentRemindersListPayload: Codable, Sendable, Equatable {
    public var reminders: [OmniAgentReminderPayload]

    public init(reminders: [OmniAgentReminderPayload]) {
        self.reminders = reminders
    }
}

public struct OmniAgentRemindersAddPayload: Codable, Sendable, Equatable {
    public var reminder: OmniAgentReminderPayload

    public init(reminder: OmniAgentReminderPayload) {
        self.reminder = reminder
    }
}

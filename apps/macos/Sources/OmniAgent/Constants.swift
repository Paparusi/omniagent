import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-omniagent writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.omniagent.mac"
let gatewayLaunchdLabel = "ai.omniagent.gateway"
let onboardingVersionKey = "omniagent.onboardingVersion"
let onboardingSeenKey = "omniagent.onboardingSeen"
let currentOnboardingVersion = 7
let pauseDefaultsKey = "omniagent.pauseEnabled"
let iconAnimationsEnabledKey = "omniagent.iconAnimationsEnabled"
let swabbleEnabledKey = "omniagent.swabbleEnabled"
let swabbleTriggersKey = "omniagent.swabbleTriggers"
let voiceWakeTriggerChimeKey = "omniagent.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "omniagent.voiceWakeSendChime"
let showDockIconKey = "omniagent.showDockIcon"
let defaultVoiceWakeTriggers = ["omniagent"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "omniagent.voiceWakeMicID"
let voiceWakeMicNameKey = "omniagent.voiceWakeMicName"
let voiceWakeLocaleKey = "omniagent.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "omniagent.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "omniagent.voicePushToTalkEnabled"
let talkEnabledKey = "omniagent.talkEnabled"
let iconOverrideKey = "omniagent.iconOverride"
let connectionModeKey = "omniagent.connectionMode"
let remoteTargetKey = "omniagent.remoteTarget"
let remoteIdentityKey = "omniagent.remoteIdentity"
let remoteProjectRootKey = "omniagent.remoteProjectRoot"
let remoteCliPathKey = "omniagent.remoteCliPath"
let canvasEnabledKey = "omniagent.canvasEnabled"
let cameraEnabledKey = "omniagent.cameraEnabled"
let systemRunPolicyKey = "omniagent.systemRunPolicy"
let systemRunAllowlistKey = "omniagent.systemRunAllowlist"
let systemRunEnabledKey = "omniagent.systemRunEnabled"
let locationModeKey = "omniagent.locationMode"
let locationPreciseKey = "omniagent.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "omniagent.peekabooBridgeEnabled"
let deepLinkKeyKey = "omniagent.deepLinkKey"
let modelCatalogPathKey = "omniagent.modelCatalogPath"
let modelCatalogReloadKey = "omniagent.modelCatalogReload"
let cliInstallPromptedVersionKey = "omniagent.cliInstallPromptedVersion"
let heartbeatsEnabledKey = "omniagent.heartbeatsEnabled"
let debugPaneEnabledKey = "omniagent.debugPaneEnabled"
let debugFileLogEnabledKey = "omniagent.debug.fileLogEnabled"
let appLogLevelKey = "omniagent.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26

// swift-tools-version: 6.2
// Package manifest for the OmniAgent macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "OmniAgent",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "OmniAgentIPC", targets: ["OmniAgentIPC"]),
        .library(name: "OmniAgentDiscovery", targets: ["OmniAgentDiscovery"]),
        .executable(name: "OmniAgent", targets: ["OmniAgent"]),
        .executable(name: "omniagent-mac", targets: ["OmniAgentMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/OmniAgentKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "OmniAgentIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "OmniAgentDiscovery",
            dependencies: [
                .product(name: "OmniAgentKit", package: "OmniAgentKit"),
            ],
            path: "Sources/OmniAgentDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "OmniAgent",
            dependencies: [
                "OmniAgentIPC",
                "OmniAgentDiscovery",
                .product(name: "OmniAgentKit", package: "OmniAgentKit"),
                .product(name: "OmniAgentChatUI", package: "OmniAgentKit"),
                .product(name: "OmniAgentProtocol", package: "OmniAgentKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/OmniAgent.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "OmniAgentMacCLI",
            dependencies: [
                "OmniAgentDiscovery",
                .product(name: "OmniAgentKit", package: "OmniAgentKit"),
                .product(name: "OmniAgentProtocol", package: "OmniAgentKit"),
            ],
            path: "Sources/OmniAgentMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "OmniAgentIPCTests",
            dependencies: [
                "OmniAgentIPC",
                "OmniAgent",
                "OmniAgentDiscovery",
                .product(name: "OmniAgentProtocol", package: "OmniAgentKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])

// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "OmniAgentKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "OmniAgentProtocol", targets: ["OmniAgentProtocol"]),
        .library(name: "OmniAgentKit", targets: ["OmniAgentKit"]),
        .library(name: "OmniAgentChatUI", targets: ["OmniAgentChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "OmniAgentProtocol",
            path: "Sources/OmniAgentProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "OmniAgentKit",
            dependencies: [
                "OmniAgentProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/OmniAgentKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "OmniAgentChatUI",
            dependencies: [
                "OmniAgentKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/OmniAgentChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "OmniAgentKitTests",
            dependencies: ["OmniAgentKit", "OmniAgentChatUI"],
            path: "Tests/OmniAgentKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])

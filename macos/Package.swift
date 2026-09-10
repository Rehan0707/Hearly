// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "HearlyMac",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "HearlyMac", targets: ["HearlyMac"])
    ],
    targets: [
        .target(
            name: "HearlyAudioBridge",
            path: "Sources/HearlyAudioBridge",
            publicHeadersPath: "include"
        ),
        .executableTarget(
            name: "HearlyMac",
            dependencies: ["HearlyAudioBridge"],
            path: "Sources/HearlyMac"
        )
    ]
)

import AppKit
import AVFoundation
import Combine
import Foundation

@MainActor
final class AppModel: ObservableObject {
    static let shared = AppModel()

    @Published var inputDevices: [HearlyAudioDevice] = []
    @Published var selectedInputDeviceID: UInt32?
    @Published var isVoiceIsolationEnabled = true
    @Published var telemetryOptIn = false
    @Published var filterThreshold = 0.62
    @Published var transcriptEnabled = false
    @Published var isVoiceEnrolled = false
    @Published var userName = ""
    @Published var transcriptPreview = "No transcript captured yet."
    @Published private(set) var microphonePermission: AVAuthorizationStatus = .notDetermined

    let audio = AudioEngineController()
    let virtualMicrophone = VirtualMicrophoneMonitor()

    init() {
        microphonePermission = AVCaptureDevice.authorizationStatus(for: .audio)
        refresh()
    }

    var statusTitle: String {
        if audio.isRunning { return "Hearly is processing audio" }
        return "Hearly is idle"
    }

    var filterActive: Bool {
        audio.isRunning
    }

    func refresh() {
        inputDevices = CoreAudioDeviceManager.inputDevices()
        if selectedInputDeviceID == nil {
            selectedInputDeviceID = inputDevices.first?.id
        }
        virtualMicrophone.refresh()
    }

    func toggleAudio() {
        if audio.isRunning {
            audio.stop()
            return
        }

        audio.voiceIsolationEnabled = isVoiceIsolationEnabled
        Task {
            await audio.start(inputDeviceID: selectedInputDeviceID)
        }
    }

    func setFilterActive(_ active: Bool) {
        guard active != audio.isRunning else { return }
        toggleAudio()
    }

    func completeEnrollment(name: String) {
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        userName = trimmedName.isEmpty ? "you" : trimmedName
        isVoiceEnrolled = true
    }

    func removeVoiceProfile() {
        isVoiceEnrolled = false
        userName = ""
        transcriptEnabled = false
        audio.stop()
    }

    func requestMicrophoneAccess() async -> Bool {
        let granted: Bool
        switch AVCaptureDevice.authorizationStatus(for: .audio) {
        case .authorized:
            granted = true
        case .denied, .restricted:
            granted = false
        case .notDetermined:
            granted = await AVCaptureDevice.requestAccess(for: .audio)
        @unknown default:
            granted = false
        }

        microphonePermission = AVCaptureDevice.authorizationStatus(for: .audio)
        return granted
    }

    func openMicrophoneSettings() {
        guard let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone") else {
            return
        }
        NSWorkspace.shared.open(url)
    }
}

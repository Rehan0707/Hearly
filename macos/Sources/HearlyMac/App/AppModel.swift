import Combine
import Foundation

@MainActor
final class AppModel: ObservableObject {
    @Published var inputDevices: [HearlyAudioDevice] = []
    @Published var selectedInputDeviceID: UInt32?
    @Published var isVoiceIsolationEnabled = true
    @Published var telemetryOptIn = false

    let audio = AudioEngineController()
    let virtualMicrophone = VirtualMicrophoneMonitor()

    init() {
        refresh()
    }

    var statusTitle: String {
        if audio.isRunning { return "Hearly is processing audio" }
        return "Hearly is idle"
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
}

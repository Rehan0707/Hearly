import AVFoundation
import AudioToolbox
import CoreAudio
import Foundation
import HearlyAudioBridge

@MainActor
final class AudioEngineController: ObservableObject {
    @Published private(set) var isRunning = false
    @Published private(set) var meterLevel: Float = 0
    @Published private(set) var droppedFrameCount: UInt64 = 0
    @Published private(set) var underrunFrameCount: UInt64 = 0
    @Published private(set) var errorMessage: String?

    private let supportedSampleRate = 48_000.0
    private let audioEngine = AVAudioEngine()
    private let processor = VoiceIsolationProcessor()
    private var ring: UnsafeMutableRawPointer?
    private var meter: UnsafeMutableRawPointer?
    private var meterTimer: DispatchSourceTimer?
    private var interleavedBuffer: UnsafeMutablePointer<Float>?
    private var interleavedBufferCapacity = 0

    var voiceIsolationEnabled: Bool {
        get { processor.enabled }
        set { processor.enabled = newValue }
    }

    func start(inputDeviceID: UInt32?) async {
        guard !isRunning else { return }
        errorMessage = nil

        guard await requestMicrophoneAccess() else {
            errorMessage = "Microphone access is required to start Hearly."
            return
        }

        do {
            let inputNode = audioEngine.inputNode
            try setInputDevice(inputDeviceID, on: inputNode)
            let format = inputNode.inputFormat(forBus: 0)
            guard format.channelCount > 0 else {
                throw HearlyAudioError.noInputChannels
            }
            guard abs(format.sampleRate - supportedSampleRate) < 0.5 else {
                throw HearlyAudioError.unsupportedSampleRate(format.sampleRate)
            }

            ring = hearly_audio_ring_open(1)
            guard ring != nil else {
                throw HearlyAudioError.bridgeUnavailable
            }
            meter = hearly_audio_meter_create()
            guard meter != nil else {
                throw HearlyAudioError.meterUnavailable
            }

            interleavedBufferCapacity = 4096
            interleavedBuffer = .allocate(capacity: interleavedBufferCapacity * 2)
            interleavedBuffer?.initialize(repeating: 0, count: interleavedBufferCapacity * 2)

            inputNode.removeTap(onBus: 0)
            inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
                self?.process(buffer: buffer)
            }

            audioEngine.prepare()
            try audioEngine.start()
            isRunning = true
            startMonitoring()
        } catch {
            stop()
            errorMessage = error.localizedDescription
        }
    }

    func stop() {
        guard isRunning || ring != nil || meter != nil else { return }
        meterTimer?.cancel()
        meterTimer = nil
        audioEngine.inputNode.removeTap(onBus: 0)
        audioEngine.stop()
        if let ring {
            hearly_audio_ring_close(ring)
        }
        ring = nil
        if let meter {
            hearly_audio_meter_close(meter)
        }
        meter = nil
        if let interleavedBuffer {
            interleavedBuffer.deinitialize(count: interleavedBufferCapacity * 2)
            interleavedBuffer.deallocate()
        }
        interleavedBuffer = nil
        interleavedBufferCapacity = 0
        isRunning = false
        meterLevel = 0
        droppedFrameCount = 0
        underrunFrameCount = 0
    }

    private func process(buffer: AVAudioPCMBuffer) {
        let level = processor.process(buffer: buffer)
        if let meter {
            hearly_audio_meter_store(meter, level)
        }
        guard let ring else { return }
        let frameCount = Int(buffer.frameLength)
        guard frameCount > 0, frameCount <= interleavedBufferCapacity,
              let channelData = buffer.floatChannelData,
              let interleavedBuffer else { return }

        let channelCount = Int(buffer.format.channelCount)
        for frame in 0..<frameCount {
            interleavedBuffer[frame * 2] = channelData[0][frame]
            interleavedBuffer[frame * 2 + 1] = channelData[min(1, channelCount - 1)][frame]
        }

        _ = hearly_audio_ring_write(ring, interleavedBuffer, UInt32(frameCount))
    }

    private func startMonitoring() {
        meterTimer?.cancel()
        let timer = DispatchSource.makeTimerSource(queue: .main)
        timer.schedule(deadline: .now(), repeating: .milliseconds(100))
        timer.setEventHandler { [weak self] in
            self?.updateMonitoringValues()
        }
        meterTimer = timer
        timer.resume()
    }

    private func updateMonitoringValues() {
        if let meter {
            meterLevel = hearly_audio_meter_load(meter)
        }
        if let ring {
            droppedFrameCount = hearly_audio_ring_dropped_write_frames(ring)
            underrunFrameCount = hearly_audio_ring_underrun_read_frames(ring)
        }
    }

    private func setInputDevice(_ id: UInt32?, on inputNode: AVAudioInputNode) throws {
        guard let id else { return }
        guard let audioUnit = inputNode.audioUnit else {
            throw HearlyAudioError.audioUnitUnavailable
        }
        var deviceID = AudioDeviceID(id)
        let status = AudioUnitSetProperty(
            audioUnit,
            kAudioOutputUnitProperty_CurrentDevice,
            kAudioUnitScope_Global,
            0,
            &deviceID,
            UInt32(MemoryLayout<AudioDeviceID>.size)
        )
        guard status == noErr else {
            throw HearlyAudioError.deviceSelectionFailed(status)
        }
    }

    private func requestMicrophoneAccess() async -> Bool {
        await withCheckedContinuation { continuation in
            AVCaptureDevice.requestAccess(for: .audio) { granted in
                continuation.resume(returning: granted)
            }
        }
    }
}

private enum HearlyAudioError: LocalizedError {
    case noInputChannels
    case unsupportedSampleRate(Double)
    case bridgeUnavailable
    case meterUnavailable
    case audioUnitUnavailable
    case deviceSelectionFailed(OSStatus)

    var errorDescription: String? {
        switch self {
        case .noInputChannels:
            return "The selected microphone has no input channels."
        case let .unsupportedSampleRate(sampleRate):
            return "Hearly currently requires a 48 kHz microphone (selected device is \(Int(sampleRate)) Hz)."
        case .bridgeUnavailable:
            return "The Hearly audio bridge could not be opened."
        case .meterUnavailable:
            return "The Hearly audio meter could not be initialized."
        case .audioUnitUnavailable:
            return "The macOS input audio unit is unavailable."
        case let .deviceSelectionFailed(status):
            return "The selected microphone could not be configured (status \(status))."
        }
    }
}

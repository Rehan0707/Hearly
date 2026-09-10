import CoreAudio
import Foundation

struct HearlyAudioDevice: Identifiable, Hashable {
    let id: UInt32
    let name: String
    let uid: String

    var identifier: UInt32 { id }
}

enum CoreAudioDeviceManager {
    static func inputDevices() -> [HearlyAudioDevice] {
        let devices = allDevices()
        return devices.filter { hasInputChannels(deviceID: AudioDeviceID($0.id)) }
    }

    static func hasHearlyVirtualMicrophone() -> Bool {
        allDevices().contains { device in
            device.uid == "live.hearely.virtual-mic" || device.name.localizedCaseInsensitiveContains("Hearly Microphone")
        }
    }

    private static func allDevices() -> [HearlyAudioDevice] {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioHardwarePropertyDevices,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var byteCount: UInt32 = 0
        let systemObject = AudioObjectID(kAudioObjectSystemObject)
        guard AudioObjectGetPropertyDataSize(systemObject, &address, 0, nil, &byteCount) == noErr else {
            return []
        }

        let deviceCount = Int(byteCount) / MemoryLayout<AudioDeviceID>.stride
        var deviceIDs = Array(repeating: AudioDeviceID(0), count: deviceCount)
        let status = deviceIDs.withUnsafeMutableBytes { rawBuffer in
            guard let baseAddress = rawBuffer.baseAddress else { return OSStatus(-1) }
            return AudioObjectGetPropertyData(systemObject, &address, 0, nil, &byteCount, baseAddress)
        }
        guard status == noErr else { return [] }

        return deviceIDs.map { deviceID in
            HearlyAudioDevice(
                id: UInt32(deviceID),
                name: stringProperty(deviceID: deviceID, selector: kAudioObjectPropertyName) ?? "Unnamed device",
                uid: stringProperty(deviceID: deviceID, selector: kAudioDevicePropertyDeviceUID) ?? "device-\(deviceID)"
            )
        }
    }

    private static func hasInputChannels(deviceID: AudioDeviceID) -> Bool {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioDevicePropertyStreamConfiguration,
            mScope: kAudioObjectPropertyScopeInput,
            mElement: kAudioObjectPropertyElementMain
        )
        var byteCount: UInt32 = 0
        guard AudioObjectGetPropertyDataSize(deviceID, &address, 0, nil, &byteCount) == noErr else {
            return false
        }

        let rawBuffer = UnsafeMutableRawPointer.allocate(
            byteCount: Int(byteCount),
            alignment: MemoryLayout<AudioBufferList>.alignment
        )
        defer { rawBuffer.deallocate() }
        guard AudioObjectGetPropertyData(deviceID, &address, 0, nil, &byteCount, rawBuffer) == noErr else {
            return false
        }

        let bufferList = UnsafeMutableAudioBufferListPointer(rawBuffer.assumingMemoryBound(to: AudioBufferList.self))
        return bufferList.reduce(0) { partialResult, buffer in
            partialResult + Int(buffer.mNumberChannels)
        } > 0
    }

    private static func stringProperty(deviceID: AudioDeviceID, selector: AudioObjectPropertySelector) -> String? {
        var address = AudioObjectPropertyAddress(
            mSelector: selector,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var value: Unmanaged<CFString>?
        var byteCount = UInt32(MemoryLayout<Unmanaged<CFString>?>.size)
        let status = withUnsafeMutablePointer(to: &value) { pointer in
            AudioObjectGetPropertyData(deviceID, &address, 0, nil, &byteCount, pointer)
        }
        guard status == noErr, let value else { return nil }
        return value.takeRetainedValue() as String
    }
}

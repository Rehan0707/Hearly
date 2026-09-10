import SwiftUI

struct ControlView: View {
    @ObservedObject var model: AppModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header
                driverCard
                inputCard
                processingCard
                transportCard
                if let errorMessage = model.audio.errorMessage {
                    Text(errorMessage)
                        .font(.callout)
                        .foregroundStyle(.red)
                }
            }
            .padding(24)
        }
        .onAppear { model.refresh() }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Hearly")
                .font(.largeTitle.bold())
            Text("Local voice focus for every meeting app")
                .foregroundStyle(.secondary)
            HStack {
                Circle()
                    .fill(model.audio.isRunning ? .green : .secondary)
                    .frame(width: 9, height: 9)
                Text(model.statusTitle)
                    .font(.headline)
                Spacer()
                Button(model.audio.isRunning ? "Stop" : "Start") {
                    model.toggleAudio()
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }

    private var driverCard: some View {
        GroupBox("Virtual microphone") {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: model.virtualMicrophone.status == .installed ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                        .foregroundStyle(model.virtualMicrophone.status == .installed ? .green : .orange)
                    Text(model.virtualMicrophone.status.title)
                        .font(.headline)
                }
                Text(model.virtualMicrophone.status.detail)
                    .font(.callout)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var inputCard: some View {
        GroupBox("Physical microphone") {
            VStack(alignment: .leading, spacing: 10) {
                Picker("Input", selection: $model.selectedInputDeviceID) {
                    Text("System default").tag(UInt32?.none)
                    ForEach(model.inputDevices) { device in
                        Text(device.name).tag(UInt32?.some(device.id))
                    }
                }
                .labelsHidden()
                .pickerStyle(.menu)

                Button("Refresh microphone list") {
                    model.refresh()
                }
                .buttonStyle(.link)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var processingCard: some View {
        GroupBox("Processing") {
            VStack(alignment: .leading, spacing: 14) {
                Toggle("Voice isolation", isOn: $model.isVoiceIsolationEnabled)
                    .onChange(of: model.isVoiceIsolationEnabled) { enabled in
                        model.audio.voiceIsolationEnabled = enabled
                    }

                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("Input level")
                        Spacer()
                        Text("\(Int(model.audio.meterLevel * 100))%")
                            .monospacedDigit()
                            .foregroundStyle(.secondary)
                    }
                    ProgressView(value: Double(model.audio.meterLevel))
                        .tint(.green)
                }

                Text("Development fallback: a local energy gate is active until the native ONNX model is packaged.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var transportCard: some View {
        GroupBox("Audio transport") {
            VStack(alignment: .leading, spacing: 8) {
                LabeledContent("Dropped frames", value: "\(model.audio.droppedFrameCount)")
                LabeledContent("Underrun frames", value: "\(model.audio.underrunFrameCount)")
                Text("The current native path accepts 48 kHz input only. Any non-zero transport count needs investigation before release.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

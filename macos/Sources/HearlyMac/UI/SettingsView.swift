import SwiftUI

struct SettingsView: View {
    @ObservedObject var model: AppModel

    var body: some View {
        Form {
            Section("Privacy") {
                Toggle("Opt in to anonymous product telemetry", isOn: $model.telemetryOptIn)
                Text("Telemetry is off by default. No microphone audio leaves this Mac in the MVP.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Section("Model") {
                LabeledContent("Processor", value: "Energy gate fallback")
                Text("Native ONNX voice isolation is not packaged yet. Do not treat the current fallback as production voice isolation.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .formStyle(.grouped)
        .frame(width: 460)
        .padding()
    }
}

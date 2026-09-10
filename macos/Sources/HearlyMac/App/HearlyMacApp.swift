import SwiftUI

@main
struct HearlyMacApp: App {
    @StateObject private var model = AppModel()

    var body: some Scene {
        MenuBarExtra("Hearly", systemImage: "waveform") {
            MenuBarView(model: model)
        }

        Window("Hearly Controls", id: "controls") {
            ControlView(model: model)
                .frame(minWidth: 440, minHeight: 520)
        }

        Settings {
            SettingsView(model: model)
        }
    }
}

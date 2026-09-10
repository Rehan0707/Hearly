import AppKit
import SwiftUI

struct MenuBarView: View {
    @ObservedObject var model: AppModel
    @Environment(\.openWindow) private var openWindow

    var body: some View {
        Text(model.statusTitle)

        Button(model.audio.isRunning ? "Stop processing" : "Start processing") {
            model.toggleAudio()
        }

        Button("Open controls") {
            openWindow(id: "controls")
        }

        Divider()

        Button("Refresh devices") {
            model.refresh()
        }

        Button("Quit Hearly") {
            model.audio.stop()
            NSApplication.shared.terminate(nil)
        }
    }
}

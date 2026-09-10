import AppKit
import SwiftUI

@MainActor
final class HearlyAppDelegate: NSObject, NSApplicationDelegate {
    private var controlsWindow: NSWindow?
    private var observer: NSObjectProtocol?

    func applicationDidFinishLaunching(_ notification: Notification) {
        observer = NotificationCenter.default.addObserver(
            forName: .hearlyOpenControls,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.showControls()
            }
        }

        DispatchQueue.main.async { [weak self] in
            self?.showControls()
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        if let observer {
            NotificationCenter.default.removeObserver(observer)
        }
    }

    func showControls() {
        if let controlsWindow {
            NSApp.setActivationPolicy(.regular)
            controlsWindow.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return
        }

        let hostingView = NSHostingView(rootView: ControlView(model: AppModel.shared))
        hostingView.frame = NSRect(x: 0, y: 0, width: 460, height: 720)

        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 460, height: 720),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "Hearly"
        window.contentView = hostingView
        window.minSize = NSSize(width: 440, height: 620)
        window.isReleasedWhenClosed = false
        window.center()

        controlsWindow = window
        NSApp.setActivationPolicy(.regular)
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }
}

extension Notification.Name {
    static let hearlyOpenControls = Notification.Name("HearlyOpenControls")
}

@main
struct HearlyMacApp: App {
    @NSApplicationDelegateAdaptor(HearlyAppDelegate.self) private var appDelegate
    @StateObject private var model = AppModel.shared

    var body: some Scene {
        MenuBarExtra("Hearly", systemImage: "waveform") {
            MenuBarView(model: model)
        }

        Settings {
            SettingsView(model: model)
        }
    }
}

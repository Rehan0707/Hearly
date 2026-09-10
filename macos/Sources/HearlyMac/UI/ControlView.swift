import AppKit
import SwiftUI

private enum HearlyTab: String, CaseIterable, Identifiable {
    case home
    case history
    case settings

    var id: String { rawValue }

    var title: String {
        rawValue.capitalized
    }

    var icon: String {
        switch self {
        case .home: return "house"
        case .history: return "clock"
        case .settings: return "gearshape"
        }
    }
}

struct ControlView: View {
    @ObservedObject var model: AppModel

    @State private var selectedTab: HearlyTab = .home
    @State private var roadmapOpen = false
    @State private var enrollmentOpen = false
    @State private var enrollmentStep = 0
    @State private var enrollmentName = ""
    @State private var removeProfileAlert = false

    private let accent = Color(red: 0.71, green: 0.94, blue: 0.24)
    private let background = Color(red: 0.035, green: 0.035, blue: 0.035)
    private let card = Color.white.opacity(0.035)

    var body: some View {
        ZStack {
            background.ignoresSafeArea()

            VStack(spacing: 0) {
                heroNavigation

                ScrollView {
                    Group {
                        switch selectedTab {
                        case .home:
                            heroHome
                        case .history:
                            historyContent
                        case .settings:
                            settingsContent
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 4)
                    .padding(.bottom, 20)
                }
                .scrollIndicators(.hidden)
            }
        }
        .preferredColorScheme(.dark)
        .onAppear { model.refresh() }
        .sheet(isPresented: $roadmapOpen) {
            RoadmapSheet(accent: accent)
        }
        .sheet(isPresented: $enrollmentOpen) {
            EnrollmentSheet(
                model: model,
                step: $enrollmentStep,
                name: $enrollmentName,
                accent: accent,
                onComplete: {
                    model.completeEnrollment(name: enrollmentName)
                    enrollmentOpen = false
                    enrollmentStep = 0
                }
            )
            .presentationDetents([.height(620)])
            .presentationDragIndicator(.visible)
        }
        .alert("Remove voice profile?", isPresented: $removeProfileAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Remove", role: .destructive) { model.removeVoiceProfile() }
        } message: {
            Text("This will delete your enrolled voice profile from Hearly.")
        }
    }

    private var heroNavigation: some View {
        HStack(spacing: 14) {
            HStack(spacing: 9) {
                AppLogoMark(accent: accent, size: 30)

                Text("Hearly")
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white)
            }

            Spacer(minLength: 12)

            HStack(spacing: 13) {
                ForEach(HearlyTab.allCases) { tab in
                    Button {
                        withAnimation(.easeOut(duration: 0.2)) { selectedTab = tab }
                    } label: {
                        HStack(spacing: 5) {
                            if tab == .home && model.filterActive {
                                Circle()
                                    .fill(accent)
                                    .frame(width: 5, height: 5)
                            }

                            Text(tab.title)
                                .font(.system(size: 10, weight: selectedTab == tab ? .semibold : .medium))
                        }
                        .foregroundStyle(selectedTab == tab ? .white : Color.white.opacity(0.58))
                    }
                    .buttonStyle(.plain)
                }

                Button {
                    selectedTab = .settings
                } label: {
                    Image(systemName: "gearshape")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(selectedTab == .settings ? accent : Color.white.opacity(0.68))
                }
                .buttonStyle(.plain)
                .help("Settings")
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 18)
        .padding(.bottom, 14)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(Color.white.opacity(0.06))
                .frame(height: 1)
        }
    }

    private var heroHome: some View {
        VStack(spacing: 0) {
            heroWelcome
            heroScene
            homeContent

            Text("Private by design · Audio stays on this Mac in the MVP.")
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundStyle(Color.white.opacity(0.38))
                .padding(.top, 8)
                .padding(.bottom, 4)
        }
    }

    private var heroWelcome: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text("\(dayGreeting), \(displayName).")
                .font(.system(size: 25, weight: .semibold, design: .rounded))
                .tracking(-0.7)
                .foregroundStyle(.white)

            Text(model.isVoiceEnrolled ? "YOUR FOCUSED AUDIO SPACE IS READY" : "SET UP YOUR FOCUSED AUDIO SPACE")
                .font(.system(size: 9, weight: .bold, design: .monospaced))
                .tracking(1.5)
                .foregroundStyle(Color.white.opacity(0.42))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 20)
        .padding(.bottom, 18)
    }

    private var heroScene: some View {
        VStack(spacing: 15) {
            HeroProfileCard(name: displayName, accent: accent)
                .frame(maxWidth: 290)

            HeroOrb(accent: accent, isActive: model.filterActive)
                .frame(height: 126)

            VStack(spacing: 6) {
                Text(model.isVoiceEnrolled ? "Hearly is ready to keep you clear." : "A calmer way to stay in the conversation.")
                    .font(.system(size: 18, weight: .semibold, design: .rounded))
                    .tracking(-0.35)
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)

                Text(model.isVoiceEnrolled
                     ? "Start processing when you are ready. Your voice stays at the center of every call."
                     : "Enroll your voice once, then let Hearly focus the audio around you.")
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(Color.white.opacity(0.58))
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: 290)
            }

            HStack(spacing: 9) {
                Button {
                    if model.isVoiceEnrolled {
                        model.toggleAudio()
                    } else {
                        enrollmentName = ""
                        enrollmentStep = 0
                        enrollmentOpen = true
                    }
                } label: {
                    Label(
                        model.isVoiceEnrolled
                            ? (model.filterActive ? "Pause Hearly" : "Start Hearly")
                            : "Enroll Your Voice",
                        systemImage: model.isVoiceEnrolled
                            ? (model.filterActive ? "pause.fill" : "play.fill")
                            : "mic.fill"
                    )
                }
                .buttonStyle(HeroPrimaryButtonStyle(accent: accent))

                Button("Explore") {
                    roadmapOpen = true
                }
                .buttonStyle(HeroSecondaryButtonStyle())
            }
            .padding(.top, 4)
        }
        .padding(.bottom, 24)
    }

    private var displayName: String {
        model.userName.isEmpty ? "Rehan" : model.userName
    }

    private var dayGreeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12: return "Good morning"
        case 12..<18: return "Good afternoon"
        default: return "Good evening"
        }
    }

    private var topNavigation: some View {
        HStack(spacing: 6) {
            ForEach(HearlyTab.allCases) { tab in
                Button {
                    withAnimation(.easeOut(duration: 0.2)) { selectedTab = tab }
                } label: {
                    VStack(spacing: 5) {
                        Image(systemName: tab.icon)
                            .font(.system(size: 16, weight: .medium))
                        Text(tab.title)
                            .font(.system(size: 11, weight: selectedTab == tab ? .semibold : .medium))
                        Capsule()
                            .fill(accent)
                            .frame(width: 34, height: 2)
                            .opacity(selectedTab == tab ? 1 : 0)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 9)
                    .foregroundStyle(selectedTab == tab ? .white : .secondary)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(selectedTab == tab ? Color.white.opacity(0.06) : .clear)
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 10)
        .padding(.top, 10)
        .padding(.bottom, 8)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Color.white.opacity(0.06)).frame(height: 1)
        }
    }

    private var branding: some View {
        HStack(spacing: 12) {
            AppLogoMark(accent: accent)

            VStack(alignment: .leading, spacing: 2) {
                Text("Hearly")
                    .font(.system(size: 19, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white)
                Text("Cut the Noise, Keep the Talk.")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.secondary)
            }

            Spacer()

            VStack(spacing: 5) {
                Text("Know about")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.white)
                Button("V1.5") { roadmapOpen = true }
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Capsule().fill(Color.white.opacity(0.035)))
                    .overlay(Capsule().stroke(Color.white.opacity(0.1), lineWidth: 1))
                    .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 17)
    }

    private var homeContent: some View {
        VStack(spacing: 14) {
            if model.isVoiceEnrolled {
                enrolledHero
                controlCard

                if let error = model.audio.errorMessage {
                    ErrorCard(message: error, accent: accent) {
                        model.openMicrophoneSettings()
                    }
                }
            } else {
                enrollmentPrompt
            }

            roadmapFooter
        }
    }

    private var roadmapFooter: some View {
        Button {
            roadmapOpen = true
        } label: {
            VStack(spacing: 6) {
                Text("Know About Version 2")
                    .font(.system(size: 10, weight: .semibold, design: .rounded))
                    .tracking(1.1)
                    .foregroundStyle(.secondary)
                Capsule()
                    .fill(accent.opacity(0.3))
                    .frame(width: 18, height: 1)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 6)
        }
        .buttonStyle(.plain)
        .contentShape(Rectangle())
    }

    private var enrollmentPrompt: some View {
        VStack(spacing: 14) {
            Text("VOICE NOT ENROLLED")
                .font(.system(size: 10, weight: .semibold, design: .rounded))
                .tracking(1.2)
                .foregroundStyle(Color(red: 1, green: 0.54, blue: 0.54))
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(Capsule().fill(Color.red.opacity(0.07)))
                .overlay(Capsule().stroke(Color.red.opacity(0.2), lineWidth: 1))

            ProductCard {
                VStack(spacing: 14) {
                    iconTile(systemName: "mic", color: .secondary)
                    Text("Enroll Your Voice")
                        .font(.system(size: 17, weight: .semibold, design: .rounded))
                        .foregroundStyle(.white)
                    Text("Set up focused listening in three quick steps.")
                        .font(.system(size: 13))
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)
                    Button("Start Voice Training") {
                        enrollmentName = ""
                        enrollmentStep = 0
                        enrollmentOpen = true
                    }
                    .buttonStyle(PillButtonStyle(accent: accent))
                    .padding(.top, 4)
                }
                .frame(maxWidth: .infinity)
            }
        }
    }

    private var enrolledHero: some View {
        VStack(spacing: 12) {
            Text("Voice Enrolled for \(model.userName.isEmpty ? "you" : model.userName)")
                .font(.system(size: 15, weight: .medium, design: .rounded))
                .foregroundStyle(.white)

            if model.filterActive {
                ProductCard {
                    VStack(spacing: 10) {
                        HStack {
                            Text("HEARLY ACTIVE")
                                .font(.system(size: 10, weight: .semibold, design: .rounded))
                                .tracking(1.1)
                                .foregroundStyle(.secondary)
                            Spacer()
                            StatusBadge(title: model.audio.isRunning ? "Listening" : "Ready", accent: accent)
                        }
                        WaveformView(isActive: true, level: model.audio.meterLevel, accent: accent)
                            .frame(height: 54)
                    }
                }
            }

            Text(model.filterActive
                 ? "Hearly is processing your meeting audio."
                 : "Turn Hearly on to filter and listen in real time.")
                .font(.system(size: 12))
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
        }
    }

    private var controlCard: some View {
        ProductCard {
            VStack(spacing: 0) {
                ToggleRow(
                    title: "Hearly",
                    subtitle: model.filterActive ? "Focused voice filtering active" : "Hearly is currently inactive",
                    isOn: Binding(
                        get: { model.filterActive },
                        set: { model.setFilterActive($0) }
                    ),
                    accent: accent
                )

                Divider().overlay(Color.white.opacity(0.11)).padding(.vertical, 2)

                ToggleRow(
                    title: "Transcript",
                    subtitle: model.transcriptEnabled ? "Background speech transcription active" : "Transcript is currently hidden",
                    isOn: $model.transcriptEnabled,
                    accent: accent
                )

                if model.transcriptEnabled {
                    VStack(alignment: .leading, spacing: 7) {
                        Text(model.transcriptPreview)
                            .font(.system(size: 12))
                            .foregroundStyle(Color.white.opacity(0.9))
                            .lineLimit(2)
                        Text(model.transcriptPreview == "No transcript captured yet." ? "WAITING" : "JUST NOW")
                            .font(.system(size: 10, weight: .semibold, design: .monospaced))
                            .tracking(1)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.025)))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.07), lineWidth: 1))
                    .padding(.top, 8)
                }
            }
        }
    }

    private var historyContent: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeader(title: "History", subtitle: "Review recent transcript snippets")
            ProductCard {
                VStack(spacing: 12) {
                    iconTile(systemName: "clock", color: .secondary)
                    Text("No transcript captured yet.")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.white)
                    Text("Turn on Transcript from Home to see meeting notes here.")
                        .font(.system(size: 12))
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
            }
        }
    }

    private var settingsContent: some View {
        VStack(alignment: .leading, spacing: 16) {
            sectionHeader(title: "Settings", subtitle: "Manage your voice profile and voice focus sensitivity")

            ProductCard {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Voice Profile")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.white)
                            Text(model.isVoiceEnrolled ? "Ready for focused listening" : "No enrolled voice profile")
                                .font(.system(size: 11))
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        StatusBadge(title: model.isVoiceEnrolled ? "Ready" : "Not enrolled", accent: accent)
                    }
                    HStack(spacing: 10) {
                        Button(model.isVoiceEnrolled ? "Retrain" : "Enroll voice") {
                            enrollmentName = model.userName
                            enrollmentStep = 0
                            enrollmentOpen = true
                        }
                        .buttonStyle(PillButtonStyle(accent: accent))
                        if model.isVoiceEnrolled {
                            Button("Remove") { removeProfileAlert = true }
                                .buttonStyle(SecondaryButtonStyle())
                        }
                    }
                }
            }

            ProductCard {
                VStack(alignment: .leading, spacing: 13) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("Filter Threshold")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.white)
                            Text("Lower values block less; higher values block more.")
                                .font(.system(size: 11))
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(model.filterThreshold, format: .number.precision(.fractionLength(2)))
                            .font(.system(size: 14, weight: .bold, design: .monospaced))
                            .foregroundStyle(accent)
                    }
                    Slider(value: $model.filterThreshold, in: 0.4...0.8, step: 0.02)
                        .tint(accent)
                }
            }

            ProductCard {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Label("Microphone", systemImage: "mic")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(.white)
                        Spacer()
                        StatusBadge(
                            title: model.virtualMicrophone.status == .installed ? "Ready" : "Needs setup",
                            accent: accent
                        )
                    }
                    Text(model.virtualMicrophone.status.detail)
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                    Picker("Input", selection: $model.selectedInputDeviceID) {
                        Text("System default").tag(UInt32?.none)
                        ForEach(model.inputDevices) { device in
                            Text(device.name).tag(UInt32?.some(device.id))
                        }
                    }
                    .labelsHidden()
                    .pickerStyle(.menu)
                    Button("Refresh microphone list") { model.refresh() }
                        .buttonStyle(.link)
                }
            }

            ProductCard {
                VStack(alignment: .leading, spacing: 12) {
                    Toggle("Voice isolation", isOn: $model.isVoiceIsolationEnabled)
                        .tint(accent)
                    HStack {
                        Text("Processor")
                        Spacer()
                        Text("Energy gate fallback")
                            .foregroundStyle(.secondary)
                    }
                    .font(.system(size: 12))
                    Text("Native ONNX voice isolation is not packaged yet. The current fallback is for development only.")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                }
            }

            ProductCard {
                VStack(alignment: .leading, spacing: 12) {
                    Toggle("Opt in to anonymous product telemetry", isOn: $model.telemetryOptIn)
                        .tint(accent)
                    Text("Telemetry is off by default. No microphone audio leaves this Mac in the MVP.")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                    Divider().overlay(Color.white.opacity(0.08))
                    HStack {
                        Text("Audio transport")
                            .fontWeight(.semibold)
                        Spacer()
                        Text("48 kHz")
                            .foregroundStyle(.secondary)
                    }
                    .font(.system(size: 12))
                    Text("Dropped frames: \(model.audio.droppedFrameCount)  ·  Underruns: \(model.audio.underrunFrameCount)")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(.secondary)
                }
            }

            VStack(spacing: 5) {
                Text("Hearly")
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white)
                Text("Version 1  ·  Cut the Noise, Keep the Talk.")
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 2)
        }
    }

    private func sectionHeader(title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title)
                .font(.system(size: 20, weight: .semibold, design: .rounded))
                .foregroundStyle(.white)
            Text(subtitle)
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
        }
        .padding(.bottom, 2)
    }

    private func iconTile(systemName: String, color: Color) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.white.opacity(0.03))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.09), lineWidth: 1))
            Image(systemName: systemName)
                .font(.system(size: 19, weight: .medium))
                .foregroundStyle(color)
        }
        .frame(width: 48, height: 48)
    }
}

private struct ProductCard<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        content
            .padding(14)
            .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.025)))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.075), lineWidth: 1))
    }
}

private struct HeroProfileCard: View {
    let name: String
    let accent: Color

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 18)
                .fill(
                    LinearGradient(
                        colors: [Color.white.opacity(0.08), Color.white.opacity(0.025)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(
                            LinearGradient(
                                colors: [accent.opacity(0.42), Color.white.opacity(0.12)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )

            VStack(spacing: 6) {
                HStack(spacing: 6) {
                    Circle()
                        .fill(accent)
                        .frame(width: 5, height: 5)
                    Text("A FOCUSED AUDIO PROFILE")
                        .font(.system(size: 8, weight: .bold, design: .monospaced))
                        .tracking(1.2)
                        .foregroundStyle(Color.white.opacity(0.48))
                }

                Text("For \(name)")
                    .font(.system(size: 18, weight: .semibold, design: .serif))
                    .italic()
                    .foregroundStyle(.white)
            }
        }
        .frame(height: 92)
        .rotationEffect(.degrees(-1.2))
        .shadow(color: accent.opacity(0.09), radius: 24, y: 10)
    }
}

private struct HeroOrb: View {
    let accent: Color
    let isActive: Bool

    @State private var rotation = 0.0

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [accent.opacity(isActive ? 0.28 : 0.16), .clear],
                        center: .center,
                        startRadius: 4,
                        endRadius: 76
                    )
                )
                .frame(width: 170, height: 120)
                .blur(radius: 12)

            Capsule()
                .fill(
                    LinearGradient(
                        colors: [Color.clear, accent.opacity(0.55), Color.clear],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(width: 128, height: 13)
                .blur(radius: 8)
                .rotationEffect(.degrees(-8))

            Circle()
                .stroke(
                    AngularGradient(
                        colors: [Color.white.opacity(0.05), accent.opacity(0.82), Color.white.opacity(0.04)],
                        center: .center,
                        angle: .degrees(rotation)
                    ),
                    lineWidth: 1.2
                )
                .frame(width: 112, height: 112)

            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color.white.opacity(0.94), accent.opacity(0.25), Color.black.opacity(0.96)],
                        center: .topLeading,
                        startRadius: 2,
                        endRadius: 54
                    )
                )
                .frame(width: 68, height: 68)
                .overlay(
                    Image(nsImage: NSApplication.shared.applicationIconImage)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .padding(13)
                        .clipShape(Circle())
                )
                .shadow(color: accent.opacity(isActive ? 0.65 : 0.32), radius: 20)
        }
        .onAppear {
            withAnimation(.linear(duration: 18).repeatForever(autoreverses: false)) {
                rotation = 360
            }
        }
    }
}

private struct HeroPrimaryButtonStyle: ButtonStyle {
    let accent: Color

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(Color.black.opacity(0.86))
            .padding(.horizontal, 17)
            .padding(.vertical, 10)
            .background(
                Capsule()
                    .fill(Color.white.opacity(configuration.isPressed ? 0.82 : 0.96))
            )
            .overlay(Capsule().stroke(accent.opacity(0.55), lineWidth: 1))
            .shadow(color: accent.opacity(0.2), radius: 16)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}

private struct HeroSecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(Color.white.opacity(configuration.isPressed ? 0.7 : 0.82))
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Capsule().fill(Color.white.opacity(configuration.isPressed ? 0.08 : 0.045)))
            .overlay(Capsule().stroke(Color.white.opacity(0.12), lineWidth: 1))
    }
}

private struct ToggleRow: View {
    let title: String
    let subtitle: String
    @Binding var isOn: Bool
    let accent: Color

    var body: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 5) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                Text(subtitle)
                    .font(.system(size: 11))
                    .foregroundStyle(isOn ? .secondary : Color.white.opacity(0.38))
            }
            Spacer()
            Toggle("", isOn: $isOn)
                .labelsHidden()
                .toggleStyle(PremiumToggleStyle(accent: accent))
        }
        .padding(.vertical, 2)
    }
}

private struct PremiumToggleStyle: ToggleStyle {
    let accent: Color

    func makeBody(configuration: Configuration) -> some View {
        Button { configuration.isOn.toggle() } label: {
            RoundedRectangle(cornerRadius: 15)
                .fill(configuration.isOn ? accent : Color.white.opacity(0.12))
                .frame(width: 46, height: 27)
                .overlay(alignment: configuration.isOn ? .trailing : .leading) {
                    Circle()
                        .fill(configuration.isOn ? Color.black.opacity(0.75) : Color.white.opacity(0.6))
                        .frame(width: 21, height: 21)
                        .padding(3)
                }
                .animation(.easeOut(duration: 0.18), value: configuration.isOn)
        }
        .buttonStyle(.plain)
        .accessibilityValue(configuration.isOn ? "On" : "Off")
    }
}

private struct StatusBadge: View {
    let title: String
    let accent: Color

    var body: some View {
        Text(title)
            .font(.system(size: 10, weight: .semibold))
            .foregroundStyle(accent)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Capsule().fill(accent.opacity(0.08)))
            .overlay(Capsule().stroke(accent.opacity(0.28), lineWidth: 1))
    }
}

private struct AppLogoMark: View {
    let accent: Color
    let size: CGFloat

    init(accent: Color, size: CGFloat = 38) {
        self.accent = accent
        self.size = size
    }

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.black.opacity(0.32))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(accent.opacity(0.3), lineWidth: 1)
                )

            Image(nsImage: NSApplication.shared.applicationIconImage)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .padding(size * 0.13)
                .clipShape(RoundedRectangle(cornerRadius: 9))
        }
        .frame(width: size, height: size)
        .shadow(color: accent.opacity(0.12), radius: 12)
    }
}

private struct ErrorCard: View {
    let message: String
    let accent: Color
    let onOpenSettings: (() -> Void)?

    init(message: String, accent: Color, onOpenSettings: (() -> Void)? = nil) {
        self.message = message
        self.accent = accent
        self.onOpenSettings = onOpenSettings
    }

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.orange)

            VStack(alignment: .leading, spacing: 7) {
                Text(message)
                    .font(.system(size: 11))
                    .foregroundStyle(Color.orange.opacity(0.95))
                    .fixedSize(horizontal: false, vertical: true)

                if let onOpenSettings {
                    Button("Open Microphone Settings", action: onOpenSettings)
                        .buttonStyle(.link)
                        .font(.system(size: 11, weight: .semibold))
                }
            }

            Spacer(minLength: 0)
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 12).fill(Color.orange.opacity(0.07)))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.orange.opacity(0.2), lineWidth: 1))
    }
}

private struct WaveformView: View {
    let isActive: Bool
    let level: Float
    let accent: Color

    var body: some View {
        TimelineView(.animation(minimumInterval: 0.08)) { context in
            let phase = context.date.timeIntervalSinceReferenceDate
            HStack(spacing: 4) {
                ForEach(0..<28, id: \.self) { index in
                    let wave = abs(sin(phase * 3.2 + Double(index) * 0.65))
                    let height = isActive ? max(6, 8 + wave * 32 * max(0.35, Double(level))) : 6
                    Capsule()
                        .fill(accent.opacity(isActive ? 0.78 : 0.2))
                        .frame(width: 3, height: height)
                }
            }
            .frame(maxWidth: .infinity)
        }
    }
}

private struct PillButtonStyle: ButtonStyle {
    let accent: Color

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(configuration.isPressed ? accent : .white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 11)
            .background(Capsule().fill(accent.opacity(configuration.isPressed ? 0.14 : 0.08)))
            .overlay(Capsule().stroke(accent.opacity(0.35), lineWidth: 1))
            .scaleEffect(configuration.isPressed ? 0.99 : 1)
    }
}

private struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(.secondary)
            .padding(.horizontal, 16)
            .padding(.vertical, 11)
            .background(Capsule().fill(Color.white.opacity(configuration.isPressed ? 0.08 : 0.035)))
            .overlay(Capsule().stroke(Color.white.opacity(0.1), lineWidth: 1))
    }
}

private struct EnrollmentSheet: View {
    @ObservedObject var model: AppModel
    @Binding var step: Int
    @Binding var name: String
    let accent: Color
    let onComplete: () -> Void

    @State private var phraseIndex = 0
    @State private var isRecording = false
    @State private var phraseComplete = false
    @State private var permissionError: String?

    private let phrases = [
        "Hey Hearly, this is {name}. I am training my voice profile.",
        "Hearly helps me stay focused in every meeting.",
        "Clear audio keeps the conversation moving forward."
    ]

    var body: some View {
        ZStack {
            Color(red: 0.035, green: 0.035, blue: 0.035).ignoresSafeArea()
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    AppLogoMark(accent: accent)

                    VStack(alignment: .leading, spacing: 5) {
                        Text("Enroll Your Voice")
                            .font(.system(size: 22, weight: .semibold, design: .rounded))
                            .foregroundStyle(.white)
                        Text(enrollmentStepTitle)
                            .font(.system(size: 11, weight: .semibold, design: .monospaced))
                            .foregroundStyle(accent)
                    }
                    Spacer()
                    HStack(spacing: 5) {
                        ForEach(0..<3, id: \.self) { index in
                            Circle()
                                .fill(index <= step ? accent : Color.white.opacity(0.12))
                                .frame(width: 7, height: 7)
                        }
                    }
                }

                if step == 0 {
                    ProductCard {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("Let’s make Hearly recognize your voice.")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(.white)
                            Text("Your profile stays on this Mac in the current native MVP.")
                                .font(.system(size: 12))
                                .foregroundStyle(.secondary)
                            TextField("Your name", text: $name)
                                .textFieldStyle(.roundedBorder)
                            VStack(alignment: .leading, spacing: 9) {
                                Label("Use a quiet room", systemImage: "checkmark.circle")
                                Label("Speak naturally for a few seconds", systemImage: "checkmark.circle")
                                Label("Keep your microphone connected", systemImage: "checkmark.circle")
                            }
                            .font(.system(size: 12))
                            .foregroundStyle(.secondary)
                        }
                    }
                } else if step == 1 {
                    ProductCard {
                        VStack(alignment: .leading, spacing: 13) {
                            HStack {
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(isRecording ? "Recording" : "Ready to record")
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundStyle(.white)
                                    Text("RECORDING STATE")
                                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                                        .tracking(1.1)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Circle()
                                    .fill(isRecording ? Color.red : Color.white.opacity(0.35))
                                    .frame(width: 8, height: 8)
                            }

                            WaveformView(isActive: isRecording, level: model.audio.meterLevel, accent: accent)
                                .frame(height: 44)
                                .padding(.horizontal, 8)
                                .background(RoundedRectangle(cornerRadius: 12).fill(Color.black.opacity(0.18)))
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.07), lineWidth: 1))

                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    Text("PHRASE \(phraseIndex + 1) OF 3")
                                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                                        .tracking(1.1)
                                        .foregroundStyle(.secondary)
                                    Spacer()
                                    Circle()
                                        .stroke(Color.white.opacity(0.18), lineWidth: 1)
                                        .frame(width: 17, height: 17)
                                }
                                Text(phrases[phraseIndex].replacingOccurrences(of: "{name}", with: name.isEmpty ? "you" : name))
                                    .font(.system(size: 14, weight: .medium, design: .rounded))
                                    .foregroundStyle(.white)
                                    .fixedSize(horizontal: false, vertical: true)
                                HStack(spacing: 5) {
                                    ForEach(0..<3, id: \.self) { index in
                                        Capsule()
                                            .fill(index <= phraseIndex ? accent : Color.white.opacity(0.12))
                                            .frame(height: 3)
                                    }
                                }
                            }
                            .padding(12)
                            .background(RoundedRectangle(cornerRadius: 13).fill(Color.white.opacity(0.025)))
                            .overlay(RoundedRectangle(cornerRadius: 13).stroke(Color.white.opacity(0.07), lineWidth: 1))

                            HStack {
                                Text("Progress")
                                Spacer()
                                Text(progressLabel)
                            }
                            .font(.system(size: 10, weight: .semibold, design: .monospaced))
                            .tracking(1.1)
                            .foregroundStyle(.secondary)

                            ProgressView(value: progressValue)
                                .tint(accent)

                            if let permissionError {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(permissionError)
                                        .font(.system(size: 11))
                                        .foregroundStyle(Color.orange.opacity(0.95))
                                    Button("Open Microphone Settings") {
                                        model.openMicrophoneSettings()
                                    }
                                    .buttonStyle(.link)
                                    .font(.system(size: 11, weight: .semibold))
                                }
                            }

                            VStack(spacing: 9) {
                                if phraseComplete {
                                    Button(phraseIndex == 2 ? "Finish Training" : "Next Phrase") {
                                        if phraseIndex == 2 {
                                            withAnimation(.easeOut(duration: 0.2)) { step = 2 }
                                        } else {
                                            phraseIndex += 1
                                            phraseComplete = false
                                            isRecording = false
                                            permissionError = nil
                                        }
                                    }
                                    .buttonStyle(PillButtonStyle(accent: accent))
                                } else {
                                    Button {
                                        if isRecording {
                                            isRecording = false
                                            phraseComplete = true
                                        } else {
                                            Task {
                                                let granted = await model.requestMicrophoneAccess()
                                                if granted {
                                                    permissionError = nil
                                                    isRecording = true
                                                } else {
                                                    permissionError = "Microphone access is required to record your voice."
                                                }
                                            }
                                        }
                                    } label: {
                                        Image(systemName: isRecording ? "stop.fill" : "mic.fill")
                                            .font(.system(size: 23, weight: .medium))
                                            .foregroundStyle(isRecording ? .white : accent)
                                            .frame(width: 62, height: 62)
                                            .background(Circle().fill(isRecording ? Color.red.opacity(0.16) : accent.opacity(0.08)))
                                            .overlay(Circle().stroke(isRecording ? Color.red.opacity(0.55) : accent.opacity(0.4), lineWidth: 1))
                                    }
                                    .buttonStyle(.plain)
                                    .accessibilityLabel(isRecording ? "Stop recording" : "Start voice training")
                                }

                                Text(
                                    phraseComplete
                                    ? "Phrase complete. Continue when ready."
                                    : isRecording
                                    ? "Read the highlighted phrase aloud"
                                    : "Tap to start voice training"
                                )
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                } else {
                    ProductCard {
                        VStack(spacing: 14) {
                            Image(systemName: "checkmark")
                                .font(.system(size: 22, weight: .bold))
                                .foregroundStyle(accent)
                                .frame(width: 50, height: 50)
                                .background(RoundedRectangle(cornerRadius: 15).fill(accent.opacity(0.1)))
                            Text("Enrollment complete")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(.white)
                            Text("Your voice sample has been captured and your profile is ready to use.")
                                .font(.system(size: 12))
                                .multilineTextAlignment(.center)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }

                Spacer()

                Button(step == 2 ? "Use Hearly" : "Continue") {
                    if step == 2 {
                        onComplete()
                    } else {
                        withAnimation(.easeOut(duration: 0.2)) { step += 1 }
                    }
                }
                .buttonStyle(PillButtonStyle(accent: accent))
            }
            .padding(24)
        }
        .preferredColorScheme(.dark)
    }

    private var progressValue: Double {
        let base = Double(phraseIndex) / 3
        return min(1, base + (phraseComplete ? 0.16 : 0.06))
    }

    private var enrollmentStepTitle: String {
        switch step {
        case 0: return "STEP 1 OF 3 · BEFORE YOU START"
        case 1: return "STEP 2 OF 3 · VOICE RECORDING"
        default: return "STEP 3 OF 3 · COMPLETION"
        }
    }

    private var progressLabel: String {
        "\(Int(progressValue * 100))%"
    }
}

private struct RoadmapSheet: View {
    let accent: Color

    var body: some View {
        ZStack {
            Color(red: 0.035, green: 0.035, blue: 0.035).ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("ROADMAP")
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .tracking(1.3)
                            .foregroundStyle(accent)
                        Text("Future of Hearly")
                            .font(.system(size: 24, weight: .semibold, design: .rounded))
                            .foregroundStyle(.white)
                        Text("Building the next generation of focused listening.")
                            .font(.system(size: 13))
                            .foregroundStyle(.secondary)
                    }

                    RoadmapSection(version: "V1.5", label: "COMING SOON", accent: accent, items: [
                        ("Sharper voice filtering", "Improved AI models for better isolation."),
                        ("Cleaner transcripts", "Formatted and readable text previews."),
                        ("Enhanced controls", "More granular listening session management.")
                    ])

                    RoadmapSection(version: "V2.0", label: "FUTURE VISION", accent: accent, items: [
                        ("AI Conversation Insights", "Automated summaries and key takeaways."),
                        ("Smart Voice Profiles", "Multi-user enrollment and tracking."),
                        ("Cloud Sync & Multi-device", "Your data, everywhere you go.")
                    ])
                }
                .padding(26)
            }
        }
        .preferredColorScheme(.dark)
    }
}

private struct RoadmapSection: View {
    let version: String
    let label: String
    let accent: Color
    let items: [(String, String)]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(label)
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .tracking(1.1)
                    .foregroundStyle(version == "V1.5" ? accent : .secondary)
                Rectangle().fill(Color.white.opacity(0.1)).frame(height: 1)
                Text(version)
                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                    .foregroundStyle(.white.opacity(version == "V1.5" ? 0.9 : 0.45))
            }

            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                VStack(alignment: .leading, spacing: 3) {
                    Text("•  \(item.0)")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.white.opacity(version == "V1.5" ? 0.92 : 0.62))
                    Text(item.1)
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                        .padding(.leading, 14)
                }
            }
        }
    }
}

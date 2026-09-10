# Hearly Audit and Prioritized Plan

**Audit date:** September 10, 2026
**Scope:** current Hearly repositories, the September 10 end-to-end validation report, the open HeyClicky validation page, and the deployed Hearly website.
**Constraint:** assessment only; no application source files were changed by this audit.

## Executive Summary

Hearly has a credible macOS-first audio architecture and a green automated baseline, but it is not ready for a real voice-path release. The main risk is not ordinary compilation: the native work is still an untracked, separate checkout and the two production-critical runtime gates are unproven:

1. The virtual microphone is not installed or visible to Core Audio.
2. The native app still runs a simple energy gate instead of the trained voice-isolation model.
3. The extension runtime was not loaded in isolated Chrome, so popup/content-script behavior remains unverified.
4. Public packaging is not ready: full Xcode, Developer ID signing, notarization, the native model artifact, and the website download URL are missing.

The correct next move is to freeze the current baseline, make the macOS checkout authoritative, prove a passthrough virtual microphone on a dedicated test Mac, then harden the real-time audio contract before wiring ONNX inference. Do not start another visual redesign or merge the old extension edits into the native migration yet.

## Evidence and Repository Reality

### Primary checkout

- `/Users/rehan/Library/Application Support/Clicky/projects/hearly-live-rotation` is on `main` at `ba476e5` (`Fix navbar responsiveness`) and matches its current `origin/main`.
- It contains four pre-existing unstaged web edits in `hearly-web/src/App.jsx`, `hearly-web/src/components/DownloadSection.jsx`, `hearly-web/src/components/Pricing.jsx`, and `hearly-web/vite.config.js`.
- `validation/end-to-end-2026-09-10.md` is an untracked validation artifact; validation reported that it changed no source files.
- The primary checkout has the Chrome extension, optional cloud server, model tooling, and marketing site. It does not contain the native macOS source tree.

### Native checkout

- `/Users/rehan/Hearly-Version-1` is a separate checkout at `aa3b38c`, with three extension commits ahead of that checkout's stale `origin/main` reference.
- The macOS source tree, native release documents, a replacement website, generated extension output, model cache, and multiple extension source changes are untracked or dirty there.
- Native validation therefore does not prove that the native implementation is included in the synced `ba476e5` checkout.
- Treat the native checkout as an experimental migration workspace until its source, generated artifacts, and ownership are separated and committed deliberately.

## What Is Passing

The September 10 validation report shows the following green checks:

- Extension tests: 30/30 tests across 9 files.
- Extension typecheck, extension/web production build, and website lint.
- Cloud server syntax check.
- Native Swift release build, app/HAL ad hoc signature verification, and menu-bar process launch.
- Website smoke test: landing page rendered, waitlist opened/closed, and the demo toggled from `Unmute` to `Mute`.

These prove buildability and some unit behavior. They do not prove that a meeting application receives processed audio from the native virtual microphone.

## Release Blockers

### P0 — Prove the virtual microphone path

**Finding:** `Hearly Microphone` is absent from `system_profiler SPAudioDataType`; `/Library/Audio/Plug-Ins/HAL/HearlyAudio.driver` is not installed. Meet, Zoom, Teams, and other client selection tests were not possible.

**Why it matters:** this is the product's central macOS contract. A successful Swift build and an ad hoc-signed HAL bundle are insufficient if Core Audio does not enumerate the device and deliver frames to real clients.

**Remediation:** use a dedicated Apple-silicon test Mac, build the driver, install it through the privileged path, restart `coreaudiod`, verify enumeration, and test clean passthrough before judging model quality.

**Exit criteria:** the device appears after install and reboot; a real client can select it; audio passes continuously; uninstall removes it; reinstall restores it.

### P0 — Replace the native placeholder processor

**Finding:** `macos/Sources/HearlyMac/Audio/VoiceIsolationProcessor.swift` is a threshold-based energy gate. The native UI and settings explicitly label it as such, and the release preflight reports `HEARLY_NATIVE_MODEL` missing.

**Why it matters:** an energy gate is not speaker isolation. It can mute quiet speech, pass other speakers, and create a false impression that the core Hearly promise is working.

**Remediation:** define the native ONNX model contract, package and checksum the model, warm it on a worker before audio starts, and keep inference off the real-time callback. Provide an explicit bypass/fallback state rather than silently calling the gate “voice isolation.”

**Exit criteria:** the configured model loads on a clean Mac, inference runs without callback stalls, bypass is deterministic, and evaluation recordings show measurable enrolled-speaker retention plus non-enrolled attenuation.

### P0 — Make release packaging real

**Finding:** the release preflight is blocked by no active full Xcode developer directory, no Developer ID Application identity, no `NOTARY_PROFILE`, no native model path, and no `VITE_MACOS_DOWNLOAD_URL`.

**Remediation:** select full Xcode, configure signing/notarization in CI or a release shell, package the app and HAL installation path explicitly, notarize/staple the final artifact, generate a checksum, and publish only a versioned signed download.

**Exit criteria:** a clean Apple-silicon Mac downloads the exact public artifact, passes Gatekeeper, installs the app and audio component through documented steps, and can uninstall/reinstall without a developer terminal workflow.

### P1 — Verify the extension runtime or formally defer it

**Finding:** isolated Chrome opened `chrome://extensions`, but launch-time flags did not expose a Hearly card; the manual `Load unpacked` picker was opened and canceled. Unit-level audio, VAD, crypto, streaming, and processor tests remain green, but popup and content-script behavior in a real browser is unverified.

**Decision:** if macOS is the first product, freeze the extension as a separate legacy track and remove it from the macOS release gate. If the extension still ships, complete a manual Chrome matrix before making any public claim.

**Exit criteria:** either the extension is explicitly marked deferred with a separate owner/branch, or Chrome loads the unpacked build and verifies enrollment, persistence, capture start/stop, meeting adapters, and reload behavior.

## Technical Risks

### Audio timing and real-time safety

- The HAL format is fixed at 48 kHz, while `AudioEngineController` forwards the input node's native format without visible sample-rate conversion. A 44.1 kHz input path can therefore be mis-timed or mis-sized.
- The audio tap schedules `Task { @MainActor ... }` work from the audio callback for meter updates. UI work must be decoupled from the real-time path through an atomic meter or a bounded non-blocking handoff.
- The shared-memory ring silently drops writes when full and zero-fills reads when empty, but there are no exposed underrun/overrun counters or diagnostics.
- The ring uses one global shared-memory name and does not show session ownership, generation, or multi-client lifecycle handling. Restart, multiple app instances, and multiple meeting clients need explicit tests.

### Driver and installer maturity

- `macos/Driver/HearlyAudioDriver.c` is an MVP AudioServerPlugIn implementation. It returns success even when a read receives fewer frames, which hides underruns from the client.
- Installation currently means running `sudo` shell scripts that copy into `/Library/Audio/Plug-Ins/HAL/` and kill `coreaudiod`. That is acceptable for engineering tests, not a polished public install path.
- The app status is only installed/not installed; it does not guide the user through permissions, installation, recovery, client selection, or stale Core Audio state.

### State and supportability

- Input selection, voice-isolation state, and telemetry preference are in memory; persistence, migration, and crash/restart recovery are not visible in the native MVP.
- `VirtualMicrophoneMonitor` refreshes on startup, window appearance, and manual refresh, not on Core Audio device-change notifications.
- The current control UI has no enrollment flow, model health detail, diagnostics export, support link, or explicit driver install/uninstall action.

### Product and privacy messaging

- The deployed website says Hearly works “right inside your browser,” calls the Chrome extension “launching soon,” advertises Deepgram, and says the product is available on macOS, Windows, and Linux.
- The native MVP is actually macOS-first, local-only in intent, dependent on a separate virtual audio component, and still using a placeholder processor.
- The primary privacy policy is written for the Chrome extension. It does not yet explain native microphone permissions, virtual-device installation, privileged removal, native model files, or diagnostics.
- The marketing surface should not promise cross-platform availability, sub-200 ms cloud transcription, or “your voice data never leaves your device” until the shipped native path and actual data flows support those claims.

## UI/UX Assessment

### Website

The visual system is coherent: dark surfaces, strong lime/crimson accent treatment, animated hero, and clear waitlist CTAs. The main issue is product truth, not polish. The live page currently optimizes for a browser waitlist while the engineering effort has moved to a menu-bar macOS product.

Prioritize:

1. Replace the primary CTA with `Download for macOS` only after a signed artifact exists.
2. Add a dedicated download/setup page with Apple-silicon support, permissions, virtual microphone selection, checksum, and uninstall guidance.
3. Mark Chrome, Windows, Linux, captions, cloud transcription, and advanced meeting intelligence as roadmap or separate products unless they are actually in the release.
4. Align privacy, pricing, feature, and footer copy with the macOS MVP.

### Native app

The menu-bar plus control-window shape is appropriate for a background audio utility. The current control view is understandable for an engineer, but not yet for a first-run user: it exposes “Driver not installed” and “Local energy gate” without a guided next action, and the settings screen is informational rather than operational.

The first-run flow should make this state machine visible:

`Needs microphone permission` → `Install virtual microphone` → `Select physical mic` → `Ready` → `Processing` → `Paused/Bypassed` → `Needs attention`.

Every non-ready state should have one primary recovery action and a link to the exact meeting-app setup instructions.

## Prioritized Step-by-Step Plan

### Phase 0 — Freeze the baseline and choose the source of truth

1. Record the primary checkout's four web edits and the validation artifact without resetting or stashing them.
2. Create a dedicated macOS migration branch or repository from a known commit.
3. Move only intentional native source and release docs into that branch; exclude `.build-xcode`, model caches, generated `dist`, and temporary audit files.
4. Decide whether the Chrome extension is deferred or supported in parallel, with separate release gates and owners.
5. Add one top-level architecture document that names the authoritative checkout and the supported product for the next release.

**Acceptance:** `git status` is explainable, the native source is versioned in one place, generated artifacts are ignored, and the macOS release can be built without depending on dirty extension changes.

### Phase 1 — Install and validate the passthrough HAL path

1. Build the app and HAL on a dedicated Apple-silicon test machine.
2. Install the driver, restart Core Audio, and verify `Hearly Microphone` through Core Audio/system settings.
3. Start the app with the energy gate bypassed and verify physical-mic-to-virtual-mic passthrough.
4. Test Meet, Zoom, Teams, Safari, macOS input settings, headphones, external USB mics, and the system default mic.
5. Repeat after reboot, sleep/wake, mic unplug/replug, app restart, and uninstall/reinstall.

**Acceptance:** the device is stable across the matrix, no client sees stale or duplicate devices, and the app reports actionable errors when the driver is absent.

### Phase 2 — Harden the audio contract

1. Choose a single supported format or add explicit sample-rate conversion between AVAudioEngine and the fixed HAL format.
2. Remove UI task scheduling, allocations, logging, and blocking operations from the audio callback.
3. Add ring-buffer generation/session ownership and atomic underrun, overrun, dropped-frame, and client-count metrics.
4. Define behavior for buffer starvation, app pause, driver restart, multiple clients, and shutdown.
5. Add automated format and ring tests plus a long-running dropout test.

**Acceptance:** 44.1/48 kHz behavior is intentional, long calls show no unexplained dropouts, and diagnostics distinguish source silence from transport starvation.

### Phase 3 — Integrate native ONNX voice isolation

1. Export and version the model for the exact native tensor/input/output contract.
2. Load and warm the model on a worker before enabling processing.
3. Keep the callback limited to bounded buffer exchange and preallocated processing state.
4. Add bypass, model-missing, model-load-failed, and high-CPU states to the app UI.
5. Evaluate enrolled voice, non-enrolled speech, keyboard/fan/background noise, quiet speech, and clipping.

**Acceptance:** the model is present and checksummed, inference is stable on supported Apple silicon, the UI never calls the energy gate “voice isolation,” and the quality gate is measured on a repeatable corpus.

### Phase 4 — Make the native UX supportable

1. Add first-run onboarding for microphone permission and virtual-device installation.
2. Replace manual-only driver instructions with an explicit privileged installer or signed package flow.
3. Persist selected input, bypass/isolation state, and telemetry preference with versioned settings.
4. Add device-change monitoring and recovery actions for missing or stale Core Audio devices.
5. Add model status, diagnostics export, privacy explanation, and meeting-app setup links.

**Acceptance:** a nontechnical tester can reach `Ready` without Terminal, recover from each expected failure, and understand exactly when audio is local and when it is not.

### Phase 5 — Release packaging and clean-machine verification

1. Build with full Xcode and arm64 release settings.
2. Configure Developer ID signing, hardened runtime, minimal entitlements, and a reproducible build record.
3. Produce a signed installer/DMG that handles the privileged audio component explicitly.
4. Notarize and staple the public artifact; publish a checksum and rollback artifact.
5. Test from Safari on a clean Apple-silicon Mac, including install, first run, call, uninstall, and reinstall.

**Acceptance:** the release preflight is all green and the clean-machine test passes without development credentials, local paths, or manual source checkout steps.

### Phase 6 — Align the website and policy

1. Change the landing page from browser-first waitlist copy to a macOS-first release message.
2. Add `/download`, release notes, supported OS/architecture, checksum, setup, troubleshooting, and uninstall pages.
3. Update privacy policy and permissions copy for the native microphone and virtual device.
4. Keep extension, Windows, Linux, captions, and cloud capabilities clearly labeled as deferred or separately supported.
5. Set `VITE_MACOS_DOWNLOAD_URL` only after the signed/notarized artifact is published.

**Acceptance:** a new user can understand what Hearly does today, download the correct artifact, and complete setup without encountering claims that describe an unshipped product.

### Phase 7 — Reopen the extension track separately

Only after the macOS release is stable:

1. Create an extension-owned branch from a clean baseline.
2. Load the built extension manually in Chrome and run the real popup/content-script matrix.
3. Resolve model artifacts and local STT packaging separately from the native model.
4. Add browser smoke tests for meeting adapters, capture lifecycle, persistence, and reload behavior.
5. Update extension-specific privacy and store materials.

**Acceptance:** the extension has its own release checklist and no longer shares ambiguous “Hearly is ready” claims with the native app.

## Immediate Next Actions

1. Preserve the current dirty web work and write a checkout inventory.
2. Create the macOS migration branch from the intended base commit.
3. Install the HAL driver on a dedicated test Mac and prove passthrough.
4. Implement the audio-format and real-time-safety design before ONNX integration.
5. Do not publish a macOS download button until signing, notarization, model packaging, and clean-machine verification are complete.

## Files Reviewed

- `validation/end-to-end-2026-09-10.md`
- `README.md`
- `docs/V2_MIGRATION_GUIDE.md`
- `docs/PRIVACY.md`
- `hearly-web/src/components/Hero.jsx`
- `hearly-web/src/components/Features.jsx`
- `hearly-web/src/components/Pricing.jsx`
- `hearly-web/src/components/DownloadSection.jsx`
- `/Users/rehan/Hearly-Version-1/macos/README.md`
- `/Users/rehan/Hearly-Version-1/macos/Sources/HearlyMac/Audio/AudioEngineController.swift`
- `/Users/rehan/Hearly-Version-1/macos/Sources/HearlyMac/Audio/VoiceIsolationProcessor.swift`
- `/Users/rehan/Hearly-Version-1/macos/Sources/HearlyMac/UI/ControlView.swift`
- `/Users/rehan/Hearly-Version-1/macos/Sources/HearlyMac/UI/SettingsView.swift`
- `/Users/rehan/Hearly-Version-1/macos/Sources/HearlyAudioBridge/HearlyAudioBridge.c`
- `/Users/rehan/Hearly-Version-1/macos/Driver/HearlyAudioDriver.c`
- `/Users/rehan/Hearly-Version-1/macos/Scripts/preflight-release.sh`
- `/Users/rehan/Hearly-Version-1/macos/Scripts/install-driver.sh`

## Implementation Progress — September 10, 2026

The first implementation pass is now in the primary checkout:

- Native `macos/` source, scripts, and release metadata are integrated into the main project.
- Root commands now expose native build and preflight entry points.
- The audio callback no longer schedules UI tasks; meter values are published through an atomic relay and a main-thread timer.
- Shared-memory transport now counts dropped writes and input underruns, and the UI exposes both counters.
- The native app rejects non-48 kHz input instead of silently sending mismatched audio to the fixed 48 kHz HAL path.
- The packaged driver installer now resolves its bundled driver, verifies its signature, supports dry runs, and ships with `macos/INSTALL.md`.
- The first arm64 ad hoc package and checksum were produced at `release/macos/` and the packaged install/uninstall dry runs pass.
- Website, README, and privacy copy now describe the macOS-first product instead of claiming an already-shipped browser/cloud experience.

The remaining release gates are still external or product-critical: install and live-test the HAL driver, integrate the native ONNX runtime/model rather than the energy-gate fallback, obtain Developer ID/notarization credentials, and publish the signed artifact.

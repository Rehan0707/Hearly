# Hearly macOS app

This directory is the native Apple-silicon-first track for Hearly. It is isolated from the Chrome extension and uses one audio contract:

```text
physical microphone
  -> AVAudioEngine capture
  -> local processor
  -> shared-memory audio ring
  -> Hearly AudioServerPlugIn
  -> Hearly Microphone in Meet / Zoom / Teams
```

## What is included

- SwiftPM executable target for a SwiftUI menu-bar control app.
- Core Audio input-device discovery and per-session input selection.
- Microphone permission string and sandbox entitlement for app packaging.
- Shared-memory float PCM ring buffer used by the app and HAL bundle.
- AudioServerPlugIn bundle that publishes `Hearly Microphone` as a virtual input device.
- Local energy-gate fallback so the full capture-to-device path can be tested before native ONNX integration.
- Atomic transport diagnostics for meter values, dropped writes, and input underruns.

## Build locally

The Command Line Tools are enough for unsigned compilation:

```bash
cd macos
swift build
./Scripts/build-app.sh
./Scripts/build-driver.sh
```

`build-app.sh` creates `macos/build/Hearly.app`. `build-driver.sh` creates `macos/build/HearlyAudio.driver`. Both output folders are ignored by git.

Create a versioned Apple-silicon package and checksum with:

```bash
./Scripts/build-release.sh
```

When full Xcode is installed, the scripts automatically use the selected Developer directory or a common Xcode installation under `/Applications` or `~/Downloads`. To override the detected toolchain, set its Developer directory explicitly:

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer ./Scripts/build-release.sh
```

Run `./Scripts/preflight-release.sh` before distribution to report missing Xcode, signing, notarization, HAL, or website-download prerequisites.

Local packages are ad hoc signed for verification. For a distributable build, set `CODE_SIGN_IDENTITY` to a valid Developer ID Application identity. Set `NOTARY_PROFILE` to a stored `notarytool` keychain profile to submit, wait for, and staple notarization before the final zip is written. Set `STRICT_RELEASE=1` in CI to fail closed when signing is not configured.

Install the driver only on a test machine:

```bash
./Scripts/install-driver.sh
```

Remove the driver with `./Scripts/uninstall-driver.sh`.

The installer writes to `/Library/Audio/Plug-Ins/HAL/`, so it requires administrator approval and restarts `coreaudiod`. Quit and reopen meeting apps after installation, then select `Hearly Microphone` as their microphone.

## Reused vs rewritten

Reused:

- The product contract: local-first processing, optional telemetry, and no client-side secrets.
- Existing model-training and ONNX export work under `hearly-model/`.
- Existing privacy and release language under `docs/`.

Rewritten for native macOS:

- Browser `getUserMedia`, AudioWorklet, content scripts, and meeting DOM adapters are not used.
- `AVAudioEngine` owns microphone capture.
- Core Audio HAL owns the device visible to other applications.
- The app-to-driver transport is a bounded shared-memory ring rather than browser messaging.

## Current limitations

- The native processor is an energy gate, not the trained speaker-isolation ONNX model.
- The current audio contract accepts 48 kHz microphone input only; sample-rate conversion is still required for broader hardware support.
- The HAL code is a first MVP and needs live verification across Meet, Zoom, Teams, sample-rate changes, sleep/wake, and multiple clients.
- The app is sandbox-ready, but driver installation must remain a separate privileged step; do not attempt to copy into `/Library/Audio/Plug-Ins/HAL/` from the sandboxed app.
- Release signing, notarization, installer UX, update signing, and direct website download wiring require a full Xcode + Developer ID release environment.

## Release checklist

1. Replace `VoiceIsolationProcessor` with a native ONNX adapter and keep inference off the audio callback.
2. Add a bounded worker queue, sample-rate conversion, and quality tests around the existing transport counters.
3. Test the driver with real Core Audio clients and verify clean uninstall/reinstall behavior.
4. Build arm64 in full Xcode, sign the app and HAL bundle with Developer ID, and enable hardened runtime.
5. Package a signed installer for the privileged HAL component; never silently modify system audio folders.
6. Notarize the app/installer, staple the ticket, and validate on a clean Apple-silicon Mac.
7. Publish versioned DMG/PKG assets from the website with checksums and a rollback link.
8. Add Sparkle or another signed updater after the first stable direct-download release.
9. Keep telemetry opt-in, local by default, and free of raw microphone audio.
10. Reuse the model and product contracts for Windows only after macOS call stability is proven.

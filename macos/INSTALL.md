# Hearly macOS Installation

This package is for Apple-silicon Macs. It contains the Hearly menu-bar app and
the separate Core Audio virtual microphone component.

## Install

1. Move `Hearly.app` to `/Applications`.
2. Run `install-driver.sh` and approve the administrator prompt.
3. Run `./verify-driver.sh` and confirm `Hearly Microphone` is visible.
4. Reopen Meet, Zoom, Teams, or another call app.
5. Open Hearly, grant microphone access, start processing, and select `Hearly Microphone` in the call app.

The driver installer copies only the signed `HearlyAudio.driver` bundle into
`/Library/Audio/Plug-Ins/HAL/` and restarts `coreaudiod` so macOS can enumerate
the device. It does not silently install from inside the sandboxed app.

## Uninstall

Run `uninstall-driver.sh`, then remove `Hearly.app` from `/Applications`.

## Test Without Changing System Audio

Use `./install-driver.sh --dry-run` or `./uninstall-driver.sh --dry-run` to
verify the package paths without requesting administrator access or restarting
Core Audio. Use `HEARLY_ALLOW_CUSTOM_DRIVER_DESTINATION=1` only for isolated
temporary test paths; normal installs are restricted to the Hearly HAL folder.

## Current Release Scope

The current native build is Apple-silicon-first and uses a clearly labeled
energy-gate fallback while native ONNX voice isolation is being integrated.
The public release also requires live virtual-microphone validation, Developer
ID signing, notarization, and clean-machine testing.

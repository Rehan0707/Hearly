#!/bin/zsh

set -u

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/xcode-env.sh"
APP_DIR="$ROOT_DIR/build/Hearly.app"
DRIVER_DIR="$ROOT_DIR/build/HearlyAudio.driver"
failures=0

pass() {
  printf 'PASS  %s\n' "$1"
}

block() {
  printf 'BLOCK %s\n' "$1"
  failures=$((failures + 1))
}

if [[ -n "${DEVELOPER_DIR:-}" && -x "$DEVELOPER_DIR/usr/bin/xcodebuild" ]] && \
  "$DEVELOPER_DIR/usr/bin/xcodebuild" -version >/dev/null 2>&1; then
  pass 'Full Xcode is selected'
else
  block 'Full Xcode is not selected; xcodebuild is unavailable'
fi

if security find-identity -v -p codesigning 2>/dev/null | rg -q 'Developer ID Application:'; then
  pass 'Developer ID Application identity is available'
else
  block 'Developer ID Application identity is unavailable'
fi

if [[ -n "${NOTARY_PROFILE:-}" ]]; then
  pass 'Notary profile is configured for this shell'
else
  block 'NOTARY_PROFILE is not configured'
fi

if [[ -x "$APP_DIR/Contents/MacOS/HearlyMac" && -f "$APP_DIR/Contents/Info.plist" ]]; then
  pass 'App build output exists'
else
  block 'App build output is missing'
fi

if [[ -x "$DRIVER_DIR/Contents/MacOS/HearlyAudioDriver" && -f "$DRIVER_DIR/Contents/Info.plist" ]]; then
  pass 'HAL build output exists'
else
  block 'HAL build output is missing'
fi

if [[ -d "$APP_DIR" ]]; then
  if codesign --verify --deep --strict "$APP_DIR" >/dev/null 2>&1; then
    pass 'App signature verifies'
  else
    block 'App signature does not verify'
  fi
fi

if [[ -d "$DRIVER_DIR" ]]; then
  if codesign --verify --deep --strict "$DRIVER_DIR" >/dev/null 2>&1; then
    pass 'HAL signature verifies'
  else
    block 'HAL signature does not verify'
  fi
fi

if system_profiler SPAudioDataType 2>/dev/null | rg -qi 'Hearly Microphone'; then
  pass 'Hearly Microphone is visible to Core Audio'
else
  block 'Hearly Microphone is not visible; install the HAL driver for live testing'
fi

if [[ "${VITE_MACOS_DOWNLOAD_URL:-}" =~ ^https://.+/Hearly-macOS-[0-9]+\.[0-9]+\.[0-9]+-arm64\.zip$ ]]; then
  pass 'Website macOS download URL is configured'
else
  block 'VITE_MACOS_DOWNLOAD_URL must be an HTTPS versioned arm64 zip URL'
fi

if [[ -n "${HEARLY_NATIVE_MODEL:-}" && -f "$HEARLY_NATIVE_MODEL" ]]; then
  pass 'Native ONNX model is configured'
else
  block 'HEARLY_NATIVE_MODEL is not configured; native ONNX integration is still pending'
fi

if (( failures > 0 )); then
  printf '\n%s release gate(s) still need attention.\n' "$failures"
  exit 1
fi

printf '\nAll macOS release gates are ready.\n'

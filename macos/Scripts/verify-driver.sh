#!/bin/zsh

set -euo pipefail

DRIVER_DESTINATION="${HEARLY_DRIVER_DESTINATION:-/Library/Audio/Plug-Ins/HAL/HearlyAudio.driver}"

if [[ ! -d "$DRIVER_DESTINATION" ]]; then
  echo "Hearly Audio Driver is not installed: $DRIVER_DESTINATION" >&2
  exit 1
fi

DRIVER_INFO="$DRIVER_DESTINATION/Contents/Info.plist"
if [[ ! -f "$DRIVER_INFO" ]]; then
  echo "Driver bundle is missing Contents/Info.plist: $DRIVER_DESTINATION" >&2
  exit 1
fi

DRIVER_BUNDLE_ID=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$DRIVER_INFO" 2>/dev/null || true)
if [[ "$DRIVER_BUNDLE_ID" != 'live.hearely.audio-driver' ]]; then
  echo "Unexpected driver bundle identifier: ${DRIVER_BUNDLE_ID:-missing}" >&2
  exit 1
fi

codesign --verify --deep --strict "$DRIVER_DESTINATION"

if system_profiler SPAudioDataType 2>/dev/null | rg -qi 'Hearly Microphone'; then
  echo 'Hearly Microphone is visible to Core Audio.'
else
  echo 'Driver signature is valid, but Hearly Microphone is not visible to Core Audio.' >&2
  exit 1
fi

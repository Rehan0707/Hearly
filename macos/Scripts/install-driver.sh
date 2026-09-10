#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DRIVER_DESTINATION="${HEARLY_DRIVER_DESTINATION:-/Library/Audio/Plug-Ins/HAL/HearlyAudio.driver}"
DRIVER_SOURCE="${HEARLY_DRIVER_SOURCE:-$SCRIPT_DIR/HearlyAudio.driver}"
DRY_RUN=0
DEFAULT_DRIVER_DESTINATION="/Library/Audio/Plug-Ins/HAL/HearlyAudio.driver"

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

if [[ "$DRIVER_DESTINATION" != "$DEFAULT_DRIVER_DESTINATION" && "${HEARLY_ALLOW_CUSTOM_DRIVER_DESTINATION:-0}" != "1" ]]; then
  echo "Refusing nonstandard driver destination: $DRIVER_DESTINATION" >&2
  echo "Set HEARLY_ALLOW_CUSTOM_DRIVER_DESTINATION=1 only for isolated tests." >&2
  exit 1
fi

case "$DRIVER_DESTINATION" in
  *.driver) ;;
  *)
    echo "Driver destination must end with .driver: $DRIVER_DESTINATION" >&2
    exit 1
    ;;
esac

if [[ ! -d "$DRIVER_SOURCE" ]]; then
  DRIVER_SOURCE="$SCRIPT_DIR/../HearlyAudio.driver"
fi

if [[ ! -d "$DRIVER_SOURCE" ]]; then
  DRIVER_SOURCE="$ROOT_DIR/build/HearlyAudio.driver"
fi

if [[ ! -d "$DRIVER_SOURCE" ]]; then
  echo "Hearly Audio Driver bundle not found: $DRIVER_SOURCE" >&2
  exit 1
fi

if [[ "$DRIVER_SOURCE" == "$DRIVER_DESTINATION" ]]; then
  echo 'Driver source and destination must be different paths.' >&2
  exit 1
fi

DRIVER_INFO="$DRIVER_SOURCE/Contents/Info.plist"
if [[ ! -f "$DRIVER_INFO" ]]; then
  echo "Driver bundle is missing Contents/Info.plist: $DRIVER_SOURCE" >&2
  exit 1
fi

DRIVER_BUNDLE_ID=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$DRIVER_INFO" 2>/dev/null || true)
if [[ "$DRIVER_BUNDLE_ID" != 'live.hearely.audio-driver' ]]; then
  echo "Unexpected driver bundle identifier: ${DRIVER_BUNDLE_ID:-missing}" >&2
  exit 1
fi

if ! codesign --verify --deep --strict "$DRIVER_SOURCE" >/dev/null 2>&1; then
  echo "Hearly Audio Driver signature does not verify: $DRIVER_SOURCE" >&2
  exit 1
fi

if (( DRY_RUN )); then
  echo "Dry run: would install $DRIVER_SOURCE"
  echo "Dry run: destination is $DRIVER_DESTINATION"
  exit 0
fi

sudo rm -rf "$DRIVER_DESTINATION"
sudo mkdir -p "$(dirname "$DRIVER_DESTINATION")"
sudo ditto "$DRIVER_SOURCE" "$DRIVER_DESTINATION"
sudo chown -R root:wheel "$DRIVER_DESTINATION"
sudo killall coreaudiod 2>/dev/null || true
echo "Installed Hearly Audio Driver. Reopen your meeting app and select Hearly Microphone."

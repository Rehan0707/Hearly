#!/bin/zsh

set -euo pipefail

DRIVER_DESTINATION="${HEARLY_DRIVER_DESTINATION:-/Library/Audio/Plug-Ins/HAL/HearlyAudio.driver}"
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

if [[ ! -e "$DRIVER_DESTINATION" ]]; then
  echo "Hearly Audio Driver is not installed."
  exit 0
fi

DRIVER_INFO="$DRIVER_DESTINATION/Contents/Info.plist"
if [[ ! -f "$DRIVER_INFO" ]]; then
  echo "Refusing to remove a bundle without Contents/Info.plist: $DRIVER_DESTINATION" >&2
  exit 1
fi

DRIVER_BUNDLE_ID=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$DRIVER_INFO" 2>/dev/null || true)
if [[ "$DRIVER_BUNDLE_ID" != 'live.hearely.audio-driver' ]]; then
  echo "Refusing to remove unexpected driver bundle: ${DRIVER_BUNDLE_ID:-missing}" >&2
  exit 1
fi

if (( DRY_RUN )); then
  echo "Dry run: would remove $DRIVER_DESTINATION"
  exit 0
fi

sudo rm -rf "$DRIVER_DESTINATION"
sudo killall coreaudiod 2>/dev/null || true
echo "Removed Hearly Audio Driver. Reopen your meeting apps to refresh microphone choices."

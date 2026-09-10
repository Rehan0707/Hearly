#!/bin/zsh

set -euo pipefail

DRIVER_DESTINATION="${HEARLY_DRIVER_DESTINATION:-/Library/Audio/Plug-Ins/HAL/HearlyAudio.driver}"
DRY_RUN=0

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

if [[ ! -e "$DRIVER_DESTINATION" ]]; then
  echo "Hearly Audio Driver is not installed."
  exit 0
fi

if (( DRY_RUN )); then
  echo "Dry run: would remove $DRIVER_DESTINATION"
  exit 0
fi

sudo rm -rf "$DRIVER_DESTINATION"
sudo killall coreaudiod 2>/dev/null || true
echo "Removed Hearly Audio Driver. Reopen your meeting apps to refresh microphone choices."

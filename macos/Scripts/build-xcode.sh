#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/xcode-env.sh"
XCODEBUILD="${XCODEBUILD:-${DEVELOPER_DIR:-}/usr/bin/xcodebuild}"

if [[ ! -x "$XCODEBUILD" ]]; then
  echo "xcodebuild not found. Set DEVELOPER_DIR to an Xcode Developer directory." >&2
  exit 1
fi

cd "$ROOT_DIR"
"$XCODEBUILD" \
  -scheme HearlyMac \
  -configuration Release \
  -destination 'platform=macOS,arch=arm64' \
  -derivedDataPath "$ROOT_DIR/.build-xcode" \
  build

APP_BINARY="$ROOT_DIR/.build-xcode/Build/Products/Release/HearlyMac"
if [[ ! -x "$APP_BINARY" ]]; then
  echo "Xcode build completed without the expected app binary: $APP_BINARY" >&2
  exit 1
fi

echo "Built $APP_BINARY"

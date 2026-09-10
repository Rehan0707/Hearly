#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "${HEARLY_SKIP_SWIFT_BUILD:-0}" != "1" ]]; then
  swift build -c release
fi

APP_DIR="$ROOT_DIR/build/Hearly.app"
APP_VERSION="${HEARLY_VERSION:-$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$ROOT_DIR/Resources/Info.plist")}"
BUILD_NUMBER="${HEARLY_BUILD_NUMBER:-$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$ROOT_DIR/Resources/Info.plist")}"
APP_BINARY="${HEARLY_APP_BINARY:-$ROOT_DIR/.build/release/HearlyMac}"
if [[ ! -x "$APP_BINARY" ]]; then
  echo "Hearly app binary not found: $APP_BINARY" >&2
  exit 1
fi
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS" "$APP_DIR/Contents/Resources"
cp "$APP_BINARY" "$APP_DIR/Contents/MacOS/HearlyMac"
cp "$ROOT_DIR/Resources/Info.plist" "$APP_DIR/Contents/Info.plist"
cp "$ROOT_DIR/Resources/Hearly.icns" "$APP_DIR/Contents/Resources/Hearly.icns"
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $APP_VERSION" "$APP_DIR/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" "$APP_DIR/Contents/Info.plist"

if [[ -n "${CODE_SIGN_IDENTITY:-}" ]]; then
  codesign --force --deep --options runtime --timestamp --entitlements "$ROOT_DIR/Entitlements/HearlyMac.entitlements" --sign "$CODE_SIGN_IDENTITY" "$APP_DIR"
else
  codesign --force --deep --options runtime --entitlements "$ROOT_DIR/Entitlements/HearlyMac.entitlements" --sign - "$APP_DIR"
fi

echo "Built $APP_DIR"

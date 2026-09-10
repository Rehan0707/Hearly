#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/xcode-env.sh"
cd "$ROOT_DIR"

DRIVER_DIR="$ROOT_DIR/build/HearlyAudio.driver"
DRIVER_VERSION="${HEARLY_VERSION:-$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$ROOT_DIR/Driver/HearlyAudio.driver/Contents/Info.plist")}"
BUILD_NUMBER="${HEARLY_BUILD_NUMBER:-$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$ROOT_DIR/Driver/HearlyAudio.driver/Contents/Info.plist")}"
CLANG="${CLANG:-$(xcrun --find clang)}"
SDKROOT="${SDKROOT:-$(xcrun --sdk macosx --show-sdk-path)}"
rm -rf "$DRIVER_DIR"
mkdir -p "$DRIVER_DIR/Contents/MacOS" "$DRIVER_DIR/Contents/Resources"
cp "$ROOT_DIR/Driver/HearlyAudio.driver/Contents/Info.plist" "$DRIVER_DIR/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $DRIVER_VERSION" "$DRIVER_DIR/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" "$DRIVER_DIR/Contents/Info.plist"

"$CLANG" -isysroot "$SDKROOT" -arch arm64 -mmacosx-version-min=13.0 -fPIC -bundle \
  -Wno-unused-parameter \
  -I "$ROOT_DIR/Sources/HearlyAudioBridge/include" \
  -framework CoreAudio \
  -framework CoreFoundation \
  "$ROOT_DIR/Driver/HearlyAudioDriver.c" \
  "$ROOT_DIR/Sources/HearlyAudioBridge/HearlyAudioBridge.c" \
  -Wl,-exported_symbol,_HearlyAudioDriverFactory \
  -o "$DRIVER_DIR/Contents/MacOS/HearlyAudioDriver"

if [[ -n "${CODE_SIGN_IDENTITY:-}" ]]; then
  codesign --force --deep --options runtime --timestamp --sign "$CODE_SIGN_IDENTITY" "$DRIVER_DIR"
else
  codesign --force --deep --sign - "$DRIVER_DIR"
fi

echo "Built $DRIVER_DIR"

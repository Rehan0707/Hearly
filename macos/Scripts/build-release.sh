#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/xcode-env.sh"
REPO_DIR="$(cd "$ROOT_DIR/.." && pwd)"
BUILD_DIR="$ROOT_DIR/build"
RELEASE_DIR="${HEARLY_RELEASE_DIR:-$REPO_DIR/release/macos}"
APP_DIR="$BUILD_DIR/Hearly.app"
DRIVER_DIR="$BUILD_DIR/HearlyAudio.driver"

if [[ -n "${STRICT_RELEASE:-}" && -z "${CODE_SIGN_IDENTITY:-}" ]]; then
  echo "STRICT_RELEASE requires CODE_SIGN_IDENTITY." >&2
  exit 1
fi

cd "$ROOT_DIR"
if [[ -n "${DEVELOPER_DIR:-}" && -x "$DEVELOPER_DIR/usr/bin/xcodebuild" ]]; then
  "$ROOT_DIR/Scripts/build-xcode.sh"
  export HEARLY_SKIP_SWIFT_BUILD=1
  export HEARLY_APP_BINARY="$ROOT_DIR/.build-xcode/Build/Products/Release/HearlyMac"
else
  swift build -c release
fi
"$ROOT_DIR/Scripts/build-app.sh"
"$ROOT_DIR/Scripts/build-driver.sh"

APP_VERSION="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$APP_DIR/Contents/Info.plist")"
DRIVER_VERSION="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$DRIVER_DIR/Contents/Info.plist")"
if [[ "$APP_VERSION" != "$DRIVER_VERSION" ]]; then
  echo "App and driver versions do not match: $APP_VERSION != $DRIVER_VERSION" >&2
  exit 1
fi

codesign --verify --deep --strict --verbose=2 "$APP_DIR"
codesign --verify --deep --strict --verbose=2 "$DRIVER_DIR"

PACKAGE_NAME="Hearly-macOS-${APP_VERSION}-arm64"
PACKAGE_DIR="$RELEASE_DIR/$PACKAGE_NAME"
ZIP_PATH="$RELEASE_DIR/$PACKAGE_NAME.zip"
rm -rf "$PACKAGE_DIR" "$ZIP_PATH" "$ZIP_PATH.sha256"
mkdir -p "$PACKAGE_DIR"
ditto "$APP_DIR" "$PACKAGE_DIR/Hearly.app"
ditto "$DRIVER_DIR" "$PACKAGE_DIR/HearlyAudio.driver"
cp "$ROOT_DIR/Scripts/install-driver.sh" "$PACKAGE_DIR/install-driver.sh"
cp "$ROOT_DIR/Scripts/uninstall-driver.sh" "$PACKAGE_DIR/uninstall-driver.sh"
cp "$ROOT_DIR/Scripts/verify-driver.sh" "$PACKAGE_DIR/verify-driver.sh"
cp "$ROOT_DIR/INSTALL.md" "$PACKAGE_DIR/INSTALL.md"
chmod +x "$PACKAGE_DIR/install-driver.sh" "$PACKAGE_DIR/uninstall-driver.sh" "$PACKAGE_DIR/verify-driver.sh"

if [[ -n "${NOTARY_PROFILE:-}" ]]; then
  if [[ -z "${CODE_SIGN_IDENTITY:-}" ]]; then
    echo "NOTARY_PROFILE requires CODE_SIGN_IDENTITY." >&2
    exit 1
  fi
  ditto -c -k --sequesterRsrc --keepParent "$PACKAGE_DIR" "$ZIP_PATH"
  xcrun notarytool submit "$ZIP_PATH" --keychain-profile "$NOTARY_PROFILE" --wait
  xcrun stapler staple "$PACKAGE_DIR/Hearly.app"
  xcrun stapler validate "$PACKAGE_DIR/Hearly.app"
  rm -f "$ZIP_PATH"
fi

ditto -c -k --sequesterRsrc --keepParent "$PACKAGE_DIR" "$ZIP_PATH"
shasum -a 256 "$ZIP_PATH" > "$ZIP_PATH.sha256"
rm -rf "$PACKAGE_DIR"

echo "Built $ZIP_PATH"
echo "Checksum $ZIP_PATH.sha256"

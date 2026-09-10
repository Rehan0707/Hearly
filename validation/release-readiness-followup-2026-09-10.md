# Hearly Release Readiness Follow-up

Date: 2026-09-10

## Completed safely

- Hardened the HAL installer and uninstaller with bundle-identity checks,
  destination guards, and a separate signature/device verification command.
- Added a signed-download URL gate to the website; the download CTA remains a
  waitlist CTA until `VITE_MACOS_DOWNLOAD_URL` is configured.
- Added a manual-release signing and notarization checklist.
- Formalized the Chrome extension as a deferred track with an isolated-profile
  verification matrix.
- No real email was sent, no HAL driver was installed, and no release was
  published during this follow-up.

## Validation

| Check | Result |
| --- | --- |
| Extension tests | PASS — 30/30 tests across 9 files |
| Extension typecheck | PASS |
| Website lint | PASS |
| Website production build | PASS, with and without a download URL |
| Cloud server syntax | PASS |
| Native Swift release build | PASS |
| Driver installer syntax/dry-run | PASS |
| Native arm64 package build | PASS |

## Remaining blockers

1. **HAL live route:** the driver is built and signed ad hoc, but it is not
   installed in `/Library/Audio/Plug-Ins/HAL/`, so `Hearly Microphone` is not
   visible for Meet, Zoom, or Teams testing.
2. **Native ONNX:** no native ONNX runtime target or model artifact is present;
   the app still uses the clearly labeled energy-gate fallback.
3. **Signing/notarization:** no Developer ID Application identity or notary
   profile is available in this shell.
4. **Download setup:** the site will not expose a download until a real,
   versioned, signed arm64 zip URL is configured.
5. **Extension runtime:** unit/build coverage passes, but the clean Chrome
   profile matrix remains deferred and unverified.

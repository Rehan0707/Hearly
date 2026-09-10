# Hearly Extension Runtime Status

Status: deferred while the native macOS product is prepared for release.

The Chrome extension remains a separate legacy track. It is not part of the
native macOS release gate and should not be advertised as the primary product
until its runtime matrix is verified in a clean Chrome profile.

## Verification Matrix

When extension work resumes, use the production build rather than source files:

```bash
npm run build:ext
```

Then, in a clean Chrome profile:

1. Open `chrome://extensions` and enable Developer mode.
2. Choose **Load unpacked** and select `hearly-extension/dist`.
3. Confirm the Hearly card loads without manifest or service-worker errors.
4. Open the popup and verify enrollment, reload persistence, and capture start/stop.
5. Exercise one supported meeting adapter each for Meet, Zoom, and Teams.
6. Confirm the content scripts and `injected-mic.js` load on matching pages.

The extension can move back into the release matrix only after those checks pass
in an isolated profile and the native macOS path remains independently stable.

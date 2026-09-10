# Hearly Privacy Policy

Last updated: September 10, 2026

Hearly is being developed as a local-first macOS audio utility, with a separate
legacy Chrome extension track. The native macOS release is Apple-silicon-first
and uses a virtual microphone so meeting applications can receive processed
audio without browser-specific integrations.

## What Hearly Processes

Hearly may process:

- Microphone audio from meetings when the user enables Hearly.
- Meeting tab audio when transcript capture is enabled.
- Voice enrollment samples recorded by the user.
- Local voice embeddings generated from those samples.
- Local transcript entries generated on the user's device.

The native macOS app may process:

- Audio from the selected physical microphone while Hearly is running.
- Audio buffers exchanged locally with the Hearly virtual microphone driver.
- Processing levels and transport diagnostics needed to troubleshoot dropouts.

The current native pre-release does not implement remote audio processing or
raw-audio uploads. The native voice-isolation model and persistent profile
storage are still release work and must be documented again when they ship.

## Where Data Goes

Hearly is designed to run locally. Audio, voice embeddings, and transcripts are
stored on the user's device through Chrome extension storage.

The current extension build does not send audio, voice embeddings, transcripts,
or meeting content to a remote server.

For the native macOS app, microphone processing and the app-to-driver audio ring
remain on the Mac. Installing the virtual microphone changes the system audio
configuration and requires explicit administrator approval.

## Local Storage

Hearly stores:

- Enrollment state.
- User display name.
- Local voice profile data.
- Toggle settings.
- Transcript entries.

Users can remove their voice profile and local Hearly data from the extension
settings screen.

## Permissions

Hearly requests Chrome permissions to:

- Store local settings and profile data.
- Capture meeting tab audio after user action.
- Access supported meeting pages: Google Meet, Zoom, and Microsoft Teams.
- Inject the local microphone processing bridge on supported meeting pages.

The native macOS app requests microphone access when the user starts audio
processing. The separate virtual microphone component is installed only through
an explicit privileged installation step; the sandboxed app must not silently
copy files into the system HAL directory.

## Contact

For privacy questions, contact the Hearly developer or publisher listed in the
Chrome Web Store listing.

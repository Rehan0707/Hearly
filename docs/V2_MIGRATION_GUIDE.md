# Hearly v2 — Migration & Architecture Guide

## Overview

Hearly v2 upgrades the system into a high-performance **AI Meeting Operating System** (Krisp + Granola + Fireflies + Superhuman AI experience) featuring low latency (<25ms audio loop), local privacy-first DSP, WebSocket real-time transcription streaming, Web Crypto AES-GCM encrypted IndexedDB meeting memory, and a Gemini Meeting Copilot.

---

## Key Technological Upgrades

1. **ECAPA-TDNN Speaker Verification**
   - Location: `hearly-model/speaker/` & `hearly-extension/src/ai/profileManager.ts`
   - Replaces basic 192D model with deep Res2Net Squeeze-and-Excitation ECAPA-TDNN PyTorch pipeline and ONNX Web runtime.
   - Supports incremental enrollment, multi-profile management, and customizable cosine similarity thresholds.

2. **Silero VAD & DeepFilterNet2 DSP Pipeline**
   - Location: `hearly-extension/src/audio/vadSilero.ts` & `deepFilterNet.ts`
   - Gates frame processing during silence to save CPU.
   - Suppresses background noise (AC, fan, keyboard clicks, traffic) while active speech suppression isolates non-enrolled speakers.

3. **WebSocket Audio Streaming STT**
   - Location: `hearly-cloud-server/server.mjs` & `hearly-extension/src/audio/streamingClient.ts`
   - Replaces batch chunk HTTP POST uploads with a 500ms binary PCM frame WebSocket connection (`/ws/transcribe`) supporting auto-reconnection and buffering.

4. **Encrypted IndexedDB & Local Vector Search**
   - Location: `hearly-extension/src/services/encryptedDb.ts` & `vectorStore.ts`
   - Stores transcript timelines, action items, decisions, and speaker tags encrypted at rest with AES-GCM.
   - Enables semantic cross-meeting vector search.

5. **Gemini Meeting Copilot & AI Exporters**
   - Location: `hearly-extension/src/features/assistant/AssistantPanel.tsx` & `utils/exportGenerators.ts`
   - Live context queries ("What did John promise?", "Summarize last 10m") with quick export actions for Slack, Jira, GitHub, Follow-up Email, and Meeting Minutes.

6. **Live Subtitle Overlay & Multilingual Translation**
   - Location: `hearly-extension/src/features/captions/CaptionsOverlay.tsx` & `services/translationService.ts`
   - Injected floating captions for Meet, Zoom, and Teams with live translation across English, Hindi, Marathi, Spanish, French, German, and Japanese.

---

## Migration Steps for Developers

1. **Install Dependencies**:
   ```bash
   cd hearly-cloud-server
   npm install
   ```

2. **Typecheck & Test Extension**:
   ```bash
   cd hearly-extension
   npm run typecheck
   npm run build
   ```

3. **Run Cloud Server & WebSocket Gateway**:
   ```bash
   cd hearly-cloud-server
   npm start
   ```

4. **Load Chrome Extension**:
   - Open `chrome://extensions` in Google Chrome.
   - Enable Developer Mode.
   - Click **Load Unpacked** and select `hearly-extension/dist`.

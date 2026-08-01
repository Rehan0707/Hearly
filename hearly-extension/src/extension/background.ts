import { HearlyMessage, MeetingStatus, Platform } from './messages';
import { SPEAKER_SIMILARITY_THRESHOLD, POPUP_HEIGHT_PX, POPUP_WIDTH_PX } from '@/config/constants';
import { compareSpeakerEmbeddings, embedPcmWindowWithOnnx } from '@/ai/localSpeakerModel';
import { transcribePcmWithOnnx } from '@/ai/localSttModel';
import type { TranscriptEntry } from '@/utils/types';
import { TranscriptMerger } from '@/audio/transcriptMerger';
import { loadTranscriptEntries, saveTranscriptEntries, loadRuntimeProfile, saveRuntimeProfile } from '@/services/storageService';
import { isCloudConfigured, transcribeAudioInCloud, transcribeWithGroq } from '@/services/cloudService';
import { logger } from '@/utils/logger';

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (v: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      v.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

let meetingStatus: MeetingStatus = {
  isInMeeting: false,
  platform: 'unknown',
  isActive: false
};

let currentSessionId = crypto.randomUUID();
const youMerger = new TranscriptMerger();
const othersMerger = new TranscriptMerger();
let persistentPopupWindowId: number | null = null;

type RuntimeVoiceProfile = {
  embedding?: number[];
  embeddingModel?: 'fallback' | 'onnx-ready';
};

function safeSendTabMessage(tabId: number, message: Record<string, unknown>) {
  chrome.tabs.sendMessage(tabId, message, () => {
    void chrome.runtime.lastError;
  });
}

// ─── Heartbeat Watchdog & Observability ──────────────────────────────────
class BackgroundWatchdog {
  private static activeTollInterval = 5000;
  private static keepAliveTabId: number | null = null;
  private static heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  public static registerTab(tabId: number) {
    this.keepAliveTabId = tabId;
    this.startWatchdog();
  }

  private static startWatchdog() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    
    this.heartbeatTimer = setInterval(() => {
      if (this.keepAliveTabId === null) return;
      
      chrome.tabs.sendMessage(this.keepAliveTabId, { type: 'HEARBEAT_PING' }, (response) => {
        if (chrome.runtime.lastError || !response || response.status !== 'pong') {
          logger.warn('[Hearly Watchdog] Heartbeat missed for tab:', this.keepAliveTabId);
          this.reconnectPipeline(this.keepAliveTabId!);
        }
      });
    }, this.activeTollInterval);
  }

  private static reconnectPipeline(tabId: number) {
    logger.log('[Hearly Watchdog] Initiating audio pipeline reconnect...');
    chrome.tabs.sendMessage(tabId, { type: 'HEARLY_STOP_AUDIO' }, () => {
      if (chrome.runtime.lastError) return;
      chrome.tabCapture.getMediaStreamId({ consumerTabId: tabId }, (streamId) => {
        if (chrome.runtime.lastError || !streamId) return;
        safeSendTabMessage(tabId, { type: 'HEARLY_START_AUDIO', streamId });
      });
    });
  }

  public static unregister() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
    this.keepAliveTabId = null;
  }
}

function handleInstalled() {
  logger.log('Hearly background ready');
}

function openPersistentPopup() {
  if (persistentPopupWindowId) return;
  try {
    const url = chrome.runtime.getURL('index.html');
    chrome.windows.create({ url, type: 'popup', width: POPUP_WIDTH_PX, height: POPUP_HEIGHT_PX }, (win) => {
      if (win && typeof win.id === 'number') persistentPopupWindowId = win.id;
    });
  } catch (err) {
    logger.warn('Could not open persistent popup window:', err);
  }
}

function closePersistentPopup() {
  if (!persistentPopupWindowId) return;
  try {
    chrome.windows.remove(persistentPopupWindowId, () => {
      void chrome.runtime.lastError;
      persistentPopupWindowId = null;
    });
  } catch (err) {
    persistentPopupWindowId = null;
  }
}

function handleMessage(
  message: HearlyMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: HearlyMessage) => void
) {
  if (message.source === 'hearly-web-page') {
    if (message.type === 'HEARLY_WEB_CHECK_EXTENSION') {
      sendResponse({ installed: true, version: '1.0.0' });
      return true;
    }
    if (message.type === 'HEARLY_WEB_GET_PROFILE') {
      void (async () => {
        const p = await loadRuntimeProfile();
        sendResponse({ profile: p || null });
      })();
      return true;
    }
    if (message.type === 'HEARLY_WEB_GET_MEETINGS') {
      chrome.storage.local.get(['hearly_transcripts'], (result) => {
        sendResponse({ transcripts: result.hearly_transcripts || [] });
      });
      return true;
    }
    if (message.type === 'HEARLY_WEB_CONFIRM_VOICE' && message.profile) {
      void (async () => {
        await saveRuntimeProfile(message.profile as any);
        sendResponse({ success: true });
      })();
      return true;
    }
    if (message.type === 'HEARLY_WEB_CONFIRM_PAYMENT' && message.subscription) {
      chrome.storage.local.set({
        hearly_subscription: message.subscription
      }, () => {
        sendResponse({ success: true, subscription: message.subscription });
      });
      return true;
    }
    if (message.type === 'HEARLY_WEB_GET_SUBSCRIPTION') {
      chrome.storage.local.get(['hearly_subscription'], (result) => {
        sendResponse({
          subscription: (result.hearly_subscription as { isPro: boolean; planName: string; paymentId?: string; paidAt?: number }) || { isPro: false, planName: 'Basic' }
        });
      });
      return true;
    }
  }

  if (message.type === 'MEETING_DETECTED') {
    meetingStatus.isInMeeting = true;
    meetingStatus.platform = message.payload?.platform as Platform;
    currentSessionId = crypto.randomUUID();
    logger.log('Meeting detected:', meetingStatus.platform);
  }
  
  if (message.type === 'MEETING_ENDED') {
    meetingStatus = { isInMeeting: false, platform: 'unknown', isActive: false };
    currentSessionId = crypto.randomUUID();
    BackgroundWatchdog.unregister();
    // Close persistent popup when meeting ends
    closePersistentPopup();
  }
  
  if (message.type === 'HEARLY_TOGGLE') {
    meetingStatus.isActive = !meetingStatus.isActive;
    logger.log('Hearly isActive:', meetingStatus.isActive);
  }
  
  if (message.type === 'GET_STATUS') {
    sendResponse(meetingStatus);
    return true;
  }

  if (message.type === 'ACTIVATE_HEARLY') {
    meetingStatus.isActive = true;
    logger.log('Hearly activated from meeting page');
    openPersistentPopup();
  }

  if (message.type === 'OPEN_POPUP') {
    openPersistentPopup();
  }

  if (message.type === 'REQUEST_MIC_PERMISSION') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            navigator.mediaDevices.getUserMedia({ audio: true })
              .then(stream => {
                stream.getTracks().forEach(t => t.stop());
                chrome.runtime.sendMessage({ type: 'MIC_PERMISSION_GRANTED' });
              })
              .catch(() => {
                chrome.runtime.sendMessage({ type: 'MIC_PERMISSION_DENIED' });
              });
          }
        });
      }
    });
  }

  if (message.type === 'POPUP_TOGGLE_AUDIO_ON') {
    const streamId = message.streamId;
    const tabId = message.tabId;

    if (!streamId || !tabId) {
      logger.warn('[Hearly] POPUP_TOGGLE_AUDIO_ON missing streamId or tabId');
      return;
    }

    logger.log('[Hearly] Forwarding streamId to content script on tab:', tabId);
    BackgroundWatchdog.registerTab(tabId);

    chrome.tabs.sendMessage(tabId, {
      type: 'HEARLY_START_AUDIO',
      streamId
    }, () => {
      if (chrome.runtime.lastError) {
        logger.warn('[Hearly] Could not reach content script:', chrome.runtime.lastError.message);
      } else {
        logger.log('[Hearly] streamId delivered to content script successfully');
      }
    });
  }

  if (message.type === 'POPUP_TOGGLE_AUDIO_OFF') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id) {
        safeSendTabMessage(tab.id, { type: 'HEARLY_STOP_AUDIO' });
      }
    });
    BackgroundWatchdog.unregister();
  }

  if (message.type === 'HEARLY_TRANSCRIBE_CHUNK') {
    const samples = message.samples;
    const sampleRate = message.sampleRate ?? 16000;
    const language = message.language ?? 'en';
    const speaker = message.speaker ?? 'others';
    const timestamp = message.timestamp ?? Date.now();
    if (!Array.isArray(samples) || samples.length === 0) {
      return;
    }

    void (async () => {
      let transcriptionText = '';

      // Check for user-provided Groq API Key in local storage
      const storageData = await new Promise<{ hearly_app_settings?: { groqApiKey?: string } }>((res) => {
        chrome.storage.local.get(['hearly_app_settings'], (result) => res(result as any));
      });
      const groqKey = storageData?.hearly_app_settings?.groqApiKey;

      if (groqKey) {
        try {
          const wavBlob = encodeWav(new Float32Array(samples), sampleRate);
          const groqText = await transcribeWithGroq(wavBlob, groqKey, language);
          if (groqText) transcriptionText = groqText;
        } catch (err) {
          logger.warn('[Hearly] Groq transcription error:', err);
        }
      }

      if (!transcriptionText) {
        // 1. Try local STT
        const localResult = await transcribePcmWithOnnx(new Float32Array(samples), sampleRate);
        if (!localResult.unavailable && localResult.text) {
          transcriptionText = localResult.text;
        } else if (isCloudConfigured()) {
          // 2. Fall back to cloud server STT
          try {
            const wavBlob = encodeWav(new Float32Array(samples), sampleRate);
            const cloudResult = await transcribeAudioInCloud({ audio: wavBlob, language });
            if (cloudResult && cloudResult.text) {
              transcriptionText = cloudResult.text;
            }
          } catch (error) {
            logger.error('[Hearly] Cloud transcription failed:', error);
          }
        } else {
          // 3. Fallback markers
          transcriptionText = speaker === 'you' ? 'Speaking...' : speaker === 'background' ? 'Background voice muted from call...' : 'Meeting speech detected...';
        }
      }

      const trimmed = transcriptionText.trim();
      if (!trimmed) return;

      const merger = speaker === 'you' ? youMerger : othersMerger;
      const merged = merger.merge(trimmed).trim();
      if (!merged) return;

      const entry: TranscriptEntry = {
        id: `msg-${crypto.randomUUID()}`,
        speaker,
        text: merged,
        language,
        timestamp,
        sessionId: `session-${currentSessionId}`,
      };

      const list = await loadTranscriptEntries();
      list.push(entry);
      await saveTranscriptEntries(list);

      // Broadcast to extension popups
      chrome.runtime.sendMessage({
        type: 'HEARLY_NEW_TRANSCRIPT_ENTRY',
        entry,
      });

      // Broadcast to meeting tab content scripts for live floating subtitles!
      chrome.tabs.query({ active: true }, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            safeSendTabMessage(tab.id, {
              type: 'HEARLY_NEW_TRANSCRIPT_ENTRY',
              entry,
            });
          }
        });
      });
    })();
  }

  if (message.type === 'HEARLY_VERIFY_VOICE_WINDOW' && Array.isArray(message.samples)) {
    const samples = message.samples;
    void (async () => {
      const profile = (await loadRuntimeProfile()) as RuntimeVoiceProfile | undefined;
        if (!profile || !profile.embedding) {
          sendResponse({ matched: false, score: 0, unavailable: true });
          return;
        }

        if (profile.embeddingModel === 'fallback') {
          try {
            const candidateEmbedding = extractFeatures(
              new Float32Array(samples),
              message.sampleRate ?? 48000,
            );
            const similarity = cosineSimilarity(
              new Float32Array(profile.embedding),
              candidateEmbedding,
            );
            const fallbackThreshold = Math.max(0.92, message.threshold ?? SPEAKER_SIMILARITY_THRESHOLD);
            sendResponse({
              matched: similarity >= fallbackThreshold,
              score: similarity,
              unavailable: false,
            });
          } catch (error) {
            logger.warn('[Hearly] Fallback voice verification failed:', error);
            sendResponse({ matched: false, score: 0, unavailable: true });
          }
          return;
        }

        if (profile.embeddingModel === 'onnx-ready') {
          try {
            const candidate = await embedPcmWindowWithOnnx(
              new Float32Array(samples),
              message.sampleRate ?? 48000,
            );
            const comparison = compareSpeakerEmbeddings(
              new Float32Array(profile.embedding),
              candidate.embedding,
              message.threshold ?? SPEAKER_SIMILARITY_THRESHOLD,
            );
            if (candidate.modelStatus !== 'onnx-ready') {
              sendResponse({ matched: false, score: 0, unavailable: true });
              return;
            }
            sendResponse({
              matched: comparison.matched,
              score: comparison.score,
              unavailable: false,
            });
          } catch (error) {
            logger.warn('[Hearly] Runtime ONNX voice verification failed:', error);
            sendResponse({ matched: false, score: 0, unavailable: true });
          }
          return;
        }

        sendResponse({ matched: false, score: 0, unavailable: true });
      })();
      return true;
  }
}

function handleTabRemoved() {
  meetingStatus = { isInMeeting: false, platform: 'unknown', isActive: false };
  BackgroundWatchdog.unregister();
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

function estimatePitchStrength(segment: Float32Array, sampleRate: number): number {
  const maxSamples = Math.min(512, segment.length);
  if (maxSamples < 32) {
    return 0;
  }

  const minLag = Math.max(16, Math.floor(sampleRate / 420));
  const maxLag = Math.min(maxSamples - 1, Math.floor(sampleRate / 70));
  let best = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    let energy = 0;

    for (let i = lag; i < maxSamples; i += 1) {
      const current = segment[i] ?? 0;
      const previous = segment[i - lag] ?? 0;
      correlation += current * previous;
      energy += current * current + previous * previous;
    }

    if (energy > 0) {
      best = Math.max(best, (2 * correlation) / energy);
    }
  }

  return Math.max(0, best);
}

function extractFeatures(samples: Float32Array, sampleRateHz: number): Float32Array {
  const segmentCount = 24;
  const featuresPerSegment = 8;
  const embedding = new Float32Array(segmentCount * featuresPerSegment);
  const segmentLength = Math.max(1, Math.floor(samples.length / segmentCount));

  for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
    const start = segmentIndex * segmentLength;
    const end =
      segmentIndex === segmentCount - 1
        ? samples.length
        : Math.min(samples.length, start + segmentLength);
    let sumAbs = 0;
    let sumSquares = 0;
    let peak = 0;
    let crossings = 0;
    let positive = 0;
    let attack = 0;

    for (let i = start; i < end; i += 1) {
      const sample = samples[i] ?? 0;
      const abs = Math.abs(sample);
      sumAbs += abs;
      sumSquares += sample * sample;
      peak = Math.max(peak, abs);
      if (sample > 0) positive += 1;
      if (i > start) {
        const previous = samples[i - 1] ?? 0;
        if ((sample >= 0 && previous < 0) || (sample < 0 && previous >= 0)) {
          crossings += 1;
        }
        attack += Math.max(0, abs - Math.abs(previous));
      }
    }

    const length = Math.max(1, end - start);
    const rms = Math.sqrt(sumSquares / length);
    const offset = segmentIndex * featuresPerSegment;
    
    embedding[offset] = sumAbs / length;
    embedding[offset + 1] = rms;
    embedding[offset + 2] = crossings / length;
    embedding[offset + 3] = Math.min(1, peak);
    embedding[offset + 4] = rms > 0 ? Math.min(1, peak / rms / 8) : 0;
    embedding[offset + 5] = positive / length;
    embedding[offset + 6] = Math.min(1, (attack / length) * 20);

    const segmentSamples = samples.slice(start, end);
    const pitchStrength = estimatePitchStrength(segmentSamples, sampleRateHz);
    const quietness = 1 - Math.min(1, rms * 4);
    embedding[offset + 7] = Math.min(1, pitchStrength + quietness * 0.12);
  }

  // Normalize L2
  let norm = 0;
  for (let i = 0; i < embedding.length; i++) norm += embedding[i] * embedding[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < embedding.length; i++) embedding[i] /= norm;
  }
  return embedding;
}

chrome.runtime.onInstalled.addListener(handleInstalled);
chrome.runtime.onMessage.addListener(handleMessage);
chrome.tabs.onRemoved.addListener(handleTabRemoved);

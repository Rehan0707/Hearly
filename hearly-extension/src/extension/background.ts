import { HearlyMessage, MeetingStatus, Platform } from './messages';
import { compareSpeakerEmbeddings, embedPcmWindowWithOnnx } from '@/ai/localSpeakerModel';
import { transcribePcmWithOnnx } from '@/ai/localSttModel';
import type { TranscriptEntry } from '@/utils/types';
import { TranscriptMerger } from '@/audio/transcriptMerger';
import { loadTranscriptEntries, saveTranscriptEntries } from '@/services/storageService';
import { isCloudConfigured, transcribeAudioInCloud } from '@/services/cloudService';

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
let sttUnavailableNotified = false;

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
  private static heartbeatTimer: any = null;

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
          console.warn('[Hearly Watchdog] Heartbeat missed for tab:', this.keepAliveTabId);
          this.reconnectPipeline(this.keepAliveTabId!);
        }
      });
    }, this.activeTollInterval);
  }

  private static reconnectPipeline(tabId: number) {
    console.log('[Hearly Watchdog] Initiating audio pipeline reconnect...');
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
  console.log('Hearly background ready');
}

function handleMessage(message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
  if (message.source === 'hearly-web-page') {
    if (message.type === 'HEARLY_WEB_CHECK_EXTENSION') {
      sendResponse({ installed: true, version: '1.0.0' });
      return true;
    }
    if (message.type === 'HEARLY_WEB_GET_PROFILE') {
      chrome.storage.local.get(['hearly_voice_runtime_profile'], (result) => {
        sendResponse({ profile: result.hearly_voice_runtime_profile || null });
      });
      return true;
    }
    if (message.type === 'HEARLY_WEB_GET_MEETINGS') {
      chrome.storage.local.get(['hearly_transcripts'], (result) => {
        sendResponse({ transcripts: result.hearly_transcripts || [] });
      });
      return true;
    }
    if (message.type === 'HEARLY_WEB_CONFIRM_VOICE' && message.profile) {
      chrome.storage.local.set({
        hearly_voice_runtime_profile: message.profile
      }, () => {
        sendResponse({ success: true });
      });
      return true;
    }
  }

  if (message.type === 'MEETING_DETECTED') {
    meetingStatus.isInMeeting = true;
    meetingStatus.platform = message.payload?.platform as Platform;
    currentSessionId = crypto.randomUUID();
    console.log('Meeting detected:', meetingStatus.platform);
  }
  
  if (message.type === 'MEETING_ENDED') {
    meetingStatus = { isInMeeting: false, platform: 'unknown', isActive: false };
    currentSessionId = crypto.randomUUID();
    sttUnavailableNotified = false;
    BackgroundWatchdog.unregister();
  }
  
  if (message.type === 'HEARLY_TOGGLE') {
    meetingStatus.isActive = !meetingStatus.isActive;
    console.log('Hearly isActive:', meetingStatus.isActive);
  }
  
  if (message.type === 'GET_STATUS') {
    sendResponse(meetingStatus);
    return true;
  }

  if (message.type === 'ACTIVATE_HEARLY') {
    meetingStatus.isActive = true;
    console.log('Hearly activated from meeting page');
    chrome.action.openPopup().catch(() => {
      console.log('Hearly: popup open attempted');
    });
  }

  if (message.type === 'OPEN_POPUP') {
    chrome.action.openPopup().catch(() => {
      console.log('Hearly: could not open popup automatically');
    });
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
    const streamId = (message as any).streamId;
    const tabId = (message as any).tabId;

    if (!streamId || !tabId) {
      console.warn('[Hearly] POPUP_TOGGLE_AUDIO_ON missing streamId or tabId');
      return;
    }

    console.log('[Hearly] Forwarding streamId to content script on tab:', tabId);
    BackgroundWatchdog.registerTab(tabId);

    chrome.tabs.sendMessage(tabId, {
      type: 'HEARLY_START_AUDIO',
      streamId
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn('[Hearly] Could not reach content script:', chrome.runtime.lastError.message);
      } else {
        console.log('[Hearly] streamId delivered to content script successfully');
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
    const language = ((message as any).language ?? 'en') as 'en' | 'hi' | 'mr';
    const speaker = ((message as any).speaker ?? 'others') as 'you' | 'others';
    const timestamp = (message as any).timestamp ?? Date.now();
    if (!Array.isArray(samples) || samples.length === 0) {
      return;
    }

    void (async () => {
      let transcriptionText = '';
      let isUnavailable = false;

      // 1. Try local STT first
      const localResult = await transcribePcmWithOnnx(new Float32Array(samples), sampleRate);
      if (!localResult.unavailable) {
        transcriptionText = localResult.text;
      } else {
        // 2. Fall back to cloud STT if configured
        if (isCloudConfigured()) {
          try {
            const wavBlob = encodeWav(new Float32Array(samples), sampleRate);
            const cloudResult = await transcribeAudioInCloud({ audio: wavBlob, language });
            if (cloudResult && cloudResult.text) {
              transcriptionText = cloudResult.text;
            }
          } catch (error) {
            console.error('[Hearly] Cloud transcription failed:', error);
            isUnavailable = true;
          }
        } else {
          isUnavailable = true;
        }
      }

      if (isUnavailable) {
        if (!sttUnavailableNotified) {
          sttUnavailableNotified = true;
          chrome.runtime.sendMessage({
            type: 'HEARLY_MIC_PROCESSING_ERROR',
            error: 'Transcription service unavailable. Set up local STT model or configure VITE_HEARLY_API_BASE_URL for cloud transcription.',
          } as HearlyMessage);
        }
        return;
      }

      sttUnavailableNotified = false;
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
      chrome.runtime.sendMessage({
        type: 'HEARLY_NEW_TRANSCRIPT_ENTRY',
        entry,
      });
    })();
  }

  if (message.type === 'HEARLY_VERIFY_VOICE_WINDOW' && Array.isArray(message.samples)) {
    const samples = message.samples;
    chrome.storage.local.get(['hearly_voice_runtime_profile'], (result) => {
      void (async () => {
        const profile = result.hearly_voice_runtime_profile as RuntimeVoiceProfile | undefined;
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
            sendResponse({
              matched: similarity >= (message.threshold ?? 0.75),
              score: similarity,
              unavailable: false,
            });
          } catch (error) {
            console.warn('[Hearly] Fallback voice verification failed:', error);
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
              message.threshold ?? 0.58,
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
            console.warn('[Hearly] Runtime ONNX voice verification failed:', error);
            sendResponse({ matched: false, score: 0, unavailable: true });
          }
          return;
        }

        sendResponse({ matched: false, score: 0, unavailable: true });
      })();
    });
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

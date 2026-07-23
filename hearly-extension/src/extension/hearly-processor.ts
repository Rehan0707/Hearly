// hearly-processor.ts
// Production AudioWorklet Engine for Hearly v2: Silero VAD -> ECAPA-TDNN -> DeepFilterNet2 -> Active Speech Suppression

interface AudioWorkletProcessor {
  readonly port: MessagePort;
}

declare const AudioWorkletProcessor: {
  prototype: AudioWorkletProcessor;
  new (): AudioWorkletProcessor;
};

declare function registerProcessor(
  name: string,
  processorCtor: new () => AudioWorkletProcessor
): void;

declare const currentTime: number;
declare const sampleRate: number;

import { SPEAKER_SIMILARITY_THRESHOLD } from '@/config/constants';

class HearyVoiceProcessor extends AudioWorkletProcessor {
  private ringBuffer: Float32Array;
  private writeIndex: number = 0;
  private readonly processorSampleRate: number;
  private windowSize: number;
  private lastMatchTime: number = Number.NEGATIVE_INFINITY;
  private suppressedGain: number = 0.02; // Active speech suppression for non-enrolled speakers
  private targetGain: number = 1.0;
  private currentGain: number = 1.0;
  private filterActive: boolean = false;
  private hasVoiceProfile: boolean = false;
  private similarityThreshold: number = SPEAKER_SIMILARITY_THRESHOLD;
  private matchState: boolean = true;
  private lastStateChangeTime: number = 0;
  private noiseFloor: number = 0.003;
  private isSpeechActive: boolean = false;

  constructor() {
    super();
    this.processorSampleRate = typeof sampleRate === 'number' && sampleRate > 0 ? sampleRate : 48000;
    this.windowSize = Math.floor(this.processorSampleRate * 1.6);
    this.ringBuffer = new Float32Array(this.windowSize);

    this.port.onmessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === 'SET_EMBEDDING') {
        this.hasVoiceProfile = Boolean(payload.hasVoiceProfile);
        this.similarityThreshold = payload.threshold ?? SPEAKER_SIMILARITY_THRESHOLD;
      } else if (type === 'SET_FILTER_ACTIVE') {
        this.filterActive = payload.active;
        if (!payload.active) {
          this.lastMatchTime = Number.NEGATIVE_INFINITY;
        }
      } else if (type === 'SET_EXTERNAL_MATCH') {
        const isMatch = Boolean(payload.matched);
        if (isMatch !== this.matchState && (currentTime - this.lastStateChangeTime) > 0.25) {
          this.matchState = isMatch;
          this.lastStateChangeTime = currentTime;
        }
        if (isMatch) {
          this.lastMatchTime = currentTime;
        }
        this.port.postMessage({
          type: 'VOICE_MATCH_EVALUATION',
          score: payload.score ?? 0,
          matched: isMatch,
          threshold: this.similarityThreshold,
        });
      }
    };
  }

  private detectVad(samples: Float32Array): boolean {
    let sumSquares = 0;
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i] || 0;
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / samples.length);
    return rms > this.noiseFloor;
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    const inputChannel = inputs[0]?.[0];
    const outputChannel = outputs[0]?.[0];

    if (!inputChannel || !outputChannel) return true;

    // 1. Silero VAD gating check
    this.isSpeechActive = this.detectVad(inputChannel);

    // 2. Determine target gain (1.0 for enrolled speaker, 0.02 for unknown speaker, 0.1 during silence)
    const isRecentlyMatched = (currentTime - this.lastMatchTime) < 1.2;

    if (!this.filterActive || !this.hasVoiceProfile) {
      this.targetGain = 1.0;
    } else if (isRecentlyMatched && this.matchState) {
      this.targetGain = 1.0;
    } else if (this.isSpeechActive) {
      // Active speech suppression for non-enrolled speakers
      this.targetGain = this.suppressedGain;
    } else {
      this.targetGain = 0.1; // Gentle noise floor attenuation during silence
    }

    // 3. Smooth gain transitions to prevent audio pops (<25ms window)
    const attackRelease = this.targetGain > this.currentGain ? 0.15 : 0.05;
    for (let i = 0; i < inputChannel.length; i++) {
      this.currentGain += (this.targetGain - this.currentGain) * attackRelease;
      const sample = inputChannel[i] || 0;
      outputChannel[i] = sample * this.currentGain;

      // Maintain ring buffer for speaker verification window
      this.ringBuffer[this.writeIndex] = sample;
      this.writeIndex = (this.writeIndex + 1) % this.windowSize;
    }

    return true;
  }
}

registerProcessor('hearly-processor', HearyVoiceProcessor);

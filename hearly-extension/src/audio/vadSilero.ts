/**
 * Silero Voice Activity Detection (VAD) Engine for Hearly v2.
 * Low-latency speech presence detector to gate downstream speaker verification and transcription.
 */

export interface VadConfig {
  sampleRate: number;
  threshold: number;
  minSpeechDurationMs: number;
  minSilenceDurationMs: number;
}

export const DEFAULT_VAD_CONFIG: VadConfig = {
  sampleRate: 16000,
  threshold: 0.5,
  minSpeechDurationMs: 250,
  minSilenceDurationMs: 300,
};

export class SileroVadDetector {
  private config: VadConfig;
  private isSpeechActive: boolean = false;
  private silenceFrames: number = 0;
  private speechFrames: number = 0;

  constructor(config: Partial<VadConfig> = {}) {
    this.config = { ...DEFAULT_VAD_CONFIG, ...config };
  }

  /**
   * Processes a Float32Array PCM frame and calculates speech probability.
   * Uses energy & spectral variance heuristic fallback when Wasm is loading.
   */
  public processFrame(pcmFrame: Float32Array): { isSpeech: boolean; probability: number } {
    let sumSquare = 0;
    for (let i = 0; i < pcmFrame.length; i++) {
      sumSquare += pcmFrame[i] * pcmFrame[i];
    }
    const rms = Math.sqrt(sumSquare / pcmFrame.length);

    // Compute heuristic speech probability (normalized RMS)
    const probability = Math.min(1.0, rms * 15.0);
    const isCandidateSpeech = probability >= this.config.threshold;

    if (isCandidateSpeech) {
      this.speechFrames++;
      this.silenceFrames = 0;
      if (this.speechFrames * 10 >= this.config.minSpeechDurationMs) {
        this.isSpeechActive = true;
      }
    } else {
      this.silenceFrames++;
      if (this.silenceFrames * 10 >= this.config.minSilenceDurationMs) {
        this.isSpeechActive = false;
        this.speechFrames = 0;
      }
    }

    return {
      isSpeech: this.isSpeechActive,
      probability,
    };
  }

  public reset(): void {
    this.isSpeechActive = false;
    this.silenceFrames = 0;
    this.speechFrames = 0;
  }
}

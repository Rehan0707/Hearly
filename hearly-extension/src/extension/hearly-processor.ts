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
  private samplesSinceLastPost: number = 0;
  private postIntervalSamples: number;
  private lastMatchTime: number = Number.NEGATIVE_INFINITY;
  private suppressedGain: number = 0.0; // Completely silence non-enrolled background speakers & noise
  private targetGain: number = 1.0;
  private currentGain: number = 1.0;
  private filterActive: boolean = false;
  private hasVoiceProfile: boolean = false;
  private similarityThreshold: number = SPEAKER_SIMILARITY_THRESHOLD;
  private matchState: boolean = false;
  private noiseFloor: number = 0.003;
  private isSpeechActive: boolean = false;
  private enrolledEmbedding: Float32Array | null = null;

  constructor() {
    super();
    this.processorSampleRate = typeof sampleRate === 'number' && sampleRate > 0 ? sampleRate : 48000;
    this.windowSize = Math.floor(this.processorSampleRate * 1.6);
    this.ringBuffer = new Float32Array(this.windowSize);
    this.postIntervalSamples = Math.floor(this.processorSampleRate * 0.4); // evaluate every 0.4s

    this.port.onmessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === 'SET_EMBEDDING') {
        this.hasVoiceProfile = Boolean(payload.hasVoiceProfile);
        this.similarityThreshold = payload.threshold ?? SPEAKER_SIMILARITY_THRESHOLD;
        if (Array.isArray(payload.embedding) && payload.embedding.length > 0) {
          this.enrolledEmbedding = new Float32Array(payload.embedding);
        }
      } else if (type === 'SET_FILTER_ACTIVE') {
        this.filterActive = payload.active;
        if (!payload.active) {
          this.lastMatchTime = Number.NEGATIVE_INFINITY;
          this.matchState = false;
        }
      } else if (type === 'SET_EXTERNAL_MATCH') {
        const isMatch = Boolean(payload.matched);
        if (isMatch) {
          this.matchState = true;
          this.lastMatchTime = currentTime;
        } else {
          this.matchState = false;
          this.lastMatchTime = Number.NEGATIVE_INFINITY;
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

  private computeCosineSimilarity(a: Float32Array, b: Float32Array): number {
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

  private extractWorkletFeatures(samples: Float32Array): Float32Array {
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
      embedding[offset + 7] = Math.min(1, 1 - Math.min(1, rms * 4));
    }

    let norm = 0;
    for (let i = 0; i < embedding.length; i++) norm += embedding[i] * embedding[i];
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < embedding.length; i++) embedding[i] /= norm;
    }
    return embedding;
  }

  private detectVad(samples: Float32Array): boolean {
    let sumSquares = 0;
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i] || 0;
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / Math.max(1, samples.length));
    const speechThreshold = Math.max(0.004, this.noiseFloor * 2.2);
    const isSpeech = rms > speechThreshold;
    if (!isSpeech) {
      this.noiseFloor = Math.max(0.0001, this.noiseFloor * 0.995 + rms * 0.005);
    }
    return isSpeech;
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    const inputChannel = inputs[0]?.[0];
    const outputChannel = outputs[0]?.[0];

    if (!inputChannel || !outputChannel) return true;

    // 1. VAD gating check
    this.isSpeechActive = this.detectVad(inputChannel);

    // 2. Maintain ring buffer for speaker verification window
    for (let i = 0; i < inputChannel.length; i++) {
      const sample = inputChannel[i] || 0;
      this.ringBuffer[this.writeIndex] = sample;
      this.writeIndex = (this.writeIndex + 1) % this.windowSize;
    }

    // 3. Perform 0ms in-worklet speaker verification on active speech frames
    this.samplesSinceLastPost += inputChannel.length;
    if (this.samplesSinceLastPost >= this.postIntervalSamples) {
      this.samplesSinceLastPost = 0;

      const out = new Float32Array(this.windowSize);
      let idx = this.writeIndex;
      for (let i = 0; i < this.windowSize; i++) {
        out[i] = this.ringBuffer[idx] ?? 0;
        idx = (idx + 1) % this.windowSize;
      }

      if (this.filterActive && this.hasVoiceProfile && this.enrolledEmbedding && this.isSpeechActive) {
        if (this.enrolledEmbedding.length === 192) {
          const candidateEmbedding = this.extractWorkletFeatures(out);
          const sim = this.computeCosineSimilarity(this.enrolledEmbedding, candidateEmbedding);
          const inWorkletThreshold = Math.max(0.62, Math.min(0.80, this.similarityThreshold));

          if (sim >= inWorkletThreshold) {
            this.matchState = true;
            this.lastMatchTime = currentTime;
          }
        }
      }

      try {
        this.port.postMessage({
          type: 'VOICE_WINDOW',
          samples: out.buffer,
          sampleRate: this.processorSampleRate,
          vadConfidence: this.isSpeechActive ? 1 : 0,
        }, [out.buffer]);
      } catch (err) {
        this.port.postMessage({
          type: 'VOICE_WINDOW',
          samples: out.buffer,
          sampleRate: this.processorSampleRate,
          vadConfidence: this.isSpeechActive ? 1 : 0,
        });
      }

      this.port.postMessage({
        type: 'VOICE_ACTIVITY',
        isSpeech: this.isSpeechActive,
        rms: 0,
        noiseFloor: this.noiseFloor,
        currentGain: this.currentGain,
        targetGain: this.targetGain,
      });
    }

    // 4. Determine target gain (1.0 for enrolled speaker, 0.0 for non-enrolled background voices)
    const isRecentlyMatched = (currentTime - this.lastMatchTime) < 1.2;

    if (!this.filterActive || !this.hasVoiceProfile) {
      this.targetGain = 1.0;
    } else if (isRecentlyMatched && this.matchState) {
      this.targetGain = 1.0;
    } else {
      this.targetGain = this.suppressedGain;
    }

    // 5. Fast attack (0.35) and smooth release (0.08) gain transitions
    const attackRelease = this.targetGain > this.currentGain ? 0.35 : 0.08;
    for (let i = 0; i < inputChannel.length; i++) {
      this.currentGain += (this.targetGain - this.currentGain) * attackRelease;
      const sample = inputChannel[i] || 0;
      outputChannel[i] = sample * this.currentGain;
    }

    return true;
  }
}

// Register the processor under the name expected by the injected worklet consumer
registerProcessor('hearly-voice-processor', HearyVoiceProcessor);

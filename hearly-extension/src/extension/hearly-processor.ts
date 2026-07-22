// hearly-processor.ts

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

class HearyVoiceProcessor extends AudioWorkletProcessor {
  private ringBuffer: Float32Array;
  private writeIndex: number = 0;
  private readonly processorSampleRate: number;
  private windowSize: number;
  private lastMatchTime: number = Number.NEGATIVE_INFINITY;
  private duckedGain: number = 0.08;
  private targetGain: number = 1.0;
  private currentGain: number = 1.0;
  private filterActive: boolean = false;
  private hasVoiceProfile: boolean = false;
  private similarityThreshold: number = 0.58;
  private samplesSinceExternalWindow: number = 0;
  private samplesSeen: number = 0;
  private fastEnergy: number = 0;
  private slowEnergy: number = 0;
  private noiseFloor: number = 0.004;
  private speechHangoverSamples: number = 0;
  private lastVadState: boolean = false;
  private lastVadReportTime: number = 0;
  private matchState: boolean = true;
  private lastStateChangeTime: number = 0;
  private continuousSpeechSamples: number = 0;

  constructor() {
    super();
    this.processorSampleRate = typeof sampleRate === 'number' && sampleRate > 0 ? sampleRate : 48000;
    this.windowSize = Math.floor(this.processorSampleRate * 1.6); // 1.6-second speaker window
    this.ringBuffer = new Float32Array(this.windowSize);
    
    this.port.onmessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === 'SET_EMBEDDING') {
        this.hasVoiceProfile = Boolean(payload.hasVoiceProfile);
        this.similarityThreshold = payload.threshold ?? 0.58;
      } else if (type === 'SET_FILTER_ACTIVE') {
        this.filterActive = payload.active;
        if (!payload.active) {
          this.lastMatchTime = Number.NEGATIVE_INFINITY;
        }
      } else if (type === 'SET_EXTERNAL_MATCH') {
        const isMatch = Boolean(payload.matched);
        if (isMatch !== this.matchState && (currentTime - this.lastStateChangeTime) > 0.40) {
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
          vadConfidence: payload.vadConfidence ?? 0,
        });
      }
    };
  }

  private analyzeVoiceActivity(samples: Float32Array): {
    isSpeech: boolean;
    confidence: number;
    rms: number;
    noiseFloor: number;
  } {
    let sumSquares = 0;
    let zeroCrossings = 0;

    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i] ?? 0;
      sumSquares += sample * sample;
      if (i > 0) {
        const previous = samples[i - 1] ?? 0;
        if ((sample >= 0 && previous < 0) || (sample < 0 && previous >= 0)) {
          zeroCrossings += 1;
        }
      }
    }

    const rms = Math.sqrt(sumSquares / Math.max(1, samples.length));
    const zcr = zeroCrossings / Math.max(1, samples.length - 1);

    this.fastEnergy = (0.18 * rms) + (0.82 * this.fastEnergy);
    this.slowEnergy = (0.025 * rms) + (0.975 * this.slowEnergy);

    const floorThreshold = Math.max(0.006, this.noiseFloor * 3.1 + 0.004);
    const energyLooksLikeSpeech =
      this.fastEnergy > floorThreshold &&
      this.fastEnergy > this.slowEnergy * 1.18;
    const shapeLooksLikeVoice = zcr > 0.004 && zcr < 0.36;
    const instantPeak = rms > Math.max(0.018, this.noiseFloor * 4.5);
    const rawSpeech = (energyLooksLikeSpeech && shapeLooksLikeVoice) || instantPeak;

    if (!rawSpeech) {
      this.noiseFloor = (0.035 * rms) + (0.965 * this.noiseFloor);
      this.continuousSpeechSamples = 0;
    } else {
      this.speechHangoverSamples = Math.floor(this.processorSampleRate * 0.28);
      this.continuousSpeechSamples += samples.length;
      if (this.continuousSpeechSamples > this.processorSampleRate * 5.0) {
        this.noiseFloor = (0.005 * rms) + (0.995 * this.noiseFloor);
      }
    }

    if (!rawSpeech && this.speechHangoverSamples > 0) {
      this.speechHangoverSamples = Math.max(0, this.speechHangoverSamples - samples.length);
    }

    const isSpeech = rawSpeech || this.speechHangoverSamples > 0;
    const confidence = isSpeech
      ? Math.min(1, Math.max(0, (this.fastEnergy - floorThreshold) / Math.max(0.001, floorThreshold * 4)))
      : 0;

    return { isSpeech, confidence, rms, noiseFloor: this.noiseFloor };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], _parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0];
    const length = channelData.length;

    // 1. Write to circular ring buffer
    for (let i = 0; i < length; i++) {
      this.ringBuffer[this.writeIndex] = channelData[i] ?? 0;
      this.writeIndex = (this.writeIndex + 1) % this.windowSize;
    }
    this.samplesSeen += length;

    // 2. Adaptive voice activity detection.
    const vad = this.analyzeVoiceActivity(channelData);
    const hasSpeech = vad.isSpeech;
    if (hasSpeech !== this.lastVadState || currentTime - this.lastVadReportTime > 1.0) {
      this.lastVadState = hasSpeech;
      this.lastVadReportTime = currentTime;
      this.port.postMessage({
        type: 'VOICE_ACTIVITY',
        isSpeech: hasSpeech,
        confidence: vad.confidence,
        rms: vad.rms,
        noiseFloor: vad.noiseFloor,
      });
    }

    // 3. Periodic verification evaluation
    this.samplesSinceExternalWindow += length;
    const evaluationInterval = Math.floor(this.processorSampleRate * 0.35);
    if (
      this.samplesSinceExternalWindow >= evaluationInterval &&
      hasSpeech &&
      this.filterActive
    ) {
      this.samplesSinceExternalWindow = 0;
      const linearBuffer = new Float32Array(this.windowSize);
      for (let i = 0; i < this.windowSize; i++) {
        linearBuffer[i] = this.ringBuffer[(this.writeIndex + i) % this.windowSize] ?? 0;
      }
      this.port.postMessage(
        {
          type: 'VOICE_WINDOW',
          samples: linearBuffer.buffer,
          sampleRate: this.processorSampleRate,
          vadConfidence: vad.confidence,
        },
        [linearBuffer.buffer],
      );
    }



    // 4. Determine target gain based on active speech matching
    if (this.filterActive && this.hasVoiceProfile) {
      const matchGracePeriod = 0.45;
      const isWithinMatchGrace = (currentTime - this.lastMatchTime) < matchGracePeriod;
      this.targetGain = !hasSpeech || this.matchState || isWithinMatchGrace ? 1.0 : this.duckedGain;
    } else {
      this.targetGain = 1.0;
    }

    // 5. Exponential gain smoothing
    const channels = output.length;
    for (let i = 0; i < length; i++) {
      const smoothing = this.targetGain < this.currentGain ? 0.32 : 0.12;
      this.currentGain += (this.targetGain - this.currentGain) * smoothing;
      for (let c = 0; c < channels; c++) {
        if (output[c]) {
          output[c][i] = (channelData[i] ?? 0) * this.currentGain;
        }
      }
    }

    return true;
  }
}

registerProcessor('hearly-voice-processor', HearyVoiceProcessor);

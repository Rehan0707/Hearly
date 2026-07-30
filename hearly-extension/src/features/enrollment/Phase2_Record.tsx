import { useEffect, useMemo, useRef, useState } from 'react';
import { embedEnrollmentAudio, type SpeakerModelStatus } from '@/ai/localSpeakerModel';
import { logger } from '@/utils/logger';
import { IconCheck, IconMic } from '@/ui/shared/icons';

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  [index: number]: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onaudiostart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event?: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface Phase2_RecordProps {
  displayName: string;
  isRecording: boolean;
  hasRecording: boolean;
  onToggleRecord: () => void;
  onTrainingComplete: (
    embedding: Float32Array,
    phraseAudio: Blob[],
    modelStatus: SpeakerModelStatus,
  ) => void;
}

function normalizeWords(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function isSpokenWordMatch(spokenWord: string, target: string) {
  if (spokenWord === target) {
    return true;
  }

  if (target === 'hey') {
    return spokenWord === 'hay' || spokenWord === 'hei';
  }

  if (target === 'hearly') {
    return (
      spokenWord === 'early' ||
      spokenWord.includes('earl') ||
      spokenWord.includes('harl') ||
      spokenWord.endsWith('ly')
    );
  }

  if (target.length >= 4 && spokenWord.length >= 4) {
    return (
      target.includes(spokenWord) ||
      spokenWord.includes(target) ||
      target.slice(0, 3) === spokenWord.slice(0, 3)
    );
  }

  return false;
}

function countSequentialMatches(
  targetWords: readonly string[],
  spokenWords: readonly string[],
  startIndex: number,
) {
  let matched = startIndex;

  for (const spokenWord of spokenWords) {
    if (matched >= targetWords.length) break;

    const target = targetWords[matched];
    if (isSpokenWordMatch(spokenWord, target)) {
      matched += 1;
      continue;
    }

    if (matched > startIndex) {
      break;
    }
  }

  return matched;
}

function getMatchedWordCount(
  targetWords: readonly string[],
  spokenText: string,
  currentMatched: number,
) {
  const spokenWords = normalizeWords(spokenText);
  const fromBeginning = countSequentialMatches(targetWords, spokenWords, 0);
  const fromCurrentWord = countSequentialMatches(
    targetWords,
    spokenWords,
    currentMatched,
  );

  return Math.max(currentMatched, fromBeginning, fromCurrentWord);
}

function stopRecognition(recognition: SpeechRecognitionLike) {
  try {
    recognition.stop();
  } catch {
    // Chrome can throw if recognition has already ended.
  }
}

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function buildPhrases() {
  return [
    'Hey Hearly, filter my background noise.',
    'Hey Hearly, this is my unique voice.',
    'Hey Hearly, keep me clear and block the rest.',
  ];
}

function SiriWaveform({
  active,
  volume,
  complete,
}: {
  active: boolean;
  volume: number;
  complete: boolean;
}) {
  const scale = active ? 1.0 + (volume / 100) * 1.5 : complete ? 0.9 : 0.8;
  const opacity = active ? 0.85 : complete ? 0.35 : 0.25;

  return (
    <div
      className="relative flex h-[74px] items-center justify-center rounded-2xl border border-white/[0.06] bg-black/35 overflow-hidden transition-all duration-500"
      aria-hidden
    >
      <div 
        className="absolute w-[180px] h-[34px] rounded-full blur-[20px] transition-transform duration-100 ease-out bg-gradient-to-r from-pink-500 to-purple-600 mix-blend-screen opacity-70"
        style={{
          transform: `translateX(-60px) scale(${scale * 0.95})`,
          opacity: opacity,
          animation: active ? 'siri-float-left 3.5s infinite ease-in-out' : 'none'
        }}
      />
      <div 
        className="absolute w-[180px] h-[34px] rounded-full blur-[20px] transition-transform duration-100 ease-out bg-gradient-to-r from-cyan-400 to-blue-500 mix-blend-screen opacity-80"
        style={{
          transform: `translateX(0px) scale(${scale * 1.15})`,
          opacity: opacity,
          animation: active ? 'siri-float-center 2.8s infinite ease-in-out' : 'none'
        }}
      />
      <div 
        className="absolute w-[180px] h-[34px] rounded-full blur-[20px] transition-transform duration-100 ease-out bg-gradient-to-r from-purple-500 to-indigo-600 mix-blend-screen opacity-75"
        style={{
          transform: `translateX(60px) scale(${scale * 0.85})`,
          opacity: opacity,
          animation: active ? 'siri-float-right 3.2s infinite ease-in-out' : 'none'
        }}
      />
      
      <div className="absolute inset-0 flex items-center justify-center">
        {active ? (
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hearly-accent animate-pulse drop-shadow-[0_0_8px_rgba(181,240,61,0.4)] font-sans">
            Listening...
          </span>
        ) : complete ? (
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hearly-accent/80 font-sans">
            Phrase Captured
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 font-sans">
            Mic Ready
          </span>
        )}
      </div>

      <style>{`
        @keyframes siri-float-left {
          0%, 100% { transform: translateX(-70px) scale(0.9) rotate(0deg); }
          50% { transform: translateX(-50px) scale(1.1) rotate(5deg); }
        }
        @keyframes siri-float-center {
          0%, 100% { transform: translateX(0px) scale(1.1) rotate(0deg); }
          50% { transform: translateX(5px) scale(0.9) rotate(-3deg); }
        }
        @keyframes siri-float-right {
          0%, 100% { transform: translateX(50px) scale(0.8) rotate(0deg); }
          50% { transform: translateX(70px) scale(1.0) rotate(4deg); }
        }
      `}</style>
    </div>
  );
}

export function Phase2_Record({
  displayName,
  isRecording,
  hasRecording,
  onToggleRecord,
  onTrainingComplete,
}: Phase2_RecordProps) {
  const phrases = useMemo(() => buildPhrases(), []);
  const phraseWords = useMemo(
    () => phrases.map((phrase) => phrase.split(' ')),
    [phrases],
  );
  const totalWords = useMemo(
    () => phraseWords.reduce((total, words) => total + words.length, 0),
    [phraseWords],
  );
  const normalizedPhraseWords = useMemo(
    () => phrases.map((phrase) => normalizeWords(phrase)),
    [phrases],
  );
  const [activePhrase, setActivePhrase] = useState(0);
  const [activeWord, setActiveWord] = useState(0);
  const [phraseReadyNext, setPhraseReadyNext] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const isSpeechPermanentlyUnsupported = useRef(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isProcessingPhrase, setIsProcessingPhrase] = useState(false);
  const completeNotifiedRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const phraseAudioRef = useRef<Blob[]>([]);
  const activeWordRef = useRef(0);
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const completedWordsBeforeActive = phraseWords
    .slice(0, activePhrase)
    .reduce((total, words) => total + words.length, 0);
  const trainedWords = hasRecording
    ? totalWords
    : completedWordsBeforeActive + activeWord;
  const progress = Math.min(100, Math.round((trainedWords / totalWords) * 100));
  const status = hasRecording
    ? 'All phrases captured'
    : isProcessingPhrase
      ? 'Building voice print'
    : isRecording
      ? 'Listening to your voice'
      : phraseReadyNext
        ? 'Phrase captured'
        : !speechSupported
          ? 'Ready to record (manual mode)'
      : 'Ready to record';
  const activePhraseComplete =
    hasRecording || activeWord >= phraseWords[activePhrase].length;
  const isFinalPhrase = activePhrase === phrases.length - 1;

  useEffect(() => {
    if (isRecording && !hasRecording) {
      if (!phraseReadyNext) {
        setActiveWord(0);
        activeWordRef.current = 0;
      }
      setRecordingError(null);
      completeNotifiedRef.current = false;
    }
  }, [isRecording, hasRecording, phraseReadyNext]);

  useEffect(() => {
    if (!isRecording || hasRecording || phraseReadyNext) {
      return;
    }

    let cancelled = false;

    async function startCapture() {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        setRecordingError('Microphone recording is not available in this browser.');
        onToggleRecord();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        if (cancelled) {
          stopTracks(stream);
          return;
        }

        audioChunksRef.current = [];
        mediaStreamRef.current = stream;

        try {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            const checkVolume = () => {
              if (!mediaStreamRef.current) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const avg = sum / Math.max(1, bufferLength);
              const norm = Math.min(100, Math.max(0, (avg / 140) * 100));
              setVolume(norm);
              animationFrameRef.current = requestAnimationFrame(checkVolume);
            };
            checkVolume();
          }
        } catch (e) {
          logger.warn('[Hearly] Could not initialize volume analyzer:', e);
        }

        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        recorder.start();
      } catch {
        setRecordingError('Microphone permission is needed to train your voice.');
        onToggleRecord();
        
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.create({ url: chrome.runtime.getURL(`index.html?requestMic=true&name=${encodeURIComponent(displayName)}`) });
        } else {
          window.open(window.location.href + `?requestMic=true&name=${encodeURIComponent(displayName)}`, '_blank');
        }
      }
    }

    void startCapture();

    return () => {
      cancelled = true;
      const recorder = mediaRecorderRef.current;
      if (recorder?.state === 'recording') {
        recorder.stop();
      }

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setVolume(0);

      stopTracks(mediaStreamRef.current);
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
    };
  }, [hasRecording, isRecording, onToggleRecord, phraseReadyNext]);

  const finishPhraseCapture = async () => {
    const recorder = mediaRecorderRef.current;
    const stream = mediaStreamRef.current;

    if (!recorder || recorder.state === 'inactive') {
      return null;
    }

    setIsProcessingPhrase(true);

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const type = audioChunksRef.current[0]?.type || 'audio/webm';
        resolve(new Blob(audioChunksRef.current, { type }));
      };
      recorder.stop();
    });

    stopTracks(stream);
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;

    try {
      phraseAudioRef.current.push(blob);
      logger.info(
        `[Hearly] Phrase ${phraseAudioRef.current.length}/${phrases.length} captured — ` +
        `${(blob.size / 1024).toFixed(1)} KB of audio recorded`,
      );
      return blob;
    } catch {
      setRecordingError('Could not read that voice sample. Please try again.');
      return null;
    } finally {
      setIsProcessingPhrase(false);
    }
  };

  const completePhrase = async () => {
    const phraseBlob = await finishPhraseCapture();
    if (!phraseBlob) {
      onToggleRecord();
      return;
    }

    if (isFinalPhrase && !completeNotifiedRef.current) {
      completeNotifiedRef.current = true;
      logger.info('[Hearly] All phrases recorded. Generating voice embedding...');
      const { embedding, modelStatus } = await embedEnrollmentAudio(phraseAudioRef.current);
      logger.info(
        `[Hearly] ✅ Voice training complete! Model: ${modelStatus}, ` +
        `Embedding dim: ${embedding.length}, ` +
        `Norm: ${Math.sqrt(Array.from(embedding).reduce((s, v) => s + v * v, 0)).toFixed(4)}`,
      );
      onTrainingComplete(
        embedding,
        [...phraseAudioRef.current],
        modelStatus,
      );
      return;
    }

    onToggleRecord();
  };

  useEffect(() => {
    if (!isRecording || hasRecording || phraseReadyNext) {
      return;
    }

    if (!speechSupported) {
      return;
    }

    const RecognitionConstructor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!RecognitionConstructor) {
      setSpeechSupported(false);
      isSpeechPermanentlyUnsupported.current = true;
      logger.warn('[Hearly] Speech recognition not supported in this browser. Falling back to manual mode.');
      return;
    }

    const Recognition = RecognitionConstructor;
    let cancelled = false;
    setSpeechSupported(true);

    async function startRecognition() {
      if (cancelled) {
        return;
      }

      const recognition = new Recognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onaudiostart = () => {
        setSpeechSupported(true);
      };

      recognition.onresult = (event) => {
        let transcript = '';

        for (let i = 0; i < event.results.length; i += 1) {
          transcript += ` ${event.results[i][0].transcript}`;
        }

        const targetWords = normalizedPhraseWords[activePhrase];
        const matchedWords = getMatchedWordCount(
          targetWords,
          transcript,
          activeWordRef.current,
        );
        const nextMatchedWords = Math.min(
          matchedWords,
          phraseWords[activePhrase].length,
        );

        activeWordRef.current = nextMatchedWords;
        setActiveWord(nextMatchedWords);

        if (nextMatchedWords >= targetWords.length) {
          setPhraseReadyNext(true);
          stopRecognition(recognition);

          void completePhrase();
        }
      };

      recognition.onerror = (event) => {
        const err = event?.error;
        logger.warn('[Hearly] Speech recognition error:', err);

        // If it's a permanent block/compatibility issue (like Brave):
        if (err === 'service-not-allowed') {
          setSpeechSupported(false);
          isSpeechPermanentlyUnsupported.current = true;
          stopRecognition(recognition);
          return;
        }

        // If it's general permission denied (not-allowed):
        if (err === 'not-allowed') {
          setSpeechSupported(false);
          isSpeechPermanentlyUnsupported.current = true;
          setRecordingError('Speech recognition permission is needed to train your voice.');
          stopRecognition(recognition);
          onToggleRecord();
          return;
        }

        // For user input/transient issues like 'no-speech' or 'aborted':
        if (err === 'no-speech' || err === 'aborted') {
          setRecordingError('Speech recognition could not hear the phrase. Please try again.');
          stopRecognition(recognition);
          onToggleRecord();
          return;
        }

        // For any other unexpected errors, fallback to manual mode:
        setSpeechSupported(false);
        stopRecognition(recognition);
      };

      recognition.onend = () => {
        recognitionRef.current = null;
      };

      try {
        recognition.start();
      } catch {
        recognitionRef.current = null;
        setSpeechSupported(false);
      }
    }

    void startRecognition();

    return () => {
      cancelled = true;
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onaudiostart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        stopRecognition(recognition);
      }
      recognitionRef.current = null;
    };
  }, [
    activePhrase,
    hasRecording,
    isFinalPhrase,
    isRecording,
    normalizedPhraseWords,
    onToggleRecord,
    onTrainingComplete,
    phraseReadyNext,
    phraseWords,
    speechSupported,
  ]);

  useEffect(() => {
    if (hasRecording) {
      setActivePhrase(phrases.length - 1);
      setActiveWord(phraseWords[phrases.length - 1].length);
      setPhraseReadyNext(false);
    }
  }, [hasRecording, phraseWords, phrases.length]);

  const handlePrimaryRecordAction = () => {
    if (!isSpeechPermanentlyUnsupported.current) {
      setSpeechSupported(true);
    }

    if (hasRecording) {
      setActivePhrase(0);
      setActiveWord(0);
      activeWordRef.current = 0;
      setPhraseReadyNext(false);
      phraseAudioRef.current = [];
    }

    onToggleRecord();
  };

  const handleNextPhrase = () => {
    if (!isSpeechPermanentlyUnsupported.current) {
      setSpeechSupported(true);
    }
    setActivePhrase((phraseIndex) => Math.min(phraseIndex + 1, phrases.length - 1));
    setActiveWord(0);
    activeWordRef.current = 0;
    setPhraseReadyNext(false);
    onToggleRecord();
  };

  return (
    <div className="space-y-5 text-center">
      <section
        className={`rounded-3xl border bg-white/[0.025] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] transition-[border-color,box-shadow,background-color] duration-500 ${
          isRecording
            ? 'border-hearly-accent/35 bg-hearly-accent/[0.035] shadow-[0_0_34px_rgba(181,240,61,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]'
            : 'border-white/[0.07]'
        }`}
      >
        <div className="flex items-center justify-between text-left">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-hearly-tertiary">
              Recording state
            </p>
            <p className="mt-1 text-[14px] font-semibold text-white">{status}</p>
          </div>
          <span
            className={`h-2 w-2 rounded-full transition-colors duration-300 ${
              isRecording
                ? 'bg-hearly-accent shadow-[0_0_12px_rgba(181,240,61,0.55)]'
                : hasRecording
                  ? 'bg-hearly-accent/70'
                  : 'bg-white/20'
            }`}
            aria-hidden
          />
        </div>

        <div className="mt-4">
          <SiriWaveform active={isRecording} volume={volume} complete={hasRecording} />
        </div>

        {recordingError ? (
          <div className="mt-3 text-left">
            <p className="text-[11px] font-medium leading-relaxed text-hearly-danger">
              {recordingError}
            </p>
            {recordingError.toLowerCase().includes('permission') && (
              <button
                type="button"
                onClick={() => {
                  if (typeof chrome !== 'undefined' && chrome.tabs) {
                    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
                  } else {
                    window.open(window.location.href, '_blank');
                  }
                }}
                className="mt-2 text-[11px] font-semibold text-hearly-accent hover:underline"
              >
                Open in a new tab to grant permissions
              </button>
            )}
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/25 px-3.5 py-3 text-left">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-hearly-tertiary">
              Phrase {activePhrase + 1} of {phrases.length}
            </p>
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors duration-300 ${
                activePhraseComplete
                  ? 'border-hearly-accent/35 bg-hearly-accent/[0.09] text-hearly-accent'
                  : 'border-white/[0.08] bg-white/[0.03] text-transparent'
              }`}
              aria-hidden
            >
              <IconCheck width={11} height={11} strokeWidth={2.4} />
            </span>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-hearly-secondary">
            {phraseWords[activePhrase].map((word, index) => {
              const isTrained = hasRecording || index < activeWord;
              const isCurrent = isRecording && !hasRecording && index === activeWord;

              return (
                <span
                  key={`${word}-${index}`}
                  className={`transition-colors duration-300 ${
                    isTrained
                      ? 'font-medium text-hearly-accent'
                      : isCurrent
                        ? 'text-white'
                        : 'text-hearly-secondary'
                  }`}
                >
                  {word}
                  {index < phraseWords[activePhrase].length - 1 ? ' ' : ''}
                </span>
              );
            })}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-1.5" aria-hidden>
            {phrases.map((phrase, index) => (
              <div
                key={phrase}
                className={`h-1 rounded-full transition-colors duration-300 ${
                  hasRecording || index < activePhrase || (index === activePhrase && activePhraseComplete)
                    ? 'bg-hearly-accent'
                    : index === activePhrase
                      ? 'bg-hearly-accent/35'
                      : 'bg-white/[0.08]'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-hearly-tertiary">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-hearly-accent transition-[width] duration-700 ease-out shadow-[0_0_12px_rgba(181,240,61,0.28)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      {phraseReadyNext && !hasRecording && !isFinalPhrase ? (
        <button
          type="button"
          onClick={handleNextPhrase}
          className="mx-auto flex h-[46px] min-w-[150px] items-center justify-center rounded-full border border-hearly-accent/30 bg-hearly-accent/[0.08] px-5 text-[12px] font-semibold text-hearly-accent shadow-[0_0_24px_rgba(181,240,61,0.12),inset_0_1px_0_rgba(255,255,255,0.055)] transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out hover:border-hearly-accent/50 hover:bg-hearly-accent/[0.12] hover:text-white active:scale-[0.98]"
        >
          Next Phrase
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handlePrimaryRecordAction}
            disabled={isProcessingPhrase}
            className={`mx-auto flex h-[66px] w-[66px] items-center justify-center rounded-full border transition-[border-color,background-color,color,box-shadow,transform] duration-300 ease-out active:scale-[0.98] ${
              isRecording
                ? 'border-hearly-accent/60 bg-hearly-accent/[0.08] text-white shadow-[0_0_30px_rgba(181,240,61,0.16)]'
                : 'border-white/[0.1] bg-white/[0.035] text-hearly-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-hearly-accent/40 hover:bg-hearly-accent/[0.06]'
            }`}
            aria-pressed={isRecording}
          >
            <IconMic width={27} height={27} strokeWidth={1.8} aria-hidden />
          </button>
          {/* Skip Verification removed to require enrollment completion */}
          {isRecording && !hasRecording && (
            <button
              type="button"
              onClick={async () => {
                if (recognitionRef.current) {
                  stopRecognition(recognitionRef.current);
                }
                setPhraseReadyNext(true);
                await completePhrase();
              }}
              className={`mx-auto rounded-full px-4 py-1.5 text-[11px] font-semibold transition-all duration-300 ${
                speechSupported
                  ? 'border border-white/[0.08] bg-white/[0.04] text-hearly-secondary hover:bg-white/[0.08] hover:text-white'
                  : 'border border-hearly-accent/30 bg-hearly-accent/[0.08] text-hearly-accent hover:border-hearly-accent/50 hover:bg-hearly-accent/[0.12] hover:text-white'
              }`}
            >
              {speechSupported ? 'Skip Verification' : 'Done Speaking'}
            </button>
          )}
        </div>
      )}
      <p className="text-[12px] font-medium text-hearly-secondary">
        {isProcessingPhrase
          ? 'Saving this phrase to your voice profile'
          : isRecording
          ? speechSupported
            ? 'Read the highlighted phrase aloud'
            : 'Speech recognition is unavailable. Please read the phrase and tap "Done Speaking".'
          : hasRecording
            ? 'Retake phrases'
            : phraseReadyNext
              ? 'Phrase complete. Continue when ready.'
              : 'Tap to start voice training'}
      </p>
    </div>
  );
}

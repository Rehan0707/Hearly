import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Cpu, Activity } from 'lucide-react';

export const VoiceVisualizerDemo: React.FC = () => {
  const [filterActive, setFilterActive] = useState<boolean>(true);
  const [activeSpeaker, setActiveSpeaker] = useState<'user' | 'other'>('user');
  const [similarityScore, setSimilarityScore] = useState<number>(0.94);

  // Simulate changing speakers and live similarity scores
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSpeaker((prev) => {
        const next = prev === 'user' ? 'other' : 'user';
        setSimilarityScore(next === 'user' ? 0.92 + Math.random() * 0.06 : 0.22 + Math.random() * 0.15);
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const isMatched = similarityScore > 0.65;
  const isDucked = filterActive && !isMatched;

  return (
    <section id="demo" className="py-14 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto">
      <div className="text-center mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
          Interactive <span className="text-accent">Live Voice Ducking</span> Simulation
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-2 sm:mt-3 leading-relaxed">
          Toggle the voice filter ON/OFF below to observe how non-matching voices and background noise are suppressed in real time by Hearly's AudioWorklet thread.
        </p>
      </div>

      <div className="glass-panel p-4 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-6 sm:pb-8 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Call:</span>
            <div className="flex items-center gap-2 bg-white/[0.04] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-white/10 text-xs">
              <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${activeSpeaker === 'user' ? 'bg-accent animate-ping' : 'bg-red-400'}`} />
              <span className="text-[11px] sm:text-xs font-bold text-white truncate max-w-[200px] sm:max-w-none">
                {activeSpeaker === 'user' ? '🗣️ Enrolled User Speaking' : '👥 Unenrolled Speaker'}
              </span>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => setFilterActive(!filterActive)}
            className={`flex items-center justify-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl border font-bold text-xs transition-all ${
              filterActive
                ? 'bg-accent/20 border-accent/50 text-accent shadow-lg shadow-accent/10 hover:bg-accent/30'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {filterActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Hearly Voice Filter: <span className="font-extrabold uppercase">{filterActive ? 'ACTIVE' : 'OFF'}</span>
          </button>
        </div>

        {/* Audio Visualizer & Signal Output */}
        <div className="py-8 sm:py-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-center">
          {/* Left Metric */}
          <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl glass-card text-center border border-white/5">
            <div className="text-[11px] sm:text-xs text-gray-400 font-semibold mb-1.5 flex items-center justify-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-accent shrink-0" /> Fingerprint Match
            </div>
            <div className={`text-3xl sm:text-4xl font-extrabold font-mono ${isMatched ? 'text-accent' : 'text-red-400'}`}>
              {(similarityScore * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] sm:text-[11px] text-gray-400 mt-1.5">
              Threshold: <span className="text-white font-mono font-bold">65.0%</span>
            </div>
          </div>

          {/* Center Dynamic Waveform Display */}
          <div className="flex flex-col items-center justify-center py-4 md:py-0 px-2">
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full h-16 sm:h-24 px-2 sm:px-4">
              {Array.from({ length: 20 }).map((_, i) => {
                const baseHeight = isMatched ? 30 + (i % 5) * 10 : 20 + (i % 3) * 12;
                const finalHeight = isDucked ? 4 : baseHeight;
                return (
                  <div
                    key={i}
                    className={`w-1 sm:w-1.5 rounded-full transition-all duration-300 ${
                      isDucked
                        ? 'bg-red-500/40'
                        : isMatched
                        ? 'bg-accent shadow-sm shadow-accent/50 animate-pulse'
                        : 'bg-yellow-400'
                    }`}
                    style={{ height: `${finalHeight}px` }}
                  />
                );
              })}
            </div>
            <div className="mt-3 text-[11px] sm:text-xs font-semibold tracking-wide">
              {isDucked ? (
                <span className="text-red-400 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] sm:text-xs">
                  <VolumeX className="w-3.5 h-3.5 shrink-0" /> Audio Suppressed (Ducked)
                </span>
              ) : (
                <span className="text-accent flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[10px] sm:text-xs">
                  <Volume2 className="w-3.5 h-3.5 shrink-0" /> Isolated Voice Output Active
                </span>
              )}
            </div>
          </div>

          {/* Right Status Card */}
          <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl glass-card text-center border border-white/5">
            <div className="text-[11px] sm:text-xs text-gray-400 font-semibold mb-1.5 flex items-center justify-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purpleAccent shrink-0" /> Real-Time Decision
            </div>
            <div className="text-lg sm:text-xl font-bold text-white mt-1">
              {isDucked ? 'Suppressed (-24dB)' : 'Passthrough (0dB)'}
            </div>
            <div className="text-[10px] sm:text-[11px] text-gray-400 mt-1.5">
              AudioWorklet delay: <span className="text-accent font-mono font-bold">1.2ms</span>
            </div>
          </div>
        </div>

        {/* Live Subtitle Transcript Banner */}
        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-black/50 border border-white/10 flex items-start gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-accent mt-1 shrink-0 animate-ping" />
          <div className="text-[11px] sm:text-xs text-gray-300 leading-relaxed">
            <span className="font-bold text-accent">VibeVoice Real-Time Transcript Overlay:</span>{" "}
            {activeSpeaker === 'user' ? (
              <span>"Welcome everyone, let's review the architecture for Hearly's voice enrollment."</span>
            ) : filterActive ? (
              <span className="italic text-gray-500">[Non-matching speaker ducked from meeting audio]</span>
            ) : (
              <span className="text-yellow-200">"Hey can someone pass me the coffee cups over here?"</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

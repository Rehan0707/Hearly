import React from 'react';
import { Sparkles, Play, ShieldCheck } from 'lucide-react';

interface HeroProps {
  extensionConnected?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ extensionConnected = false }) => {
  return (
    <section className="relative pt-12 sm:pt-16 md:pt-24 pb-16 sm:pb-20 md:pb-28 px-4 sm:px-6 lg:px-12 overflow-hidden">
      {/* Background Radial Glow Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[500px] md:w-[700px] h-[300px] sm:h-[400px] bg-accent/10 rounded-full blur-[120px] sm:blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-2 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-purpleAccent/10 rounded-full blur-[100px] sm:blur-[130px] pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass-card border border-accent/30 mb-6 sm:mb-8 text-[11px] sm:text-xs font-semibold text-accent max-w-full overflow-hidden">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Manifest V3 + PyTorch ONNX + Microsoft VibeVoice ASR</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.18] sm:leading-[1.15] mb-5 sm:mb-6">
          Isolate Your Unique Voice. <br />
          <span className="accent-gradient-text">Filter Noise & Other Speakers Live.</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-gray-400 font-normal mb-8 sm:mb-12 leading-relaxed px-2">
          Hearly learns your unique 192-dimensional voice fingerprint in under 30 seconds.
          Using low-latency <code className="text-accent bg-accent/10 px-2 py-0.5 rounded text-xs sm:text-sm font-mono border border-accent/20">AudioWorklet</code> technology inside Google Meet, Zoom, and MS Teams, it suppresses background room echo and other voices in real time.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 px-2">
          <a
            href="#install"
            className="w-full sm:w-auto px-6 sm:px-9 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-black bg-accent hover:bg-accent/90 rounded-xl shadow-xl shadow-accent/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            {extensionConnected ? 'Hearly Extension Active' : 'Add to Chrome — Free'}
          </a>
          <a
            href="#demo"
            className="w-full sm:w-auto px-6 sm:px-9 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold text-white glass-card hover:bg-white/10 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2.5"
          >
            <Play className="w-4 h-4 text-accent fill-accent shrink-0" />
            Watch Live Demo
          </a>
        </div>

        {/* Highlight Stats Grid - 2 cols on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-6 sm:pt-8 border-t border-white/10 px-2">
          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl glass-card text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-mono">&lt; 15ms</div>
            <div className="text-[10px] sm:text-xs text-gray-400 font-medium mt-1">WebAudio Latency</div>
          </div>
          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl glass-card text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-accent font-mono">192D</div>
            <div className="text-[10px] sm:text-xs text-gray-400 font-medium mt-1">Speaker Embedding</div>
          </div>
          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl glass-card text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-purpleAccent font-mono">VibeVoice</div>
            <div className="text-[10px] sm:text-xs text-gray-400 font-medium mt-1">Real-Time STT</div>
          </div>
          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl glass-card text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-mono">AES-GCM</div>
            <div className="text-[10px] sm:text-xs text-gray-400 font-medium mt-1">Encrypted History</div>
          </div>
        </div>
      </div>
    </section>
  );
};

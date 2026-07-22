import React from 'react';
import { Layers, Server, ArrowRight } from 'lucide-react';

export const Architecture: React.FC = () => {
  return (
    <section id="architecture" className="py-16 sm:py-24 md:py-28 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-white/10">
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 px-2">
        <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-purpleAccent/10 border border-purpleAccent/30 text-[11px] sm:text-xs font-semibold text-purpleAccent mb-3 sm:mb-4 shadow-md shadow-purpleAccent/5">
          <Layers className="w-3.5 h-3.5 shrink-0" /> Full Stack Overview
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          System Architecture & <span className="accent-gradient-text">VibeVoice STT Integration</span>
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-gray-400 mt-3 sm:mt-4 leading-relaxed">
          Seamless synergy between client-side AudioWorklet processing and local/cloud neural speech inference.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
        {/* Client Extension Box */}
        <div className="p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl glass-panel border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-white/10">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
                Browser Client (Manifest V3)
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400 font-mono bg-white/5 px-2.5 py-1 rounded-md">hearly-extension</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
              AudioWorklet & Page Interceptor
            </h3>
            <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-300 mb-6 sm:mb-8">
              <li className="flex items-start gap-2.5 sm:gap-3">
                <ArrowRight className="w-4 h-4 text-accent shrink-0 mt-0.5 sm:mt-1" />
                <span><strong>Injected Mic Interceptor:</strong> Patches <code className="bg-white/10 px-1.5 py-0.5 rounded text-accent font-mono text-[11px] sm:text-xs">getUserMedia</code> in main page context.</span>
              </li>
              <li className="flex items-start gap-2.5 sm:gap-3">
                <ArrowRight className="w-4 h-4 text-accent shrink-0 mt-0.5 sm:mt-1" />
                <span><strong>AudioWorklet Thread:</strong> Performs real-time frame filtering & cosine similarity matching against enrolled 192D embedding.</span>
              </li>
              <li className="flex items-start gap-2.5 sm:gap-3">
                <ArrowRight className="w-4 h-4 text-accent shrink-0 mt-0.5 sm:mt-1" />
                <span><strong>Encrypted Storage:</strong> Encrypts meeting transcripts with AES-GCM prior to storage in IndexedDB.</span>
              </li>
            </ul>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-black/50 border border-white/10 text-[10px] sm:text-[11px] font-mono text-gray-400 break-all sm:break-normal">
            Path: hearly-extension/src/extension/injected-mic.ts
          </div>
        </div>

        {/* Server & ML Engine Box */}
        <div className="p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl glass-panel border border-purpleAccent/30 flex flex-col justify-between bg-purpleAccent/[0.02]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-purpleAccent/20">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-purpleAccent flex items-center gap-2">
                <Server className="w-3.5 h-3.5 shrink-0" />
                ML & ASR Server (FastAPI :8000)
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400 font-mono bg-white/5 px-2.5 py-1 rounded-md">hearly-model</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
              PyTorch & Microsoft VibeVoice ASR
            </h3>
            <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-300 mb-6 sm:mb-8">
              <li className="flex items-start gap-2.5 sm:gap-3">
                <ArrowRight className="w-4 h-4 text-purpleAccent shrink-0 mt-0.5 sm:mt-1" />
                <span><strong>Microsoft VibeVoice:</strong> Primary ASR pipeline loaded via HuggingFace (<code className="bg-white/10 px-1.5 py-0.5 rounded text-purpleAccent font-mono text-[11px] sm:text-xs">microsoft/VibeVoice-ASR-HF</code>).</span>
              </li>
              <li className="flex items-start gap-2.5 sm:gap-3">
                <ArrowRight className="w-4 h-4 text-purpleAccent shrink-0 mt-0.5 sm:mt-1" />
                <span><strong>PyTorch Training Suite:</strong> Custom <code className="text-white font-mono text-[11px] sm:text-xs">SpeakerEncoder</code> with dilated 1D conv blocks & SiLU activations.</span>
              </li>
              <li className="flex items-start gap-2.5 sm:gap-3">
                <ArrowRight className="w-4 h-4 text-purpleAccent shrink-0 mt-0.5 sm:mt-1" />
                <span><strong>ONNX Exporter:</strong> Converts PyTorch weights into ONNX Opset 18 models for browser execution.</span>
              </li>
            </ul>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-black/50 border border-white/10 text-[10px] sm:text-[11px] font-mono text-gray-400 break-all sm:break-normal">
            Path: hearly-model/src/hearly_model/app.py
          </div>
        </div>
      </div>
    </section>
  );
};

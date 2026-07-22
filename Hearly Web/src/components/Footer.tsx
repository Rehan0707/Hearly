import React from 'react';
import { Mic, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/5 py-12 px-6 bg-black/40 text-xs text-gray-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-accent" />
          <span className="font-bold text-white text-sm">Hearly AI</span>
          <span>— Real-time Voice Isolation & Transcription</span>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <a href="#demo" className="hover:text-white transition-colors">Demo</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#install" className="hover:text-white transition-colors">Download</a>
        </div>

        <div className="flex items-center gap-1 text-gray-500">
          <span>Built with</span>
          <Heart className="w-3 h-3 text-red-500 fill-red-500" />
          <span>using React + PyTorch + VibeVoice</span>
        </div>
      </div>
    </footer>
  );
};

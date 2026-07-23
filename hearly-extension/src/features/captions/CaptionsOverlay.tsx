import React, { useState } from 'react';
import { SupportedLanguage } from '@/services/translationService';

export interface CaptionEntry {
  id: string;
  speaker: string;
  text: string;
  translatedText?: string;
  isEnrolledUser: boolean;
  color?: string;
}

interface CaptionsOverlayProps {
  captions: CaptionEntry[];
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export const CaptionsOverlay: React.FC<CaptionsOverlayProps> = ({
  captions,
  onLanguageChange,
}) => {
  const [fontSize, setFontSize] = useState<number>(14);
  const [bgOpacity, setBgOpacity] = useState<number>(0.85);
  const [targetLang, setTargetLang] = useState<SupportedLanguage>('en');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const handleLangSelect = (lang: SupportedLanguage) => {
    setTargetLang(lang);
    if (onLanguageChange) onLanguageChange(lang);
  };

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] max-w-2xl w-[90vw] transition-all duration-300 pointer-events-auto"
      style={{
        backgroundColor: `rgba(15, 23, 42, ${bgOpacity})`,
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="border border-slate-700/60 rounded-2xl p-4 shadow-2xl text-white">
        {/* Controls Bar */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">Hearly Live Captions</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Opacity Control */}
            <button
              onClick={() => setBgOpacity((o) => (o >= 0.95 ? 0.5 : o + 0.15))}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 bg-slate-800 rounded"
              title="Toggle background opacity"
            >
              {(bgOpacity * 100).toFixed(0)}%
            </button>

            {/* Font Size Selector */}
            <div className="flex items-center space-x-1">
              <span>Text:</span>
              <button
                onClick={() => setFontSize((s) => Math.max(11, s - 1))}
                className="px-1.5 py-0.5 bg-slate-800 rounded hover:text-white"
              >
                -
              </button>
              <span className="text-white text-xs">{fontSize}px</span>
              <button
                onClick={() => setFontSize((s) => Math.min(22, s + 1))}
                className="px-1.5 py-0.5 bg-slate-800 rounded hover:text-white"
              >
                +
              </button>
            </div>

            {/* Language Selector */}
            <select
              value={targetLang}
              onChange={(e) => handleLangSelect(e.target.value as SupportedLanguage)}
              className="bg-slate-800 text-white rounded px-2 py-0.5 text-xs border border-slate-700 focus:outline-none"
            >
              <option value="en">English (EN)</option>
              <option value="hi">Hindi (HI)</option>
              <option value="mr">Marathi (MR)</option>
              <option value="es">Spanish (ES)</option>
              <option value="fr">French (FR)</option>
              <option value="de">German (DE)</option>
              <option value="ja">Japanese (JA)</option>
            </select>

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5 bg-slate-800 rounded"
            >
              {isMinimized ? 'Expand' : 'Minimize'}
            </button>
          </div>
        </div>

        {/* Captions Content */}
        {!isMinimized && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {captions.length === 0 ? (
              <p className="text-slate-500 italic text-xs text-center py-2">
                Listening for speaker voices...
              </p>
            ) : (
              captions.slice(-4).map((c) => (
                <div key={c.id} className="leading-snug transition-all" style={{ fontSize: `${fontSize}px` }}>
                  <span
                    className="font-bold mr-2 rounded px-1.5 py-0.5 text-[11px]"
                    style={{
                      backgroundColor: c.color || (c.isEnrolledUser ? '#6366F1' : '#3B82F6'),
                      color: '#FFFFFF',
                    }}
                  >
                    {c.speaker}
                  </span>
                  <span className="text-slate-100">{c.translatedText || c.text}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import { useState } from 'react';

export interface ApiKeyCardProps {
  groqApiKey?: string;
  onSaveKey: (key: string) => void;
}

export function ApiKeyCard({ groqApiKey = '', onSaveKey }: ApiKeyCardProps) {
  const [key, setKey] = useState(groqApiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSaveKey(key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section aria-labelledby="api-key-title">
      <p
        id="api-key-title"
        className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-hearly-secondary"
      >
        API Key Integration
      </p>
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] transition-[background-color,border-color] duration-300 ease-out hover:border-white/[0.11] hover:bg-white/[0.04]">
        <div className="mb-3">
          <p className="text-[13px] font-semibold leading-snug tracking-[-0.02em] text-white">
            Groq API Key (Free Whisper STT)
          </p>
          <p className="mt-1 text-[11px] leading-snug tracking-[-0.01em] text-hearly-tertiary">
            Used for instant background speech transcription subtitles on screen.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="gsk_..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-[12px] font-mono text-white placeholder-hearly-tertiary focus:border-hearly-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-hearly-accent px-3.5 py-1.5 text-[11px] font-bold text-black transition-transform active:scale-95"
          >
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>
    </section>
  );
}

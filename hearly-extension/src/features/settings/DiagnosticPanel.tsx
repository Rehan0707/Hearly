export interface DiagnosticPanelProps {
  similarity: number;
  matched: boolean;
  isSpeech: boolean;
  vadConfidence: number;
  gain: number;
}

export function DiagnosticPanel({
  similarity,
  matched,
  isSpeech,
  vadConfidence,
  gain,
}: DiagnosticPanelProps) {
  const similarityPct = Math.min(100, Math.max(0, Math.round(similarity * 100)));
  const vadConfidencePct = Math.min(100, Math.max(0, Math.round(vadConfidence * 100)));

  return (
    <section aria-labelledby="diagnostics-title">
      <p
        id="diagnostics-title"
        className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-hearly-secondary"
      >
        Real-Time Diagnostics
      </p>
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] transition-[background-color,border-color] duration-300 ease-out hover:border-white/[0.11] hover:bg-white/[0.04] space-y-4">
        
        {/* Similarity Score */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[12px] font-medium text-hearly-tertiary">Voice Similarity</span>
            <span className={`text-[12px] font-bold font-mono ${matched ? 'text-hearly-accent' : 'text-hearly-secondary'}`}>
              {similarity.toFixed(2)} ({matched ? 'MATCH' : 'BLOCKED'})
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                matched ? 'bg-hearly-accent shadow-[0_0_8px_rgba(181,240,61,0.5)]' : 'bg-white/30'
              }`}
              style={{ width: `${similarityPct}%` }}
            />
          </div>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          {/* VAD Status */}
          <div className="rounded-lg border border-white/[0.04] bg-black/15 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-hearly-tertiary">Voice Activity</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isSpeech ? 'bg-hearly-accent animate-pulse' : 'bg-white/20'}`} />
              <span className="text-[12px] font-bold text-white">
                {isSpeech ? 'Speech' : 'Silent'}
              </span>
            </div>
            <p className="mt-1 text-[9px] text-hearly-tertiary font-mono">Conf: {vadConfidencePct}%</p>
          </div>

          {/* Attenuation Gain */}
          <div className="rounded-lg border border-white/[0.04] bg-black/15 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-hearly-tertiary">Audio Output</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${gain > 0.5 ? 'bg-hearly-accent' : 'bg-hearly-danger'}`} />
              <span className="text-[12px] font-bold text-white">
                {gain > 0.5 ? 'Full Pass' : 'Ducked (8%)'}
              </span>
            </div>
            <p className="mt-1 text-[9px] text-hearly-tertiary font-mono">Gain: {gain.toFixed(2)}x</p>
          </div>
        </div>

      </div>
    </section>
  );
}

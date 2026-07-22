export interface SensitivityCardProps {
  threshold: number;
  onThresholdChange: (v: number) => void;
}

export function SensitivityCard({
  threshold,
  onThresholdChange,
}: SensitivityCardProps) {
  return (
    <section aria-labelledby="sensitivity-title">
      <p
        id="sensitivity-title"
        className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-hearly-secondary"
      >
        Voice Sensitivity
      </p>
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] transition-[background-color,border-color] duration-300 ease-out hover:border-white/[0.11] hover:bg-white/[0.04]">
        <div className="flex justify-between items-center mb-3">
          <div className="min-w-0 flex-1 pr-4">
            <p className="text-[13px] font-semibold leading-snug tracking-[-0.02em] text-white">
              Filter Threshold
            </p>
            <p className="mt-1 text-[11px] leading-snug tracking-[-0.01em] text-hearly-tertiary">
              Adjust sensitivity: lower values block less (fewer false positives), higher values block more.
            </p>
          </div>
          <span className="text-hearly-accent font-bold text-[14px] shrink-0 font-mono">
            {threshold.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0.40"
          max="0.80"
          step="0.02"
          value={threshold}
          onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-hearly-accent focus:outline-none"
        />
      </div>
    </section>
  );
}

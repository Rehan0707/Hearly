import React, { useEffect, useRef } from 'react';

interface WaveformCanvasProps {
  pcmData?: Float32Array;
  confidenceScore?: number;
  noiseReductionDb?: number;
  width?: number;
  height?: number;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  pcmData,
  confidenceScore = 0.88,
  noiseReductionDb = 14,
  width = 340,
  height = 80,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.6)');
      bgGrad.addColorStop(1, 'rgba(30, 41, 59, 0.8)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw real-time audio waveform bars
      const numBars = 40;
      const barWidth = width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        const val = pcmData ? Math.abs(pcmData[i * 4] || 0) : Math.sin((Date.now() / 200) + i * 0.3) * 0.4 + 0.5;
        const barHeight = Math.max(4, val * (height * 0.7));

        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        const barGrad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        barGrad.addColorStop(0, '#818CF8'); // Indigo
        barGrad.addColorStop(1, '#6366F1');

        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [pcmData, width, height]);

  return (
    <div className="flex flex-col space-y-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium text-slate-300">Live Audio Waveform</span>
        <div className="flex items-center space-x-3">
          <span className="text-emerald-400 font-mono text-[11px]">
            Confidence: {(confidenceScore * 100).toFixed(0)}%
          </span>
          <span className="text-indigo-400 font-mono text-[11px]">
            Noise: -{noiseReductionDb}dB
          </span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full rounded-lg border border-slate-800/80 shadow-inner"
      />
    </div>
  );
};

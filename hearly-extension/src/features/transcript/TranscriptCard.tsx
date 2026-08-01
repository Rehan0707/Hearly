import { Badge } from '@/ui/shared';
import type { TranscriptEntry } from '@/utils/types';
import { formatTime } from '@/utils/formatters';

export interface TranscriptCardProps {
  entry: TranscriptEntry;
}

export function TranscriptCard({ entry }: TranscriptCardProps) {
  const isYou = entry.speaker === 'you';
  const isBackground = entry.speaker === 'background';
  const tag = isYou ? 'You' : isBackground ? 'Background Voice (Muted)' : 'Others';
  const variant = isYou ? 'accent' : isBackground ? 'danger' : 'muted';
  return (
    <div className="rounded-2xl border border-hearly-border bg-[#181818] p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <Badge variant={variant as any}>{tag}</Badge>
        <span className="text-[11px] text-hearly-tertiary">
          {formatTime(entry.timestamp)}
        </span>
      </div>
      <p className="line-clamp-2 text-[13px] text-[#E0E0E0]">{entry.text}</p>
    </div>
  );
}

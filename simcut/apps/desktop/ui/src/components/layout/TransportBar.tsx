import { Pause, Play, Square } from "lucide-react";
import { formatMs } from "../../lib/api";

interface Props {
  playing: boolean;
  positionMs: number;
  durationMs: number;
  onPlay: () => void;
  onStop: () => void;
  onExport: () => void;
}

export function TransportBar({
  playing,
  positionMs,
  durationMs,
  onPlay,
  onStop,
  onExport,
}: Props) {
  return (
    <footer className="flex h-12 shrink-0 items-center justify-between border-t border-sc-border bg-sc-surface px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={playing ? onStop : onPlay}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-sc-accent text-white hover:bg-sc-accent-dim"
        >
          {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={onStop}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-sc-panel text-sc-muted hover:text-sc-text"
        >
          <Square size={12} />
        </button>
        <span className="ml-2 font-mono text-xs text-sc-muted">
          {formatMs(positionMs)} / {formatMs(durationMs)}
        </span>
      </div>
      <button
        type="button"
        onClick={onExport}
        className="rounded-lg bg-sc-warm px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
      >
        导出渲染
      </button>
    </footer>
  );
}

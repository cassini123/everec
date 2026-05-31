import { Volume2 } from "lucide-react";
import type { TrackInfo } from "../../types";

const trackColors = ["#ff6b2c", "#4da3ff", "#3dd68c", "#a78bfa", "#f472b6"];

interface TrackListProps {
  tracks: TrackInfo[];
  selected: number;
  onSelect: (index: number) => void;
  onVolumeChange: (track: number, volume: number) => void;
}

export function TrackList({
  tracks,
  selected,
  onSelect,
  onVolumeChange,
}: TrackListProps) {
  return (
    <div className="flex w-52 shrink-0 flex-col border-r border-ds-border bg-ds-surface">
      <div className="flex h-8 items-center border-b border-ds-border px-3 text-[10px] font-medium uppercase tracking-widest text-ds-muted">
        Tracks
      </div>
      <div className="flex-1 overflow-auto">
        {tracks.map((track, i) => (
          <button
            key={track.index}
            type="button"
            onClick={() => onSelect(track.index)}
            className={`flex w-full flex-col gap-2 border-b border-ds-border/50 px-3 py-2.5 text-left transition ${
              selected === track.index ? "bg-ds-elevated" : "hover:bg-ds-panel"
            }`}
            style={{
              boxShadow:
                selected === track.index
                  ? `inset 3px 0 0 ${trackColors[i % trackColors.length]}`
                  : undefined,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="truncate text-sm font-medium">{track.name}</span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: trackColors[i % trackColors.length] }}
              />
            </div>
            <div className="truncate text-[11px] capitalize text-ds-muted">
              {track.instrument.replace(/_/g, " ")}
            </div>
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Volume2 className="h-3 w-3 text-ds-muted" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={track.volume}
                onChange={(e) =>
                  onVolumeChange(track.index, Number(e.target.value))
                }
                className="flex-1"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

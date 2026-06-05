import { BEAT_WIDTH } from "./PianoRoll";
import { noteName } from "../../lib/api";
import type { NoteClip, TrackInfo } from "../../types";

const TRACK_COLORS = ["#ff6b2c", "#4da3ff", "#3dd68c", "#a78bfa", "#f472b6"];
const LANE_HEIGHT = 28;

interface MasterOverviewProps {
  tracks: TrackInfo[];
  clips: NoteClip[];
  beats: number;
  position: number;
  playing: boolean;
  selectedTrack: number;
  onSelectTrack: (index: number) => void;
  onPositionChange?: (beat: number) => void;
}

export function MasterOverview({
  tracks,
  clips,
  beats,
  position,
  playing,
  selectedTrack,
  onSelectTrack,
  onPositionChange,
}: MasterOverviewProps) {
  const width = beats * BEAT_WIDTH;

  return (
    <div className="shrink-0 border-b border-ds-border bg-ds-panel">
      <div className="flex h-7 items-center border-b border-ds-border/60 px-3">
        <span className="text-[10px] font-medium uppercase tracking-widest text-ds-muted">
          总览 · All Tracks
        </span>
        <span className="ml-auto text-[10px] text-ds-muted">
          {tracks.length} 轨 · {clips.length} 音符
        </span>
      </div>

      <div className="flex max-h-40 overflow-auto">
        <div className="w-52 shrink-0 border-r border-ds-border bg-ds-surface">
          {tracks.map((track, i) => (
            <button
              key={track.index}
              type="button"
              onClick={() => onSelectTrack(track.index)}
              className={`flex h-7 w-full items-center gap-2 border-b border-ds-border/40 px-3 text-left text-[11px] ${
                selectedTrack === track.index
                  ? "bg-ds-elevated text-ds-text"
                  : "text-ds-muted hover:bg-ds-panel hover:text-ds-text"
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: TRACK_COLORS[i % TRACK_COLORS.length] }}
              />
              <span className="truncate">{track.name}</span>
              <span className="ml-auto truncate text-[9px] opacity-60">
                {track.instrument.replace(/_/g, " ")}
              </span>
            </button>
          ))}
        </div>

        <div
          className="relative min-w-0 flex-1 overflow-x-auto"
          onClick={(e) => {
            if (!onPositionChange) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
            onPositionChange(Math.floor(x / BEAT_WIDTH));
          }}
        >
          <div className="relative" style={{ width, height: tracks.length * LANE_HEIGHT }}>
            {tracks.map((track, i) => (
              <div
                key={track.index}
                className="absolute left-0 right-0 border-b border-ds-border/30"
                style={{
                  top: i * LANE_HEIGHT,
                  height: LANE_HEIGHT,
                  width,
                }}
              >
                {Array.from({ length: beats }).map((_, beat) => (
                  <div
                    key={beat}
                    className="absolute top-0 h-full border-r border-ds-border/10"
                    style={{ left: beat * BEAT_WIDTH, width: BEAT_WIDTH }}
                  />
                ))}
                {clips
                  .filter((c) => c.track === track.index)
                  .map((clip) => (
                    <div
                      key={clip.id}
                      className="absolute top-1 flex h-[calc(100%-8px)] items-center overflow-hidden rounded px-1 text-[9px] font-medium text-white/90"
                      style={{
                        left: clip.startBeat * BEAT_WIDTH + 1,
                        width: clip.durationBeats * BEAT_WIDTH - 2,
                        background: TRACK_COLORS[i % TRACK_COLORS.length],
                      }}
                      title={noteName(clip.note)}
                    >
                      <span className="truncate">{noteName(clip.note)}</span>
                    </div>
                  ))}
              </div>
            ))}
            <div
              className="pointer-events-none absolute top-0 z-10 h-full w-px bg-ds-accent shadow-[0_0_6px_var(--color-ds-accent)]"
              style={{ left: position * BEAT_WIDTH + BEAT_WIDTH / 2 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

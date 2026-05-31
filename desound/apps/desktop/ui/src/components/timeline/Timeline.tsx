import { useMemo } from "react";
import type { LoudnessSettings, TimelineClip, TrackInfo } from "../../types";

const TRACK_COLORS = ["#ff6b2c", "#4da3ff", "#3dd68c", "#a78bfa", "#f472b6"];
const PX_PER_SEC = 80;

interface TimelineProps {
  tracks: TrackInfo[];
  clips: TimelineClip[];
  bpm: number;
  positionSec: number;
  totalSec: number;
  playing: boolean;
  loudness: LoudnessSettings[];
  selectedTrack: number;
  onSelectTrack: (index: number) => void;
  onLoudnessChange: (trackIndex: number, patch: Partial<LoudnessSettings>) => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const f = Math.floor((sec % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${f}`;
}

export function Timeline({
  tracks,
  clips,
  bpm,
  positionSec,
  totalSec,
  playing,
  loudness,
  selectedTrack,
  onSelectTrack,
  onLoudnessChange,
}: TimelineProps) {
  const width = totalSec * PX_PER_SEC;
  const markers = useMemo(() => {
    const list: { sec: number; label: string; major: boolean }[] = [];
    for (let s = 0; s <= totalSec; s += 0.5) {
      const major = s % 1 === 0;
      list.push({ sec: s, label: major ? formatTime(s) : "", major });
    }
    return list;
  }, [totalSec]);

  const loudnessFor = (idx: number): LoudnessSettings =>
    loudness.find((l) => l.trackIndex === idx) ?? {
      trackIndex: idx,
      gainDb: 0,
      targetLufs: -14,
      peakDb: -3,
    };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-7 shrink-0 border-b border-ds-border bg-ds-panel">
        <div className="w-44 shrink-0 border-r border-ds-border px-2 text-[10px] leading-7 text-ds-muted">
          时间轴
        </div>
        <div className="relative flex-1 overflow-hidden">
          {markers.map(({ sec, label, major }) => (
            <div
              key={sec}
              className="absolute top-0 h-full border-l border-ds-border/40"
              style={{ left: sec * PX_PER_SEC }}
            >
              {major && (
                <span className="ml-1 text-[9px] text-ds-muted">{label}</span>
              )}
            </div>
          ))}
          {playing && (
            <div
              className="absolute top-0 z-20 h-full w-px bg-ds-accent shadow-[0_0_6px_var(--color-ds-accent)]"
              style={{ left: positionSec * PX_PER_SEC }}
            />
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-auto">
        <div className="w-44 shrink-0 border-r border-ds-border bg-ds-surface">
          {tracks.map((track, i) => (
            <div key={track.index}>
              <button
                type="button"
                onClick={() => onSelectTrack(track.index)}
                className={`flex h-14 w-full flex-col justify-center border-b border-ds-border/50 px-3 text-left ${
                  selectedTrack === track.index ? "bg-ds-elevated" : "hover:bg-ds-panel"
                }`}
                style={{
                  boxShadow:
                    selectedTrack === track.index
                      ? `inset 3px 0 0 ${TRACK_COLORS[i % TRACK_COLORS.length]}`
                      : undefined,
                }}
              >
                <span className="truncate text-sm font-medium">{track.name}</span>
                <span className="truncate text-[10px] text-ds-muted">
                  {track.instrument.replace(/_/g, " ")}
                </span>
              </button>
              <div className="flex h-10 flex-col justify-center border-b border-ds-border/50 bg-ds-track/50 px-3">
                <span className="text-[9px] uppercase tracking-wider text-ds-muted">
                  响度
                </span>
                <span className="font-mono text-[10px] text-ds-accent">
                  {loudnessFor(track.index).targetLufs} LUFS
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="grid-bg relative" style={{ width, minHeight: "100%" }}>
            {tracks.map((track, i) => (
              <div key={track.index}>
                <div
                  className="relative h-14 border-b border-ds-border/50"
                  style={{ width }}
                >
                  {clips
                    .filter((c) => c.trackId === track.index)
                    .map((clip) => (
                      <div
                        key={clip.id}
                        className="absolute top-2 flex h-10 items-center overflow-hidden rounded px-2 text-[11px] font-medium text-white/90"
                        style={{
                          left: clip.startSec * PX_PER_SEC,
                          width: clip.durationSec * PX_PER_SEC - 2,
                          background: clip.color || TRACK_COLORS[i % TRACK_COLORS.length],
                        }}
                        title={clip.name}
                      >
                        <span className="truncate">{clip.name}</span>
                      </div>
                    ))}
                </div>
                <div
                  className="flex h-10 items-center gap-3 border-b border-ds-border/50 bg-ds-track/30 px-3"
                  style={{ width }}
                >
                  <label className="flex items-center gap-1.5 text-[10px] text-ds-muted">
                    Gain
                    <input
                      type="range"
                      min={-24}
                      max={12}
                      step={0.5}
                      value={loudnessFor(track.index).gainDb}
                      onChange={(e) =>
                        onLoudnessChange(track.index, {
                          gainDb: Number(e.target.value),
                        })
                      }
                      className="w-20"
                    />
                    <span className="w-10 font-mono text-ds-text">
                      {loudnessFor(track.index).gainDb.toFixed(1)} dB
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[10px] text-ds-muted">
                    LUFS
                    <input
                      type="range"
                      min={-24}
                      max={-6}
                      step={0.5}
                      value={loudnessFor(track.index).targetLufs}
                      onChange={(e) =>
                        onLoudnessChange(track.index, {
                          targetLufs: Number(e.target.value),
                        })
                      }
                      className="w-20"
                    />
                    <span className="w-10 font-mono text-ds-green">
                      {loudnessFor(track.index).targetLufs.toFixed(1)}
                    </span>
                  </label>
                  <div className="ml-auto flex h-3 w-24 overflow-hidden rounded bg-ds-bg">
                    <div
                      className="h-full bg-ds-accent transition-all"
                      style={{
                        width: `${Math.min(100, ((loudnessFor(track.index).peakDb + 24) / 24) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {playing && (
              <div
                className="pointer-events-none absolute top-0 z-10 h-full w-px bg-ds-accent/80"
                style={{ left: positionSec * PX_PER_SEC }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex h-6 shrink-0 items-center border-t border-ds-border bg-ds-panel px-3 text-[10px] text-ds-muted">
        <span>{bpm} BPM</span>
        <span className="mx-2">·</span>
        <span>{formatTime(positionSec)} / {formatTime(totalSec)}</span>
        <span className="mx-2">·</span>
        <span>{tracks.length} 轨 · 流媒体参考 -14 LUFS</span>
      </div>
    </div>
  );
}

export { TRACK_COLORS, PX_PER_SEC };

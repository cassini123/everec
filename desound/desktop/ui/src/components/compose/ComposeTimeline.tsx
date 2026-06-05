import { useCallback, useEffect, useRef, useState } from "react";
import { BEAT_WIDTH } from "./PianoRoll";
import { beatToSec } from "../../lib/api";

interface ComposeTimelineProps {
  beats: number;
  bpm: number;
  position: number;
  playing: boolean;
  onPositionChange: (beat: number) => void;
}

function formatBeatTime(beat: number, bpm: number): string {
  const sec = beatToSec(beat, bpm);
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 100);
  return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

export function ComposeTimeline({
  beats,
  bpm,
  position,
  playing,
  onPositionChange,
}: ComposeTimelineProps) {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const beatFromClientX = useCallback(
    (clientX: number) => {
      const el = rulerRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left + el.scrollLeft;
      return Math.max(0, Math.min(beats - 1, Math.floor(x / BEAT_WIDTH)));
    },
    [beats],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(true);
    onPositionChange(beatFromClientX(e.clientX));
  };

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => {
      onPositionChange(beatFromClientX(e.clientX));
    };
    const onUp = () => setDragging(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, beatFromClientX, onPositionChange]);

  const width = beats * BEAT_WIDTH;
  const playheadLeft = position * BEAT_WIDTH + BEAT_WIDTH / 2;

  return (
    <div className="shrink-0 border-b border-ds-border bg-ds-surface">
      <div className="flex h-6 items-center border-b border-ds-border/60 px-3">
        <span className="text-[10px] font-medium uppercase tracking-widest text-ds-muted">
          时间轴
        </span>
        <span className="ml-3 font-mono text-[10px] text-ds-accent">
          {formatBeatTime(position, bpm)}
        </span>
        <span className="ml-2 text-[10px] text-ds-muted">
          · 拍 {position + 1}/{beats}
          {playing ? " · 播放中" : dragging ? " · 拖动定位" : " · 点击或拖动光标"}
        </span>
      </div>

      <div ref={rulerRef} className="relative h-8 overflow-x-auto cursor-crosshair">
        <div className="relative h-full" style={{ width, minWidth: "100%" }}>
          {Array.from({ length: beats }).map((_, beat) => (
            <button
              key={beat}
              type="button"
              className={`absolute top-0 flex h-full flex-col items-start border-r px-1 text-left transition hover:bg-ds-accent/10 ${
                beat % 4 === 0 ? "border-ds-border/60" : "border-ds-border/20"
              }`}
              style={{ left: beat * BEAT_WIDTH, width: BEAT_WIDTH }}
              onPointerDown={(e) => {
                e.stopPropagation();
                handlePointerDown(e);
              }}
            >
              {beat % 4 === 0 && (
                <span className="text-[9px] font-mono text-ds-muted">
                  {Math.floor(beat / 4) + 1}
                </span>
              )}
              <span className="text-[8px] text-ds-muted/60">{beat + 1}</span>
            </button>
          ))}

          <div
            className="absolute top-0 z-30 flex h-full flex-col items-center"
            style={{ left: playheadLeft, transform: "translateX(-50%)" }}
            onPointerDown={handlePointerDown}
          >
            <div
              className={`h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent ${
                playing || dragging ? "border-t-ds-accent" : "border-t-ds-accent/80"
              }`}
            />
            <div
              className={`w-0.5 flex-1 shadow-[0_0_8px_var(--color-ds-accent)] ${
                playing || dragging ? "bg-ds-accent" : "bg-ds-accent/70"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

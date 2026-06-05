import { formatTimecode, rulerTicks } from "../../lib/timecode";

interface Props {
  durationMs: number;
  positionMs: number;
  fps?: number;
  onSeek: (ms: number) => void;
}

export function TimecodeRuler({ durationMs, positionMs, fps = 30, onSeek }: Props) {
  const duration = Math.max(durationMs, 10000);
  const ticks = rulerTicks(duration, fps);
  const playheadPct = (positionMs / duration) * 100;

  return (
    <div className="relative mb-2 border-b border-sc-border pb-1">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="font-mono text-[10px] text-sc-warm">
          {formatTimecode(positionMs, fps)}
        </span>
        <span className="font-mono text-[10px] text-sc-muted">
          {formatTimecode(duration, fps)}
        </span>
      </div>
      <div
        className="relative h-6 cursor-pointer rounded bg-sc-panel/40"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          onSeek(Math.round(ratio * duration));
        }}
      >
        {ticks.map((tick) => {
          const left = (tick.ms / duration) * 100;
          return (
            <div
              key={tick.ms}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: `${left}%`, transform: "translateX(-50%)" }}
            >
              <span
                className={`mb-0.5 font-mono text-[8px] ${tick.major ? "text-sc-muted" : "text-sc-muted/50"}`}
              >
                {tick.major ? formatTimecode(tick.ms, fps) : ""}
              </span>
              <div
                className={`w-px ${tick.major ? "h-3 bg-sc-muted" : "h-1.5 bg-sc-border"}`}
              />
            </div>
          );
        })}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-sc-warm"
          style={{ left: `${playheadPct}%` }}
        />
      </div>
    </div>
  );
}

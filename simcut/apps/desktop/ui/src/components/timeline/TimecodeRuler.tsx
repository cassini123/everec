import { formatTimecode, rulerTicks } from "../../lib/timecode";
import { pxFromMs, timelineWidthPx } from "../../lib/timelineLayout";

interface Props {
  durationMs: number;
  positionMs: number;
  fps?: number;
  widthPx: number;
  onSeek: (ms: number) => void;
}

export function TimecodeRuler({
  durationMs,
  positionMs,
  fps = 30,
  widthPx,
  onSeek,
}: Props) {
  const duration = Math.max(durationMs, 10000);
  const ticks = rulerTicks(duration, fps);
  const playheadPx = pxFromMs(positionMs);

  return (
    <div className="relative mb-2 border-b border-sc-border pb-1" style={{ width: widthPx }}>
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
        style={{ width: timelineWidthPx(durationMs) }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          onSeek(Math.round((x / timelineWidthPx(durationMs)) * duration));
        }}
      >
        {ticks.map((tick) => {
          const left = pxFromMs(tick.ms);
          return (
            <div
              key={tick.ms}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left, transform: "translateX(-50%)" }}
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
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-sc-warm"
          style={{ left: playheadPx }}
        />
      </div>
    </div>
  );
}

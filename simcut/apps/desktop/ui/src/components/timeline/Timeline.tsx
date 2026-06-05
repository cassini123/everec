import type { Project } from "../../types";
import { formatMs } from "../../lib/api";

interface Props {
  project: Project;
  positionMs: number;
}

export function Timeline({ project, positionMs }: Props) {
  const duration = Math.max(project.durationMs, 10000);
  const playheadPct = (positionMs / duration) * 100;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-sc-track">
      <div className="grid-bg relative min-h-0 flex-1 overflow-auto p-3">
        {project.tracks.map((track) => (
          <div key={track.index} className="mb-2">
            <div className="mb-1 flex items-center gap-2 text-[10px] text-sc-muted">
              <span className="w-14 truncate">{track.name}</span>
              <span className="rounded bg-sc-panel px-1.5 py-0.5 uppercase">
                {track.kind}
              </span>
            </div>
            <div className="relative h-10 rounded-md border border-sc-border bg-sc-panel/50">
              {track.clips.map((clip) => {
                const left = (clip.startMs / duration) * 100;
                const width = (clip.durationMs / duration) * 100;
                return (
                  <div
                    key={clip.id}
                    className="timeline-clip absolute top-1 bottom-1 rounded px-2 text-[10px] leading-8 text-white/90"
                    style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                  >
                    {formatMs(clip.startMs)}
                  </div>
                );
              })}
              {track.clips.length === 0 && (
                <div className="flex h-full items-center justify-center text-[10px] text-sc-muted">
                  拖入素材或应用特效
                </div>
              )}
            </div>
          </div>
        ))}

        <div
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-sc-warm"
          style={{ left: `calc(${playheadPct}% + 12px)` }}
        />
      </div>
    </div>
  );
}

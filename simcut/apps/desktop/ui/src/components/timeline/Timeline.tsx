import { useCallback, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { formatMs } from "../../lib/api";
import { findMedia, snapMs } from "../../lib/timelineEdit";
import type { Clip, Project } from "../../types";

interface Props {
  project: Project;
  positionMs: number;
  selectedClipId: string | null;
  onSelectClip: (id: string | null) => void;
  onSeek: (ms: number) => void;
  onUpdateClip: (clipId: string, patch: Partial<Clip>) => void;
  onDropMedia: (mediaId: string, trackIndex: number, startMs: number) => void;
  onRemoveClip: (clipId: string) => void;
}

type DragMode = "move" | "resize";

export function Timeline({
  project,
  positionMs,
  selectedClipId,
  onSelectClip,
  onSeek,
  onUpdateClip,
  onDropMedia,
  onRemoveClip,
}: Props) {
  const duration = Math.max(project.durationMs, 10000);
  const trackRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const dragRef = useRef<{
    clipId: string;
    mode: DragMode;
    startX: number;
    origStart: number;
    origDuration: number;
    trackWidth: number;
  } | null>(null);
  const [dragOverTrack, setDragOverTrack] = useState<number | null>(null);

  const msFromX = useCallback(
    (trackEl: HTMLDivElement, clientX: number) => {
      const rect = trackEl.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return snapMs(ratio * duration);
    },
    [duration],
  );

  const handlePointerDown = (
    e: React.PointerEvent,
    clip: Clip,
    mode: DragMode,
    trackEl: HTMLDivElement,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onSelectClip(clip.id);
    dragRef.current = {
      clipId: clip.id,
      mode,
      startX: e.clientX,
      origStart: clip.startMs,
      origDuration: clip.durationMs,
      trackWidth: trackEl.getBoundingClientRect().width,
    };
  };

  const handlePointerMove = (e: React.PointerEvent, _trackEl: HTMLDivElement) => {
    const drag = dragRef.current;
    if (!drag) return;
    const deltaPx = e.clientX - drag.startX;
    const deltaMs = (deltaPx / drag.trackWidth) * duration;

    if (drag.mode === "move") {
      onUpdateClip(drag.clipId, {
        startMs: snapMs(Math.max(0, drag.origStart + deltaMs)),
      });
    } else {
      onUpdateClip(drag.clipId, {
        durationMs: snapMs(Math.max(500, drag.origDuration + deltaMs)),
        trimOutMs: snapMs(Math.max(500, drag.origDuration + deltaMs)),
      });
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleTrackClick = (e: React.MouseEvent, trackEl: HTMLDivElement) => {
    if (dragRef.current) return;
    onSeek(msFromX(trackEl, e.clientX));
    onSelectClip(null);
  };

  const handleDragOver = (e: React.DragEvent, trackIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverTrack(trackIndex);
  };

  const handleDrop = (e: React.DragEvent, trackIndex: number, trackEl: HTMLDivElement) => {
    e.preventDefault();
    setDragOverTrack(null);
    const mediaId = e.dataTransfer.getData("simcut/media-id");
    if (!mediaId) return;
    const startMs = msFromX(trackEl, e.clientX);
    onDropMedia(mediaId, trackIndex, startMs);
  };

  const playheadPct = (positionMs / duration) * 100;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-sc-track">
      <div className="relative min-h-0 flex-1 overflow-auto p-3">
        {selectedClipId && (
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRemoveClip(selectedClipId)}
              className="flex items-center gap-1 rounded bg-red-950/40 px-2 py-1 text-[10px] text-red-300 hover:bg-red-950/60"
            >
              <Trash2 size={10} />
              删除片段
            </button>
            <span className="text-[10px] text-sc-muted">拖移片段 · 拖右边缘裁剪</span>
          </div>
        )}

        {project.tracks.map((track) => (
          <div key={track.index} className="mb-2">
            <div className="mb-1 flex items-center gap-2 text-[10px] text-sc-muted">
              <span className="w-14 truncate">{track.name}</span>
              <span className="rounded bg-sc-panel px-1.5 py-0.5 uppercase">{track.kind}</span>
            </div>
            <div
              ref={(el) => {
                if (el) trackRefs.current.set(track.index, el);
              }}
              className={`relative h-12 rounded-md border bg-sc-panel/50 transition-colors ${
                dragOverTrack === track.index
                  ? "border-sc-accent bg-sc-accent/5"
                  : "border-sc-border"
              }`}
              onClick={(e) => {
                const el = trackRefs.current.get(track.index);
                if (el) handleTrackClick(e, el);
              }}
              onDragOver={(e) => handleDragOver(e, track.index)}
              onDragLeave={() => setDragOverTrack(null)}
              onDrop={(e) => {
                const el = trackRefs.current.get(track.index);
                if (el) handleDrop(e, track.index, el);
              }}
              onPointerMove={(e) => {
                const el = trackRefs.current.get(track.index);
                if (el) handlePointerMove(e, el);
              }}
              onPointerUp={handlePointerUp}
            >
              {track.clips.map((clip) => {
                const left = (clip.startMs / duration) * 100;
                const width = (clip.durationMs / duration) * 100;
                const media = findMedia(project, clip.mediaId);
                const selected = clip.id === selectedClipId;
                return (
                  <div
                    key={clip.id}
                    className={`timeline-clip absolute top-1 bottom-1 flex items-center overflow-hidden rounded text-[10px] text-white/90 ${
                      selected ? "ring-2 ring-sc-warm" : ""
                    }`}
                    style={{ left: `${left}%`, width: `${Math.max(width, 3)}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClip(clip.id);
                      onSeek(clip.startMs);
                    }}
                  >
                    <div
                      className="flex h-full flex-1 cursor-grab items-center px-1.5 active:cursor-grabbing"
                      onPointerDown={(e) => {
                        const el = trackRefs.current.get(track.index);
                        if (el) handlePointerDown(e, clip, "move", el);
                      }}
                    >
                      <span className="truncate">
                        {media?.name ?? formatMs(clip.startMs)}
                      </span>
                    </div>
                    <div
                      className="h-full w-2 shrink-0 cursor-ew-resize bg-white/20 hover:bg-white/40"
                      onPointerDown={(e) => {
                        const el = trackRefs.current.get(track.index);
                        if (el) handlePointerDown(e, clip, "resize", el);
                      }}
                    />
                  </div>
                );
              })}
              {track.clips.length === 0 && (
                <div className="pointer-events-none flex h-full items-center justify-center text-[10px] text-sc-muted">
                  拖入素材
                </div>
              )}
            </div>
          </div>
        ))}

        <div
          className="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 bg-sc-warm"
          style={{ left: `calc(${playheadPct}% + 12px)` }}
        />
      </div>
    </div>
  );
}

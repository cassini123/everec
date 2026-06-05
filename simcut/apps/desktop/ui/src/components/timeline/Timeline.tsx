import { useCallback, useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { formatTimecode } from "../../lib/timecode";
import {
  msFromTimelineX,
  pxFromMs,
  timelineExtentMs,
  timelineWidthPx,
} from "../../lib/timelineLayout";
import { findMedia, snapMs } from "../../lib/timelineEdit";
import type { Clip, Project } from "../../types";
import { TimecodeRuler } from "./TimecodeRuler";

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
  const fps = project.fps || 30;
  const extentMs = timelineExtentMs(project.durationMs, positionMs);
  const widthPx = timelineWidthPx(extentMs);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    clipId: string;
    mode: DragMode;
    startX: number;
    origStart: number;
    origDuration: number;
    scrollLeft: number;
  } | null>(null);
  const panRef = useRef<{ startX: number; scrollLeft: number } | null>(null);
  const playheadDragRef = useRef(false);
  const [dragOverTrack, setDragOverTrack] = useState<number | null>(null);

  const msFromClientX = useCallback((clientX: number) => {
    const scroll = scrollRef.current;
    if (!scroll) return 0;
    const rect = scroll.getBoundingClientRect();
    return snapMs(msFromTimelineX(scroll.scrollLeft, clientX, rect.left));
  }, []);

  const scrollPlayheadIntoView = useCallback(() => {
    if (playheadDragRef.current || panRef.current) return;
    const scroll = scrollRef.current;
    if (!scroll) return;
    const playheadPx = pxFromMs(positionMs);
    const viewStart = scroll.scrollLeft;
    const viewEnd = viewStart + scroll.clientWidth;
    const margin = 80;
    if (playheadPx < viewStart + margin) {
      scroll.scrollLeft = Math.max(0, playheadPx - margin);
    } else if (playheadPx > viewEnd - margin) {
      scroll.scrollLeft = playheadPx - scroll.clientWidth + margin;
    }
  }, [positionMs]);

  useEffect(() => {
    scrollPlayheadIntoView();
  }, [positionMs, scrollPlayheadIntoView]);

  const handleWheel = (e: React.WheelEvent) => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta === 0) return;
    e.preventDefault();
    scroll.scrollLeft += delta;
  };

  const startPan = (e: React.PointerEvent) => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    panRef.current = { startX: e.clientX, scrollLeft: scroll.scrollLeft };
  };

  const handlePanMove = (e: React.PointerEvent) => {
    const pan = panRef.current;
    const scroll = scrollRef.current;
    if (!pan || !scroll) return;
    scroll.scrollLeft = pan.scrollLeft - (e.clientX - pan.startX);
  };

  const endPan = () => {
    panRef.current = null;
  };

  const startPlayheadDrag = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    playheadDragRef.current = true;
  };

  const handlePlayheadMove = (e: React.PointerEvent) => {
    if (!playheadDragRef.current) return;
    onSeek(msFromClientX(e.clientX));
  };

  const endPlayheadDrag = () => {
    playheadDragRef.current = false;
  };

  const handlePointerDown = (e: React.PointerEvent, clip: Clip, mode: DragMode) => {
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
      scrollLeft: scrollRef.current?.scrollLeft ?? 0,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const scroll = scrollRef.current;
    const scrollDelta = (scroll?.scrollLeft ?? 0) - drag.scrollLeft;
    const deltaPx = e.clientX - drag.startX + scrollDelta;
    const deltaMs = (deltaPx / timelineWidthPx(extentMs)) * extentMs;

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

  const handleTrackClick = (e: React.MouseEvent) => {
    if (dragRef.current || panRef.current || playheadDragRef.current) return;
    if (e.shiftKey) return;
    onSeek(msFromClientX(e.clientX));
    onSelectClip(null);
  };

  const handleDragOver = (e: React.DragEvent, trackIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverTrack(trackIndex);
  };

  const handleDrop = (e: React.DragEvent, trackIndex: number) => {
    e.preventDefault();
    setDragOverTrack(null);
    const mediaId = e.dataTransfer.getData("simcut/media-id");
    if (!mediaId) return;
    onDropMedia(mediaId, trackIndex, msFromClientX(e.clientX));
  };

  const playheadPx = pxFromMs(positionMs);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-sc-track">
      <div className="flex items-center justify-between px-3 py-1 text-[10px] text-sc-muted">
        <span>拖播放头定位 · Shift+拖动平移工作区 · 触控板左右滑动</span>
      </div>
      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 overflow-x-auto overflow-y-hidden p-3"
        onWheel={handleWheel}
        onPointerDown={(e) => {
          if (e.shiftKey && e.button === 0) startPan(e);
        }}
        onPointerMove={(e) => {
          handlePanMove(e);
          handlePlayheadMove(e);
        }}
        onPointerUp={() => {
          endPan();
          endPlayheadDrag();
        }}
        style={{ cursor: panRef.current ? "grabbing" : undefined }}
      >
        <div className="relative" style={{ width: widthPx, minWidth: "100%" }}>
          <TimecodeRuler
            durationMs={extentMs}
            positionMs={positionMs}
            fps={fps}
            widthPx={widthPx}
            onSeek={onSeek}
          />

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
            </div>
          )}

          {project.tracks.map((track) => (
            <div key={track.index} className="mb-2">
              <div className="mb-1 flex items-center gap-2 text-[10px] text-sc-muted">
                <span className="w-14 truncate">{track.name}</span>
                <span className="rounded bg-sc-panel px-1.5 py-0.5 uppercase">{track.kind}</span>
              </div>
              <div
                className={`relative h-12 rounded-md border bg-sc-panel/50 transition-colors ${
                  dragOverTrack === track.index
                    ? "border-sc-accent bg-sc-accent/5"
                    : "border-sc-border"
                }`}
                style={{ width: widthPx }}
                onClick={handleTrackClick}
                onDragOver={(e) => handleDragOver(e, track.index)}
                onDragLeave={() => setDragOverTrack(null)}
                onDrop={(e) => handleDrop(e, track.index)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {track.clips.map((clip) => {
                  const left = pxFromMs(clip.startMs);
                  const width = pxFromMs(clip.durationMs);
                  const media = findMedia(project, clip.mediaId);
                  const selected = clip.id === selectedClipId;
                  return (
                    <div
                      key={clip.id}
                      className={`timeline-clip absolute top-1 bottom-1 flex items-center overflow-hidden rounded text-[10px] text-white/90 ${
                        selected ? "ring-2 ring-sc-warm" : ""
                      }`}
                      style={{ left, width: Math.max(width, 24) }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClip(clip.id);
                        onSeek(clip.startMs);
                      }}
                    >
                      <div
                        className="flex h-full min-w-0 flex-1 cursor-grab flex-col justify-center px-1.5 active:cursor-grabbing"
                        onPointerDown={(e) => handlePointerDown(e, clip, "move")}
                      >
                        <span className="truncate">{media?.name ?? "片段"}</span>
                        <span className="font-mono text-[8px] opacity-70">
                          {formatTimecode(clip.startMs, fps)}
                        </span>
                      </div>
                      <div
                        className="h-full w-2 shrink-0 cursor-ew-resize bg-white/20 hover:bg-white/40"
                        onPointerDown={(e) => handlePointerDown(e, clip, "resize")}
                      />
                    </div>
                  );
                })}
                {track.clips.length === 0 && (
                  <div className="pointer-events-none flex h-full items-center justify-center text-[10px] text-sc-muted">
                    拖入图片/视频素材
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 可拖动播放头 */}
          <div
            className="absolute top-0 bottom-0 z-20"
            style={{ left: playheadPx, transform: "translateX(-50%)" }}
          >
            <div
              className="flex cursor-ew-resize flex-col items-center"
              onPointerDown={startPlayheadDrag}
              onPointerMove={handlePlayheadMove}
              onPointerUp={endPlayheadDrag}
            >
              <div className="h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-sc-warm" />
              <div className="w-0.5 flex-1 bg-sc-warm shadow-[0_0_6px_rgba(245,158,108,0.6)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

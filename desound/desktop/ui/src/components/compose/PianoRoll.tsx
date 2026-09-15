import { useCallback, useEffect, useRef, useState } from "react";
import { noteName } from "../../lib/api";
import type { NoteClip } from "../../types";

export const ROW_HEIGHT = 20;
export const BEAT_WIDTH = 56;
const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11];

export interface GridPick {
  beat: number;
  note: number;
  clipId?: string;
}

interface PianoRollProps {
  clips: NoteClip[];
  selectedTrack: number;
  beats: number;
  position: number;
  playing: boolean;
  selectedClipId: string | null;
  activeNotes: Set<number>;
  trackColor: string;
  onSelectClip: (id: string | null) => void;
  onAddClip: (note: number, beat: number) => void;
  onUpdateClip: (id: string, patch: Partial<NoteClip>) => void;
  onDeleteClip: (id: string) => void;
  onOpenPicker: (pick: GridPick) => void;
  onPreviewNote: (note: number) => void;
  onPositionChange?: (beat: number) => void;
}

interface DragState {
  clipId: string;
  startX: number;
  startY: number;
  origBeat: number;
  origNote: number;
}

export function PianoRoll({
  clips,
  selectedTrack,
  beats,
  position,
  selectedClipId,
  activeNotes,
  trackColor,
  onSelectClip,
  onAddClip,
  onUpdateClip,
  onDeleteClip,
  onOpenPicker,
  onPreviewNote,
  onPositionChange,
}: PianoRollProps) {
  const startNote = 48;
  const endNote = 84;
  const noteCount = endNote - startNote + 1;
  const gridRef = useRef<HTMLDivElement>(null);
  const clickTimer = useRef<number | undefined>(undefined);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dragPreview, setDragPreview] = useState<{ beat: number; note: number } | null>(
    null,
  );

  const trackClips = clips.filter((c) => c.track === selectedTrack);

  const isBlackKey = (note: number) => !WHITE_KEYS.includes(note % 12);

  const clipAt = useCallback(
    (beat: number, note: number) =>
      trackClips.find(
        (c) =>
          c.note === note &&
          beat >= c.startBeat &&
          beat < c.startBeat + c.durationBeats,
      ),
    [trackClips],
  );

  const posFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const el = gridRef.current;
      if (!el) return { beat: 0, note: startNote };
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left + el.scrollLeft;
      const y = clientY - rect.top + el.scrollTop;
      const beat = Math.max(0, Math.min(beats - 1, Math.floor(x / BEAT_WIDTH)));
      const row = Math.max(0, Math.min(noteCount - 1, Math.floor(y / ROW_HEIGHT)));
      const note = endNote - row;
      return { beat, note };
    },
    [beats, noteCount, endNote, startNote],
  );

  useEffect(() => {
    if (!drag) return;

    const onMove = (e: MouseEvent) => {
      const { beat, note } = posFromEvent(e.clientX, e.clientY);
      setDragPreview({ beat, note });
    };

    const onUp = (e: MouseEvent) => {
      const { beat, note } = posFromEvent(e.clientX, e.clientY);
      if (beat !== drag.origBeat || note !== drag.origNote) {
        onUpdateClip(drag.clipId, { startBeat: beat, note });
      }
      setDrag(null);
      setDragPreview(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, onUpdateClip, posFromEvent]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedClipId &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        onDeleteClip(selectedClipId);
        onSelectClip(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedClipId, onDeleteClip, onSelectClip]);

  const renderClip = (clip: NoteClip, isPreview = false) => {
    const beat = isPreview && dragPreview ? dragPreview.beat : clip.startBeat;
    const note = isPreview && dragPreview ? dragPreview.note : clip.note;
    const row = endNote - note;
    const selected = clip.id === selectedClipId;

    return (
      <div
        key={clip.id + (isPreview ? "-drag" : "")}
        className={`absolute flex cursor-grab items-center overflow-hidden rounded px-1.5 text-[10px] font-medium text-white/95 active:cursor-grabbing ${
          selected ? "ring-2 ring-white/80" : "ring-1 ring-black/20"
        } ${isPreview ? "opacity-70" : ""}`}
        style={{
          top: row * ROW_HEIGHT + 2,
          left: beat * BEAT_WIDTH + 2,
          width: clip.durationBeats * BEAT_WIDTH - 4,
          height: ROW_HEIGHT - 4,
          background: trackColor,
          zIndex: isPreview ? 30 : selected ? 20 : 10,
        }}
        title={`${noteName(note)} · 拍 ${beat + 1}`}
        onMouseDown={(e) => {
          if (isPreview) return;
          e.stopPropagation();
          e.preventDefault();
          onSelectClip(clip.id);
          setDrag({
            clipId: clip.id,
            startX: e.clientX,
            startY: e.clientY,
            origBeat: clip.startBeat,
            origNote: clip.note,
          });
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectClip(clip.id);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onOpenPicker({ beat: clip.startBeat, note: clip.note, clipId: clip.id });
        }}
      >
        <span className="truncate">{noteName(note)}</span>
      </div>
    );
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex h-8 shrink-0 border-b border-ds-border bg-ds-panel">
        <div className="w-14 shrink-0 border-r border-ds-border" />
        <div
          className="relative flex-1 overflow-hidden"
          onClick={(e) => {
            if (!onPositionChange) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            onPositionChange(Math.floor(x / BEAT_WIDTH));
          }}
        >
          {Array.from({ length: beats }).map((_, beat) => (
            <div
              key={beat}
              className="absolute top-0 flex h-full items-center border-r border-ds-border/50 px-1 text-[10px] text-ds-muted"
              style={{ left: beat * BEAT_WIDTH, width: BEAT_WIDTH }}
            >
              {beat + 1}
            </div>
          ))}
          <div
            className="absolute top-0 z-20 h-full w-0.5 bg-ds-accent shadow-[0_0_6px_var(--color-ds-accent)]"
            style={{ left: position * BEAT_WIDTH + BEAT_WIDTH / 2 }}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="w-14 shrink-0 overflow-hidden border-r border-ds-border bg-ds-surface">
          {Array.from({ length: noteCount }).map((_, row) => {
            const note = endNote - row;
            if (isBlackKey(note)) return null;
            return (
              <button
                key={note}
                type="button"
                onClick={() => onPreviewNote(note)}
                className={`flex w-full items-center justify-center text-[9px] font-mono text-gray-600 ${
                  activeNotes.has(note) ? "bg-ds-accent/30" : ""
                }`}
                style={{ height: ROW_HEIGHT }}
              >
                {note % 12 === 0 ? noteName(note) : ""}
              </button>
            );
          })}
        </div>

        <div ref={gridRef} className="relative min-w-0 flex-1 overflow-auto">
          <div
            className="relative grid-bg"
            style={{
              height: noteCount * ROW_HEIGHT,
              width: beats * BEAT_WIDTH,
            }}
          >
            {Array.from({ length: noteCount }).map((_, row) => {
              const note = endNote - row;
              return (
                <div
                  key={note}
                  className={`absolute left-0 border-b ${
                    isBlackKey(note)
                      ? "border-ds-border/20 bg-ds-track/80"
                      : "border-ds-border/30"
                  }`}
                  style={{
                    top: row * ROW_HEIGHT,
                    height: ROW_HEIGHT,
                    width: beats * BEAT_WIDTH,
                  }}
                >
                  {Array.from({ length: beats }).map((_, beat) => (
                    <button
                      key={beat}
                      type="button"
                      className="absolute top-0 h-full border-r border-ds-border/15 hover:bg-ds-accent/8"
                      style={{
                        left: beat * BEAT_WIDTH,
                        width: BEAT_WIDTH,
                      }}
                      onClick={() => {
                        if (clickTimer.current) clearTimeout(clickTimer.current);
                        clickTimer.current = window.setTimeout(() => {
                          const hit = clipAt(beat, note);
                          if (hit) {
                            onSelectClip(hit.id);
                            return;
                          }
                          onSelectClip(null);
                          onAddClip(note, beat);
                        }, 220);
                      }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        if (clickTimer.current) {
                          clearTimeout(clickTimer.current);
                          clickTimer.current = undefined;
                        }
                        const hit = clipAt(beat, note);
                        onOpenPicker({
                          beat,
                          note: hit?.note ?? note,
                          clipId: hit?.id,
                        });
                      }}
                    />
                  ))}
                </div>
              );
            })}

            {trackClips.map((clip) => {
              if (drag?.clipId === clip.id && dragPreview) {
                return renderClip(clip, true);
              }
              return renderClip(clip);
            })}
          </div>
        </div>
      </div>

      <div className="flex h-7 shrink-0 items-center border-t border-ds-border bg-ds-panel px-3 text-[10px] text-ds-muted">
        单击格子添加 · 双击选音调 · Delete 删除 · 拖拽移动
        {selectedClipId && (
          <span className="ml-3 text-ds-accent">
            已选中 {noteName(trackClips.find((c) => c.id === selectedClipId)?.note ?? 0)}
          </span>
        )}
      </div>
    </div>
  );
}

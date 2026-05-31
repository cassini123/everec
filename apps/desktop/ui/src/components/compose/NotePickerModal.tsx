import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { noteName } from "../../lib/api";
import type { InstrumentInfo } from "../../types";
import { InstrumentPicker } from "./InstrumentPicker";

const PREVIEW_NOTES = Array.from({ length: 25 }, (_, i) => 48 + i); // C3..C5

interface NotePickerModalProps {
  open: boolean;
  beat: number;
  initialNote: number;
  instrumentSlug: string;
  instruments: InstrumentInfo[];
  onPreview: (note: number) => void;
  onInstrumentChange: (slug: string) => void;
  onConfirm: (note: number) => void;
  onClose: () => void;
}

export function NotePickerModal({
  open,
  beat,
  initialNote,
  instrumentSlug,
  instruments,
  onPreview,
  onInstrumentChange,
  onConfirm,
  onClose,
}: NotePickerModalProps) {
  const [selectedNote, setSelectedNote] = useState(initialNote);

  useEffect(() => {
    if (open) setSelectedNote(initialNote);
  }, [open, initialNote]);

  if (!open) return null;

  const isBlack = (n: number) => [1, 3, 6, 8, 10].includes(n % 12);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-ds-border bg-ds-elevated shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ds-border px-4 py-3">
          <div>
            <h3 className="font-semibold">选择音调</h3>
            <p className="text-xs text-ds-muted">
              第 {beat + 1} 拍 · 点击琴键预览 · 确认添加
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-ds-muted hover:text-ds-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <label className="mb-2 block text-xs text-ds-muted">乐器</label>
            <InstrumentPicker
              instruments={instruments}
              value={instrumentSlug}
              onChange={onInstrumentChange}
            />
          </div>

          <div className="rounded-lg bg-ds-panel px-4 py-3 text-center">
            <span className="text-2xl font-semibold text-ds-accent">
              {noteName(selectedNote)}
            </span>
            <span className="ml-2 text-sm text-ds-muted">MIDI {selectedNote}</span>
          </div>

          <div className="relative mx-auto h-36 w-full max-w-md">
            {PREVIEW_NOTES.map((note) => {
              const black = isBlack(note);
              const idx = note - 48;
              const left = idx * (100 / PREVIEW_NOTES.length);
              if (black) {
                return (
                  <button
                    key={note}
                    type="button"
                    onClick={() => {
                      setSelectedNote(note);
                      onPreview(note);
                    }}
                    className={`piano-key-black absolute z-10 w-[2.8%] ${
                      selectedNote === note ? "active ring-2 ring-ds-accent" : ""
                    }`}
                    style={{
                      left: `${left + 1.8}%`,
                      height: "60%",
                    }}
                  />
                );
              }
              return (
                <button
                  key={note}
                  type="button"
                  onClick={() => {
                    setSelectedNote(note);
                    onPreview(note);
                  }}
                  className={`piano-key-white absolute bottom-0 border-r border-gray-400 ${
                    selectedNote === note ? "active ring-2 ring-ds-accent ring-inset" : ""
                  }`}
                  style={{
                    left: `${left}%`,
                    width: `${100 / PREVIEW_NOTES.length}%`,
                    height: "100%",
                  }}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap justify-center gap-1">
            {[60, 62, 64, 65, 67, 69, 71, 72].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setSelectedNote(n);
                  onPreview(n);
                }}
                className={`rounded px-2 py-1 font-mono text-xs ${
                  selectedNote === n
                    ? "bg-ds-accent text-white"
                    : "bg-ds-bg text-ds-muted hover:text-ds-text"
                }`}
              >
                {noteName(n)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-ds-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-ds-border px-4 py-2 text-sm text-ds-muted"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedNote)}
            className="rounded bg-ds-accent px-4 py-2 text-sm font-medium text-white hover:bg-ds-accent-dim"
          >
            确认 · {noteName(selectedNote)}
          </button>
        </div>
      </div>
    </div>
  );
}

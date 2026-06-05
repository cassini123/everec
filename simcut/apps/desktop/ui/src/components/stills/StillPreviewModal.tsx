import { X } from "lucide-react";
import { formatMs } from "../../lib/api";
import type { StillFrame } from "../../types";

interface Props {
  still: StillFrame | null;
  onClose: () => void;
}

export function StillPreviewModal({ still, onClose }: Props) {
  if (!still) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      <div
        className="relative max-h-full max-w-4xl overflow-hidden rounded-xl border border-sc-border bg-sc-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          <X size={16} />
        </button>

        {still.thumbnail ? (
          <img
            src={still.thumbnail}
            alt={still.label}
            className="max-h-[70vh] w-full object-contain"
          />
        ) : (
          <div className="flex h-64 w-96 items-center justify-center text-sc-muted">
            无预览图
          </div>
        )}

        <div className="border-t border-sc-border px-4 py-3">
          <div className="text-sm font-medium">{still.label}</div>
          <div className="mt-1 font-mono text-xs text-sc-muted">
            {formatMs(still.timestampMs)}
          </div>
          <div className="mt-2 flex gap-1">
            {still.colorPalette.map((c) => (
              <div
                key={c}
                className="h-4 w-4 rounded-full border border-sc-border"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

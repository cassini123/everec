import { Film, Image, Music } from "lucide-react";
import type { MediaAsset } from "../../types";

interface Props {
  media: MediaAsset[];
  selectedMediaId: string | null;
  onSelect: (id: string) => void;
}

export function MediaBin({ media, selectedMediaId, onSelect }: Props) {
  if (media.length === 0) {
    return (
      <div className="border-t border-sc-border bg-sc-surface px-3 py-2 text-[10px] text-sc-muted">
        素材库为空 — 点击上方「导入素材」
      </div>
    );
  }

  return (
    <div className="border-t border-sc-border bg-sc-surface px-3 py-2">
      <div className="mb-1.5 text-[10px] font-medium text-sc-muted">
        素材库 · 拖到时间轴
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {media.map((m) => {
          const Icon = m.kind === "image" ? Image : m.kind === "audio" ? Music : Film;
          return (
            <button
              key={m.id}
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("simcut/media-id", m.id);
                e.dataTransfer.effectAllowed = "copyMove";
              }}
              onClick={() => onSelect(m.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-[10px] transition-colors ${
                selectedMediaId === m.id
                  ? "border-sc-accent bg-sc-accent/10 text-sc-accent"
                  : "border-sc-border bg-sc-panel text-sc-text hover:border-sc-accent/40"
              }`}
            >
              <Icon size={12} />
              <span className="max-w-[80px] truncate">{m.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

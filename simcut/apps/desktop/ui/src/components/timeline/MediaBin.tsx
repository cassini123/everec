import { useEffect, useState } from "react";
import { Film, Image, Music } from "lucide-react";
import { api } from "../../lib/api";
import { resolvePreviewKind } from "../../lib/fonts";
import type { MediaAsset } from "../../types";

interface Props {
  media: MediaAsset[];
  selectedMediaId: string | null;
  onSelect: (id: string) => void;
}

function MediaThumb({ asset }: { asset: MediaAsset }) {
  const [thumb, setThumb] = useState<string | null>(null);
  const kind = resolvePreviewKind(asset);

  useEffect(() => {
    let cancelled = false;
    api.getMediaUrl(asset).then((url) => {
      if (!cancelled) setThumb(url);
    });
    return () => {
      cancelled = true;
    };
  }, [asset.id, asset.blobId]);

  if (!thumb) {
    return <div className="h-8 w-10 shrink-0 rounded bg-sc-track" />;
  }

  if (kind === "image") {
    return (
      <img src={thumb} alt="" className="h-8 w-10 shrink-0 rounded object-cover" />
    );
  }

  return (
    <div className="flex h-8 w-10 shrink-0 items-center justify-center rounded bg-sc-track">
      <Film size={14} className="text-sc-muted" />
    </div>
  );
}

export function MediaBin({ media, selectedMediaId, onSelect }: Props) {
  if (media.length === 0) {
    return (
      <div className="border-t border-sc-border bg-sc-surface px-3 py-2 text-[10px] text-sc-muted">
        素材库为空 — 支持 JPG/PNG 图片与 MP4/MOV 视频
      </div>
    );
  }

  return (
    <div className="border-t border-sc-border bg-sc-surface px-3 py-2">
      <div className="mb-1.5 text-[10px] font-medium text-sc-muted">
        素材库 · 拖到时间轴（图片默认 5 秒）
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {media.map((m) => {
          const kind = resolvePreviewKind(m);
          const Icon = kind === "image" ? Image : m.kind === "audio" ? Music : Film;
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
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[10px] transition-colors ${
                selectedMediaId === m.id
                  ? "border-sc-accent bg-sc-accent/10 text-sc-accent"
                  : "border-sc-border bg-sc-panel text-sc-text hover:border-sc-accent/40"
              }`}
            >
              <MediaThumb asset={m} />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <Icon size={10} />
                  <span className="max-w-[72px] truncate font-medium">{m.name}</span>
                </div>
                <span className="text-sc-muted">{kind}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

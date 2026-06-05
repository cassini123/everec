import { useEffect, useRef, useState } from "react";
import { Film, Upload } from "lucide-react";
import { Timeline } from "../components/timeline/Timeline";
import { api } from "../lib/api";
import type { Project } from "../types";

interface Props {
  project: Project;
  positionMs: number;
  playing: boolean;
  onProjectUpdate: (project: Project) => void;
  onPositionChange: (ms: number) => void;
}

export function EditView({
  project,
  positionMs,
  playing,
  onProjectUpdate,
  onPositionChange,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<"video" | "image" | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  const primaryMedia = project.media[project.media.length - 1] ?? project.media[0];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!primaryMedia?.blobId) {
        if (urlRef.current) {
          URL.revokeObjectURL(urlRef.current);
          urlRef.current = null;
        }
        setPreviewUrl(null);
        setPreviewKind(null);
        return;
      }

      setLoadError("");
      try {
        const url = await api.getMediaUrl(primaryMedia);
        if (cancelled || !url) {
          if (url) URL.revokeObjectURL(url);
          if (!url) setLoadError("素材未找到，请重新导入");
          return;
        }

        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setPreviewUrl(url);
        setPreviewKind(primaryMedia.kind === "image" ? "image" : "video");
      } catch (err) {
        if (!cancelled) setLoadError(String(err));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [primaryMedia?.blobId, primaryMedia?.id, primaryMedia?.kind]);

  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || previewKind !== "video") return;
    if (playing) {
      video.play().catch(() => setLoadError("播放失败，请检查视频编码格式"));
    } else {
      video.pause();
    }
  }, [playing, previewKind]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || previewKind !== "video" || playing) return;
    if (Math.abs(video.currentTime * 1000 - positionMs) > 200) {
      video.currentTime = positionMs / 1000;
    }
  }, [positionMs, playing, previewKind]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    onPositionChange(Math.round(video.currentTime * 1000));
  };

  const handleImport = async (files: FileList | null) => {
    if (!files?.length) return;
    setImporting(true);
    setMessage("");
    setLoadError("");
    try {
      const { project: updated } = await api.importMediaFile(project, files[0]);
      onProjectUpdate(updated);
      setMessage(`已导入: ${files[0].name}`);
    } catch (err) {
      setLoadError(String(err));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative flex h-64 shrink-0 flex-col border-b border-sc-border bg-black">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs text-sc-muted">
            预览
            {primaryMedia ? ` · ${primaryMedia.name} (${primaryMedia.kind ?? "video"})` : ""}
          </span>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="video/*,image/*,audio/*,.mov,.mp4,.m4v,.mkv,.webm"
              className="hidden"
              onChange={(e) => handleImport(e.target.files)}
            />
            <button
              type="button"
              disabled={importing}
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-sc-accent px-3 py-1.5 text-xs text-white hover:bg-sc-accent-dim disabled:opacity-50"
            >
              <Upload size={12} />
              {importing ? "导入中…" : "导入素材"}
            </button>
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          {previewUrl && previewKind === "video" ? (
            <video
              ref={videoRef}
              key={previewUrl}
              src={previewUrl}
              className="max-h-full max-w-full object-contain"
              playsInline
              muted
              preload="auto"
              onTimeUpdate={handleTimeUpdate}
              onLoadedData={() => setLoadError("")}
              onError={() =>
                setLoadError("视频解码失败。iPhone 拍摄的 HEVC 视频请先转为 H.264 MP4")
              }
              onEnded={() => onPositionChange(0)}
            />
          ) : previewUrl && previewKind === "image" ? (
            <img
              src={previewUrl}
              alt={primaryMedia?.name ?? "素材"}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="text-center text-sc-muted">
              <Film size={40} className="mx-auto opacity-20" />
              <p className="mt-2 text-xs">导入视频或图片开始剪辑（30s – 30min）</p>
            </div>
          )}
        </div>

        {(message || loadError) && (
          <div
            className={`absolute bottom-2 left-1/2 max-w-[90%] -translate-x-1/2 rounded px-3 py-1 text-[10px] ${
              loadError ? "bg-red-950/90 text-red-300" : "bg-sc-panel/90 text-sc-muted"
            }`}
          >
            {loadError || message}
          </div>
        )}
      </div>
      <Timeline project={project} positionMs={positionMs} />
    </div>
  );
}

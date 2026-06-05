import { useCallback, useEffect, useRef, useState } from "react";
import { Film, Upload } from "lucide-react";
import { MediaBin } from "../components/timeline/MediaBin";
import { Timeline } from "../components/timeline/Timeline";
import { api } from "../lib/api";
import { clipAtTime, findMedia } from "../lib/timelineEdit";
import type { Clip, Project } from "../types";

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
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  const activeClip =
    (selectedClipId
      ? project.tracks.flatMap((t) => t.clips).find((c) => c.id === selectedClipId)
      : null) ?? clipAtTime(project, positionMs);

  const previewMedia = selectedMediaId
    ? findMedia(project, selectedMediaId)
    : activeClip
      ? findMedia(project, activeClip.mediaId)
      : project.media[project.media.length - 1];

  const loadPreview = useCallback(async () => {
    if (!previewMedia) {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
      setPreviewUrl(null);
      setPreviewKind(null);
      return;
    }

    const blobId = previewMedia.blobId ?? previewMedia.id;
    setLoadError("");

    try {
      const url = await api.getMediaUrl({ ...previewMedia, blobId });
      if (!url) {
        setLoadError("素材未找到，请重新导入");
        setPreviewUrl(null);
        return;
      }

      if (urlRef.current && urlRef.current !== url) {
        URL.revokeObjectURL(urlRef.current);
      }
      urlRef.current = url;
      setPreviewUrl(url);
      setPreviewKind(previewMedia.kind === "image" ? "image" : "video");
    } catch (err) {
      setLoadError(String(err));
    }
  }, [previewMedia]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

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
      video.play().catch(() => setLoadError("播放失败，请检查视频编码（推荐 H.264 MP4）"));
    } else {
      video.pause();
    }
  }, [playing, previewKind]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || previewKind !== "video" || playing) return;
    const target = activeClip
      ? (activeClip.trimInMs + (positionMs - activeClip.startMs)) / 1000
      : positionMs / 1000;
    if (Number.isFinite(target) && Math.abs(video.currentTime - target) > 0.15) {
      video.currentTime = Math.max(0, target);
    }
  }, [positionMs, playing, previewKind, activeClip]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !activeClip) {
      onPositionChange(Math.round((video?.currentTime ?? 0) * 1000));
      return;
    }
    onPositionChange(
      Math.round(activeClip.startMs + video.currentTime * 1000 - activeClip.trimInMs),
    );
  };

  const handleImport = async (files: FileList | null) => {
    if (!files?.length) return;
    setImporting(true);
    setMessage("");
    setLoadError("");
    try {
      const { project: updated, asset } = await api.importMediaFile(project, files[0]);
      onProjectUpdate(updated);
      setSelectedMediaId(asset.id);
      const clips0 = updated.tracks[0]?.clips ?? [];
      const lastClip = clips0[clips0.length - 1];
      if (lastClip) setSelectedClipId(lastClip.id);
      setMessage(`已导入: ${files[0].name}`);
    } catch (err) {
      setLoadError(String(err));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleUpdateClip = async (clipId: string, patch: Partial<Clip>) => {
    const updated = await api.updateClip(project, clipId, patch);
    onProjectUpdate(updated);
  };

  const handleDropMedia = async (mediaId: string, trackIndex: number, startMs: number) => {
    const updated = await api.addClipToTrack(project, mediaId, trackIndex, startMs);
    onProjectUpdate(updated);
    setSelectedMediaId(mediaId);
  };

  const handleRemoveClip = async (clipId: string) => {
    const updated = await api.removeClip(project, clipId);
    onProjectUpdate(updated);
    setSelectedClipId(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative flex h-56 shrink-0 flex-col border-b border-sc-border bg-black">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs text-sc-muted">
            预览
            {previewMedia
              ? ` · ${previewMedia.name} (${previewMedia.kind ?? "video"})`
              : ""}
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
              src={previewUrl}
              className="max-h-full max-w-full object-contain"
              playsInline
              muted
              preload="auto"
              onTimeUpdate={handleTimeUpdate}
              onCanPlay={() => setLoadError("")}
              onLoadedMetadata={() => {
                const v = videoRef.current;
                if (v && !playing) v.currentTime = positionMs / 1000;
              }}
              onError={() =>
                setLoadError("视频解码失败。请将素材转为 H.264 MP4（ffmpeg -i in.mov -c:v libx264 out.mp4）")
              }
              onEnded={() => onPositionChange(activeClip?.startMs ?? 0)}
            />
          ) : previewUrl && previewKind === "image" ? (
            <img
              src={previewUrl}
              alt={previewMedia?.name ?? "素材"}
              className="max-h-full max-w-full object-contain"
              onError={() => setLoadError("图片加载失败")}
            />
          ) : (
            <div className="text-center text-sc-muted">
              <Film size={40} className="mx-auto opacity-20" />
              <p className="mt-2 text-xs">导入视频或图片，或从素材库拖到时间轴</p>
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

      <MediaBin
        media={project.media}
        selectedMediaId={selectedMediaId}
        onSelect={setSelectedMediaId}
      />

      <Timeline
        project={project}
        positionMs={positionMs}
        selectedClipId={selectedClipId}
        onSelectClip={setSelectedClipId}
        onSeek={onPositionChange}
        onUpdateClip={handleUpdateClip}
        onDropMedia={handleDropMedia}
        onRemoveClip={handleRemoveClip}
      />
    </div>
  );
}

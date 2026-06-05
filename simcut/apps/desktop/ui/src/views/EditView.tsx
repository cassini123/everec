import { useCallback, useEffect, useRef, useState } from "react";
import { Film, Image, Upload, Video } from "lucide-react";
import { MediaBin } from "../components/timeline/MediaBin";
import { Timeline } from "../components/timeline/Timeline";
import { api } from "../lib/api";
import { resolvePreviewKind } from "../lib/fonts";
import { extFromName } from "../lib/mime";
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
      setPreviewUrl(null);
      setPreviewKind(null);
      return;
    }

    const blobId = previewMedia.blobId ?? previewMedia.id;
    const kind = resolvePreviewKind(previewMedia);
    const ext = extFromName(previewMedia.fileName);

    if ((ext === "heic" || ext === "heif") && kind === "image") {
      setLoadError("HEIC 格式浏览器不支持，请先转为 JPG/PNG");
      setPreviewUrl(null);
      setPreviewKind("image");
      return;
    }

    setLoadError("");
    try {
      const url = await api.getMediaUrl({ ...previewMedia, blobId });
      if (!url) {
        setLoadError("素材未找到，请重新导入");
        setPreviewUrl(null);
        return;
      }
      setPreviewUrl(url);
      setPreviewKind(kind);
    } catch (err) {
      setLoadError(String(err));
    }
  }, [previewMedia]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || previewKind !== "video") return;
    if (playing) {
      video.play().catch(() => setLoadError("播放失败，请使用 H.264 MP4"));
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

  const importFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setImporting(true);
    setMessage("");
    setLoadError("");
    let current = project;
    let lastAsset = null;
    try {
      for (let i = 0; i < files.length; i++) {
        const result = await api.importMediaFile(current, files[i]);
        current = result.project;
        lastAsset = result.asset;
      }
      onProjectUpdate(current);
      if (lastAsset) {
        setSelectedMediaId(lastAsset.id);
        const clips0 = current.tracks[0]?.clips ?? [];
        const lastClip = clips0[clips0.length - 1];
        if (lastClip) setSelectedClipId(lastClip.id);
      }
      setMessage(`已导入 ${files.length} 个素材`);
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
              ? ` · ${previewMedia.name} (${resolvePreviewKind(previewMedia)})`
              : ""}
          </span>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="video/*,image/*,.mov,.mp4,.m4v,.mkv,.webm,.jpg,.jpeg,.png,.webp,.gif"
              className="hidden"
              onChange={(e) => importFiles(e.target.files)}
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
              onError={() =>
                setLoadError("视频解码失败，请转为 H.264 MP4")
              }
              onEnded={() => onPositionChange(activeClip?.startMs ?? 0)}
            />
          ) : previewUrl && previewKind === "image" ? (
            <img
              key={previewUrl}
              src={previewUrl}
              alt={previewMedia?.name ?? "图片素材"}
              className="max-h-full max-w-full object-contain"
              onLoad={() => setLoadError("")}
              onError={() =>
                setLoadError("图片加载失败，请用 JPG/PNG/WebP 格式")
              }
            />
          ) : loadError ? (
            <div className="px-4 text-center text-xs text-red-300">{loadError}</div>
          ) : (
            <div className="text-center text-sc-muted">
              <Film size={40} className="mx-auto opacity-20" />
              <p className="mt-2 text-xs">支持导入图片与视频</p>
              <div className="mt-2 flex justify-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><Video size={10} /> MP4 MOV</span>
                <span className="flex items-center gap-1"><Image size={10} /> JPG PNG</span>
              </div>
            </div>
          )}
        </div>

        {message && !loadError && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-sc-panel/90 px-3 py-1 text-[10px] text-sc-muted">
            {message}
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

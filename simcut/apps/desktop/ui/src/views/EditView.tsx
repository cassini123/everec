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
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");

  const primaryMedia = project.media[0];

  useEffect(() => {
    if (!primaryMedia?.blobId) {
      setVideoUrl(null);
      return;
    }
    let revoked: string | null = null;
    api.getMediaUrl(primaryMedia).then((url) => {
      if (url) {
        revoked = url;
        setVideoUrl(url);
      }
    });
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [primaryMedia?.blobId, primaryMedia?.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playing]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || playing) return;
    video.currentTime = positionMs / 1000;
  }, [positionMs, playing]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    onPositionChange(Math.round(video.currentTime * 1000));
  };

  const handleImport = async (files: FileList | null) => {
    if (!files?.length) return;
    setImporting(true);
    setMessage("");
    try {
      const { project: updated } = await api.importMediaFile(project, files[0]);
      onProjectUpdate(updated);
      setMessage(`已导入: ${files[0].name}`);
    } catch (err) {
      setMessage(String(err));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative flex h-56 shrink-0 flex-col border-b border-sc-border bg-black">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs text-sc-muted">预览 · 代理画质保证流畅</span>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="video/*,audio/*,image/*"
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
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="max-h-full max-w-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => onPositionChange(0)}
            />
          ) : (
            <div className="text-center text-sc-muted">
              <Film size={40} className="mx-auto opacity-20" />
              <p className="mt-2 text-xs">导入视频开始剪辑（30s – 30min）</p>
            </div>
          )}
        </div>

        {message && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-sc-panel/90 px-3 py-1 text-[10px] text-sc-muted">
            {message}
          </div>
        )}
      </div>
      <Timeline project={project} positionMs={positionMs} />
    </div>
  );
}

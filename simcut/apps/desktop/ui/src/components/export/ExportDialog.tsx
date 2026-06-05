import { useState } from "react";
import { Cloud, Image, X } from "lucide-react";
import { api } from "../../lib/api";
import type { ExportOptions } from "../../types";

interface Props {
  open: boolean;
  projectId: string | null;
  onClose: () => void;
}

export function ExportDialog({ open, projectId, onClose }: Props) {
  const [format, setFormat] = useState("mp4");
  const [resolution, setResolution] = useState("1080p");
  const [fps, setFps] = useState(30);
  const [saveToPhotos, setSaveToPhotos] = useState(true);
  const [uploadCloud, setUploadCloud] = useState(false);
  const [cloudProvider, setCloudProvider] = useState("iCloud");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleExport = async () => {
    if (!projectId) return;
    setBusy(true);
    setStatus("渲染中…");
    try {
      const options: ExportOptions = {
        format,
        resolution,
        fps,
        saveToPhotos,
        uploadCloud,
        cloudProvider: uploadCloud ? cloudProvider : undefined,
      };
      const result = await api.exportProject(projectId, options);
      setStatus(result.message);
    } catch (err) {
      setStatus(String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-sc-border bg-sc-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">导出渲染</h2>
          <button type="button" onClick={onClose} className="text-sc-muted hover:text-sc-text">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs text-sc-muted">
              格式
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="mt-1 w-full rounded-lg border border-sc-border bg-sc-panel px-2 py-1.5 text-sm"
              >
                <option value="mp4">MP4</option>
                <option value="mov">MOV</option>
                <option value="webm">WebM</option>
              </select>
            </label>
            <label className="text-xs text-sc-muted">
              分辨率
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="mt-1 w-full rounded-lg border border-sc-border bg-sc-panel px-2 py-1.5 text-sm"
              >
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="4k">4K</option>
                <option value="vertical">竖屏 9:16</option>
              </select>
            </label>
            <label className="text-xs text-sc-muted">
              帧率
              <select
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-sc-border bg-sc-panel px-2 py-1.5 text-sm"
              >
                <option value={24}>24</option>
                <option value={30}>30</option>
                <option value={60}>60</option>
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={saveToPhotos}
              onChange={(e) => setSaveToPhotos(e.target.checked)}
            />
            <Image size={14} className="text-sc-green" />
            导出后直接保存相册
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={uploadCloud}
              onChange={(e) => setUploadCloud(e.target.checked)}
            />
            <Cloud size={14} className="text-sc-accent" />
            同时上传网盘
          </label>

          {uploadCloud && (
            <select
              value={cloudProvider}
              onChange={(e) => setCloudProvider(e.target.value)}
              className="w-full rounded-lg border border-sc-border bg-sc-panel px-3 py-2 text-sm"
            >
              <option value="iCloud">iCloud</option>
              <option value="Google Drive">Google Drive</option>
              <option value="百度网盘">百度网盘</option>
              <option value="阿里云盘">阿里云盘</option>
            </select>
          )}

          {status && (
            <p className="rounded-lg bg-sc-panel px-3 py-2 text-xs text-sc-muted">{status}</p>
          )}

          <button
            type="button"
            disabled={busy || !projectId}
            onClick={handleExport}
            className="w-full rounded-lg bg-sc-warm py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "渲染中…" : "开始渲染"}
          </button>
        </div>
      </div>
    </div>
  );
}

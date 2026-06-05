import { useEffect, useState } from "react";
import { ClipboardPaste, ExternalLink, ImagePlus, Link2, Loader2, Video } from "lucide-react";
import type { InspirationCapture, KnowgoProject, MediaDownloadItem } from "../types";
import { api } from "../lib/api";
import { consumeGraphNavigation } from "../lib/graphNav";

interface CaptureViewProps {
  project: KnowgoProject;
  onUpdate: (p: KnowgoProject) => void;
}

export function CaptureView({ project, onUpdate }: CaptureViewProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    title: string;
    description: string;
    imageUrl?: string;
    videoUrl?: string;
    author?: string;
    platform?: string;
    mediaType?: "video" | "image" | "article";
    downloads?: MediaDownloadItem[];
  } | null>(null);

  const mediaProxyUrl = (itemUrl: string, referer?: string) => {
    const params = new URLSearchParams({ url: itemUrl });
    if (referer) params.set("referer", referer);
    return `/api/media/proxy?${params.toString()}`;
  };

  const handleBrowserDownload = (item: MediaDownloadItem) => {
    const a = document.createElement("a");
    a.href = mediaProxyUrl(item.url, item.referer);
    a.download = `${preview?.title ?? "media"}.${item.ext}`;
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    const nav = consumeGraphNavigation();
    if (nav.workspace === "capture" && nav.refId) {
      setHighlightId(nav.refId);
    }
  }, [project.id]);

  const refresh = async () => {
    const updated = await api.getProject(project.id);
    onUpdate(updated);
  };

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith("http")) setUrl(text);
    } catch {
      setError("无法读取剪贴板，请手动粘贴 URL");
    }
  };

  const handlePreview = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const parsed = await api.parseUrl(url.trim());
      setPreview({
        title: parsed.title,
        description: parsed.description,
        imageUrl: parsed.imageUrl,
        videoUrl: parsed.videoUrl,
        author: parsed.author,
        platform: parsed.platform,
        mediaType: parsed.mediaType,
        downloads: parsed.downloads,
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUrl = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.addUrlCapture(project.id, url.trim());
      setUrl("");
      setPreview(null);
      await refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        await api.uploadCapture(project.id, file);
      }
      await refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col border-r border-kg-border">
        <div className="border-b border-kg-border bg-kg-panel px-6 py-4">
          <h2 className="text-lg font-semibold">灵感采集</h2>
          <p className="mt-1 text-xs text-kg-muted">
            粘贴网页链接识别内容，或上传图片 / 视频素材
          </p>
        </div>

        <div className="flex-1 space-y-6 overflow-auto p-6">
          <section>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Link2 className="h-4 w-4 text-kg-accent" />
              网页识别
            </div>
            <div className="flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="min-w-0 flex-1 rounded-lg border border-kg-border bg-kg-bg px-3 py-2 text-sm outline-none focus:border-kg-accent"
              />
              <button
                type="button"
                onClick={handlePasteUrl}
                className="shrink-0 rounded-lg border border-kg-border px-3 py-2 text-xs hover:bg-kg-panel"
                title="从剪贴板粘贴"
              >
                <ClipboardPaste className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handlePreview}
                disabled={loading || !url.trim()}
                className="shrink-0 rounded-lg bg-kg-panel px-4 py-2 text-xs hover:bg-kg-elevated disabled:opacity-50"
              >
                识别
              </button>
              <button
                type="button"
                onClick={handleSaveUrl}
                disabled={loading || !url.trim()}
                className="shrink-0 rounded-lg bg-kg-accent px-4 py-2 text-xs font-medium text-kg-bg disabled:opacity-50"
              >
                保存
              </button>
            </div>

            {preview && (
              <div className="mt-4 rounded-lg border border-kg-border bg-kg-panel p-4">
                <div className="flex gap-4">
                  {preview.videoUrl ? (
                    <video
                      src={mediaProxyUrl(preview.videoUrl)}
                      poster={preview.imageUrl}
                      controls
                      className="h-28 w-44 shrink-0 rounded object-cover"
                    />
                  ) : preview.imageUrl ? (
                    <img
                      src={preview.imageUrl}
                      alt=""
                      className="h-20 w-32 shrink-0 rounded object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <div className="font-medium">{preview.title}</div>
                    {(preview.author || preview.platform) && (
                      <div className="mt-1 text-[11px] text-kg-muted">
                        {[preview.author, preview.platform?.toUpperCase(), preview.mediaType === "video" ? "视频" : undefined]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    )}
                    <p className="mt-1 line-clamp-3 text-xs text-kg-muted">
                      {preview.description}
                    </p>
                    {(preview.downloads?.length ?? 0) > 0 && (
                      <div className="mt-3 space-y-2">
                        {preview.downloads!.map((item) => (
                          <button
                            key={item.url}
                            type="button"
                            onClick={() => handleBrowserDownload(item)}
                            className="block w-full rounded border border-kg-border px-2 py-1.5 text-left text-[11px] hover:bg-kg-bg"
                          >
                            下载 {item.label}
                            {item.noWatermark ? "（无水印）" : ""} · .{item.ext}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <ImagePlus className="h-4 w-4 text-kg-purple" />
              上传图片 / 视频
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-kg-border bg-kg-bg/50 px-6 py-10 transition hover:border-kg-accent/50 hover:bg-kg-panel/30">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-kg-accent" />
              ) : (
                <>
                  <div className="flex gap-3 text-kg-muted">
                    <ImagePlus className="h-8 w-8" />
                    <Video className="h-8 w-8" />
                  </div>
                  <p className="mt-3 text-sm">拖拽或点击上传 JPG / PNG / MP4 / WebM</p>
                </>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
            </label>
          </section>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>

      <aside className="w-80 shrink-0 overflow-auto bg-kg-surface">
        <div className="border-b border-kg-border px-4 py-3 text-xs font-medium uppercase tracking-wider text-kg-muted">
          已采集 · {project.captures.length}
        </div>
        <div className="space-y-2 p-3">
          {project.captures.length === 0 ? (
            <p className="p-4 text-center text-sm text-kg-muted">暂无灵感素材</p>
          ) : (
            project.captures.map((c) => (
              <CaptureCard key={c.id} capture={c} highlighted={c.id === highlightId} />
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

function CaptureCard({ capture, highlighted }: { capture: InspirationCapture; highlighted?: boolean }) {
  const icon =
    capture.type === "url" ? (
      <ExternalLink className="h-3.5 w-3.5" />
    ) : capture.type === "video" ? (
      <Video className="h-3.5 w-3.5" />
    ) : (
      <ImagePlus className="h-3.5 w-3.5" />
    );

  return (
    <div className={`rounded-lg border p-3 ${highlighted ? "border-kg-accent bg-kg-accent/10" : "border-kg-border bg-kg-panel"}`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-kg-accent">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{capture.title}</div>
          <div className="mt-0.5 text-[10px] uppercase text-kg-muted">
            {capture.platform ?? capture.type}
          </div>
        </div>
      </div>
      {(capture.previewUrl || capture.videoUrl || capture.sourceUrl) && (
        <div className="mt-2 overflow-hidden rounded">
          {capture.videoUrl ? (
            <video src={capture.videoUrl} poster={capture.previewUrl} className="h-20 w-full object-cover" controls muted />
          ) : capture.type === "video" && capture.previewUrl ? (
            <video src={capture.previewUrl} className="h-20 w-full object-cover" muted />
          ) : capture.previewUrl ? (
            <img src={capture.previewUrl} alt="" className="h-20 w-full object-cover" />
          ) : null}
        </div>
      )}
      {capture.sourceUrl && (
        <a
          href={capture.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block truncate text-[11px] text-kg-blue hover:underline"
        >
          {capture.sourceUrl}
        </a>
      )}
    </div>
  );
}

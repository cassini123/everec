import { useState } from "react";
import {
  Clapperboard,
  Film,
  Image as ImageIcon,
  Loader2,
  Search,
  Wrench,
} from "lucide-react";
import type {
  ImageAnalysis,
  InspirationCapture,
  KnowgoProject,
  VideoAnalysis,
} from "../types";
import { api, saveStyleGuide } from "../lib/api";

interface AnalyzeViewProps {
  project: KnowgoProject;
  apiKey: string;
  onUpdate: (p: KnowgoProject) => void;
}

export function AnalyzeView({ project, apiKey, onUpdate }: AnalyzeViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    project.captures[0]?.id ?? null,
  );
  const [imageResult, setImageResult] = useState<ImageAnalysis | null>(null);
  const [videoResult, setVideoResult] = useState<VideoAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [durationSec, setDurationSec] = useState(60);

  const selected = project.captures.find((c) => c.id === selectedId);

  const handleAnalyze = async () => {
    if (!selected) return;
    setLoading(true);
    setError("");
    setImageResult(null);
    setVideoResult(null);
    try {
      const hint = `${selected.title} ${selected.description} ${project.brief.tone}`;

      if (selected.type === "image" && selected.fileName) {
        const result = await api.analyzeImage(
          project.id,
          selected.id,
          selected.fileName,
          hint,
          apiKey || undefined,
        );
        setImageResult(result);
        const style = await api.analyzeStyle(project.id, hint, result.techniques);
        const updated = await saveStyleGuide(project.id, style);
        onUpdate(updated);
      } else if (selected.type === "video") {
        const result = await api.analyzeVideo(
          project.id,
          selected.id,
          durationSec,
          hint,
          apiKey || undefined,
        );
        setVideoResult(result);
        const style = await api.analyzeStyle(project.id, hint, result.overallKeywords);
        const updated = await saveStyleGuide(project.id, style);
        onUpdate(updated);
      } else if (selected.type === "url" || selected.previewUrl) {
        const result = await api.analyzeImage(
          project.id,
          selected.id,
          selected.fileName ?? "",
          hint,
          apiKey || undefined,
        );
        setImageResult(result);
        const style = await api.analyzeStyle(project.id, hint, [result.artStyle, result.mood]);
        const updated = await saveStyleGuide(project.id, style);
        onUpdate(updated);
      } else {
        setError("请先上传图片或视频，或选择含预览图的 URL 素材");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="w-56 shrink-0 overflow-auto border-r border-kg-border bg-kg-surface">
        <div className="border-b border-kg-border px-3 py-3 text-xs font-medium text-kg-muted">
          选择素材
        </div>
        {project.captures.map((c) => (
          <CapturePick
            key={c.id}
            capture={c}
            active={c.id === selectedId}
            onSelect={() => setSelectedId(c.id)}
          />
        ))}
        {project.captures.length === 0 && (
          <p className="p-4 text-xs text-kg-muted">请先在 Capture 中采集灵感</p>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-kg-border bg-kg-panel px-6 py-3">
          <div>
            <h2 className="text-lg font-semibold">灵感分析</h2>
            <p className="text-xs text-kg-muted">
              图片：艺术风格与实现方法 · 视频：风格解析 + 自动镜头切分 + 分镜表
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selected?.type === "video" && (
              <label className="flex items-center gap-2 text-xs text-kg-muted">
                时长(秒)
                <input
                  type="number"
                  min={10}
                  max={600}
                  value={durationSec}
                  onChange={(e) => setDurationSec(Number(e.target.value))}
                  className="w-16 rounded border border-kg-border bg-kg-bg px-2 py-1"
                />
              </label>
            )}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || !selected}
              className="flex items-center gap-2 rounded-lg bg-kg-purple px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              开始分析
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

          {!imageResult && !videoResult && !loading && (
            <div className="flex h-64 items-center justify-center text-sm text-kg-muted">
              选择素材并点击「开始分析」
            </div>
          )}

          {imageResult && <ImageAnalysisPanel result={imageResult} />}
          {videoResult && <VideoAnalysisPanel result={videoResult} />}
        </div>
      </div>
    </div>
  );
}

function CapturePick({
  capture,
  active,
  onSelect,
}: {
  capture: InspirationCapture;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-2 border-b border-kg-border/50 px-3 py-2.5 text-left text-sm ${
        active ? "bg-kg-elevated text-kg-text" : "hover:bg-kg-panel text-kg-muted"
      }`}
    >
      {capture.type === "video" ? (
        <Film className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <ImageIcon className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="truncate">{capture.title}</span>
    </button>
  );
}

function ImageAnalysisPanel({ result }: { result: ImageAnalysis }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-kg-muted">
        来源 · {result.source === "llm" ? "AI Vision" : "本地分析"}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoBlock title="主体" value={result.subject} />
        <InfoBlock title="构图" value={result.composition} />
        <InfoBlock title="艺术风格" value={result.artStyle} highlight />
        <InfoBlock title="情绪" value={result.mood} />
      </div>

      <div>
        <div className="mb-2 text-xs text-kg-muted">色彩 palette</div>
        <div className="flex gap-2">
          {result.colorPalette.map((c) => (
            <div key={c} className="flex flex-col items-center gap-1">
              <div
                className="h-10 w-10 rounded-lg border border-kg-border"
                style={{ background: c }}
              />
              <span className="font-mono text-[10px] text-kg-muted">{c}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs text-kg-muted">技法</div>
        <div className="flex flex-wrap gap-1.5">
          {result.techniques.map((t) => (
            <span
              key={t}
              className="rounded-full bg-kg-panel px-2.5 py-1 text-xs text-kg-accent"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <ImplementationBlock guide={result.implementation} />
    </div>
  );
}

function VideoAnalysisPanel({ result }: { result: VideoAnalysis }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-kg-muted">
        <Clapperboard className="h-3.5 w-3.5" />
        来源 · {result.source === "llm" ? "AI 语义分析" : "本地镜头切分"}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <InfoBlock title="短片风格" value={result.filmStyle} highlight />
        <InfoBlock title="节奏" value={result.pacing} />
        <InfoBlock title="叙事结构" value={result.narrativeStructure} />
        <InfoBlock title="调色风格" value={result.colorGrading} />
        <InfoBlock title="镜头语言" value={result.cameraLanguage} />
      </div>

      <div>
        <div className="mb-2 text-xs text-kg-muted">风格关键词</div>
        <div className="flex flex-wrap gap-1.5">
          {result.overallKeywords.map((kw) => (
            <span
              key={kw}
              className="rounded-full bg-kg-purple/20 px-2.5 py-1 text-xs text-kg-purple"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Film className="h-4 w-4 text-kg-accent" />
          分镜表 · {result.shots.length} 镜头
        </div>
        <div className="space-y-2">
          {result.shots.map((shot) => (
            <div
              key={shot.index}
              className="shot-card rounded-lg border border-kg-border bg-kg-panel p-4 transition"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded bg-kg-accent/20 px-2 py-0.5 font-mono text-xs text-kg-accent">
                  #{shot.index}
                </span>
                <span className="text-xs text-kg-muted">
                  {shot.startSec}s – {shot.endSec}s ({shot.durationSec}s)
                </span>
                <span className="rounded bg-kg-elevated px-2 py-0.5 text-xs">
                  {shot.shotType}
                </span>
              </div>
              <p className="mt-2 text-sm">{shot.description}</p>
              <div className="mt-2 grid gap-2 text-xs text-kg-muted md:grid-cols-2">
                <div>
                  <span className="text-kg-text">运镜：</span>
                  {shot.cameraMovement}
                </div>
                <div>
                  <span className="text-kg-text">实现：</span>
                  {shot.implementation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({
  title,
  value,
  highlight,
}: {
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-kg-border bg-kg-panel p-4">
      <div className="mb-1 text-xs text-kg-muted">{title}</div>
      <div className={highlight ? "text-kg-accent font-medium" : "text-sm"}>
        {value}
      </div>
    </div>
  );
}

function ImplementationBlock({
  guide,
}: {
  guide: ImageAnalysis["implementation"];
}) {
  return (
    <div className="rounded-xl border border-kg-border bg-kg-panel p-5">
      <div className="mb-3 flex items-center gap-2 font-medium">
        <Wrench className="h-4 w-4 text-kg-orange" />
        实现方法
        <span className="rounded bg-kg-elevated px-2 py-0.5 text-[10px] uppercase text-kg-muted">
          {guide.difficulty}
        </span>
      </div>
      <p className="text-sm text-kg-muted">{guide.summary}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-1 text-xs text-kg-muted">推荐工具</div>
          <ul className="space-y-1 text-sm">
            {guide.tools.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1 text-xs text-kg-muted">步骤</div>
          <ol className="list-decimal space-y-1 pl-4 text-sm">
            {guide.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

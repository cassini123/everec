import { useRef, useState } from "react";
import { Clapperboard, Palette, Upload } from "lucide-react";
import { WaveformChart } from "../components/color/WaveformChart";
import { WaveformScope } from "../components/color/WaveformScope";
import { api } from "../lib/api";
import type { ColorAnalysisResult, Project } from "../types";

interface Props {
  project: Project | null;
  positionMs: number;
  onApplyLut: (name: string) => void;
}

export function ColorView({ project, positionMs, onApplyLut }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [analysis, setAnalysis] = useState<ColorAnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [matchFrame, setMatchFrame] = useState(true);

  const videoMedia = project?.media.find((m) => m.kind === "video" && m.blobId);

  const runAnalysis = async (file: File) => {
    setBusy(true);
    setMessage("");
    try {
      let result: ColorAnalysisResult;
      if (matchFrame && videoMedia?.blobId) {
        result = await api.analyzeColorWithFrame(file, videoMedia.blobId, positionMs);
        setMessage("已用参考图 + 当前画面波形匹配生成 LUT");
      } else {
        result = await api.analyzeColorFromFile(file);
        setMessage("已用参考图波形生成 LUT");
      }
      setAnalysis(result);
    } catch (err) {
      setMessage(String(err));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleFile = async (files: FileList | null) => {
    if (!files?.length) return;
    await runAnalysis(files[0]);
  };

  const handleSaveLut = async () => {
    if (!analysis) return;
    try {
      const path = await api.saveLutPreset(
        analysis.suggestedLut.lutCube,
        analysis.suggestedLut.name,
      );
      onApplyLut(analysis.suggestedLut.name);
      setMessage(`LUT 已保存: ${path}`);
    } catch (err) {
      setMessage(String(err));
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-semibold">
              <Palette size={20} />
              色彩解析 · 波形匹配
            </h1>
            <p className="mt-1 text-sm text-sc-muted">
              上传参考照片，通过亮度波形 + RGB Parade 匹配生成 LUT
            </p>
          </div>
          <div className="flex items-center gap-3">
            {videoMedia && (
              <label className="flex items-center gap-2 text-xs text-sc-muted">
                <input
                  type="checkbox"
                  checked={matchFrame}
                  onChange={(e) => setMatchFrame(e.target.checked)}
                />
                <Clapperboard size={12} />
                匹配当前画面
              </label>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-lg bg-sc-accent px-4 py-2 text-sm text-white hover:bg-sc-accent-dim disabled:opacity-50"
            >
              <Upload size={14} />
              {busy ? "匹配中…" : "上传参考图"}
            </button>
          </div>
        </div>

        {message && (
          <p className="mb-4 rounded-lg bg-sc-panel px-3 py-2 text-xs text-sc-muted">{message}</p>
        )}

        {analysis ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-xl border border-sc-border bg-sc-panel p-4">
                <h3 className="mb-3 text-sm font-medium">主色调</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.dominantColors.map((c) => (
                    <div key={c.hex} className="color-swatch text-center">
                      <div
                        className="h-12 w-12 rounded-lg border border-sc-border"
                        style={{ backgroundColor: c.hex }}
                      />
                      <div className="mt-1 text-[10px] text-sc-muted">{c.label}</div>
                      <div className="font-mono text-[10px]">{c.hex}</div>
                    </div>
                  ))}
                </div>
              </div>
              {analysis.waveform && (
                <WaveformChart waveform={analysis.waveform} title="亮度分布直方图" />
              )}
            </div>

            <div className="rounded-xl border border-sc-border bg-sc-panel p-4">
              <h3 className="mb-2 text-sm font-medium">{analysis.colorSystem.name}</h3>
              <p className="mb-3 text-xs text-sc-muted">{analysis.colorSystem.description}</p>
              <div className="mb-3 flex flex-wrap gap-1">
                {analysis.moodTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-sc-accent/15 px-2 py-0.5 text-[10px] text-sc-accent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {analysis.matchCurves && (
                <p className="mb-3 text-[10px] text-sc-muted">
                  匹配曲线：亮度 + R/G/B 四通道直方图均衡
                </p>
              )}
              <button
                type="button"
                onClick={handleSaveLut}
                className="w-full rounded-lg bg-sc-warm py-2 text-sm text-white hover:opacity-90"
              >
                应用 {analysis.suggestedLut.name}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex py-24 items-center justify-center text-sm text-sc-muted">
            上传参考照片，Simcut 将用色彩波形匹配生成 LUT
          </div>
        )}
      </div>

      {analysis?.waveform?.scope && (
        <div className="shrink-0 border-t border-sc-border bg-sc-surface p-4">
          <WaveformScope
            scope={analysis.waveform.scope}
            title="参考图色彩波形（列采样 · 监视器精度）"
          />
        </div>
      )}
    </div>
  );
}

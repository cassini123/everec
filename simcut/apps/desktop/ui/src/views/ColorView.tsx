import { useRef, useState } from "react";
import { Palette, Upload } from "lucide-react";
import { api } from "../lib/api";
import type { ColorAnalysisResult } from "../types";

interface Props {
  onApplyLut: (name: string) => void;
}

export function ColorView({ onApplyLut }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [analysis, setAnalysis] = useState<ColorAnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const handleFile = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setMessage("");
    try {
      if (api.isDesktop()) {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const selected = await open({
          multiple: false,
          filters: [{ name: "Image", extensions: ["jpg", "jpeg", "png", "webp"] }],
        });
        if (!selected || Array.isArray(selected)) return;
        const result = await api.analyzeColorFromPhoto(selected);
        setAnalysis(result);
      } else {
        const result = await api.analyzeColorFromFile(files[0]);
        setAnalysis(result);
      }
      setMessage("色彩系统已解析");
    } catch (err) {
      setMessage(String(err));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <Palette size={20} />
            色彩解析
          </h1>
          <p className="mt-1 text-sm text-sc-muted">
            上传参考照片，识别色彩系统并生成自适应 LUT
          </p>
        </div>
        <div>
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
            onClick={() => {
              if (api.isDesktop()) {
                handleFile(null);
              } else {
                fileRef.current?.click();
              }
            }}
            className="flex items-center gap-2 rounded-lg bg-sc-accent px-4 py-2 text-sm text-white hover:bg-sc-accent-dim disabled:opacity-50"
          >
            <Upload size={14} />
            {busy ? "分析中…" : "上传参考图"}
          </button>
        </div>
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-sc-panel px-3 py-2 text-xs text-sc-muted">{message}</p>
      )}

      {analysis ? (
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
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
        <div className="flex flex-1 items-center justify-center text-sm text-sc-muted">
          上传一张照片开始色彩解析
        </div>
      )}
    </div>
  );
}

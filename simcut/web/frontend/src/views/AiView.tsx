import { useState } from "react";
import { Brain, Send, Zap } from "lucide-react";
import { api } from "../lib/api";
import type { AiAnalysisResult } from "../types";

interface Props {
  projectName: string;
}

export function AiView({ projectName }: Props) {
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAnalyze = async () => {
    setBusy(true);
    try {
      const res = await api.analyzeFrameAi(projectName, 0);
      setAnalysis(res);
    } finally {
      setBusy(false);
    }
  };

  const handlePrompt = async () => {
    if (!prompt.trim()) return;
    const res = await api.applyPromptEdit(prompt.trim());
    setResult(res);
  };

  const applySuggestion = async (p: string) => {
    setPrompt(p);
    const res = await api.applyPromptEdit(p);
    setResult(res);
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <Brain size={20} />
            AI 解析
          </h1>
          <p className="mt-1 text-sm text-sc-muted">
            屏幕显示 ISO / 曝光 / 灯光参数，给出调整建议与 Prompt 剪辑
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={handleAnalyze}
          className="flex items-center gap-2 rounded-lg bg-sc-accent px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          <Zap size={14} />
          {busy ? "分析中…" : "分析当前画面"}
        </button>
      </div>

      {analysis && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="ISO" value={String(analysis.metrics.iso)} />
          <MetricCard label="快门" value={analysis.metrics.shutterSpeed} />
          <MetricCard label="光圈" value={`f/${analysis.metrics.aperture.toFixed(1)}`} />
          <MetricCard label="曝光 EV" value={analysis.metrics.exposureValue.toFixed(1)} />
          <MetricCard label="白平衡" value={`${analysis.metrics.whiteBalanceK}K`} />
          <MetricCard
            label="高光溢出"
            value={`${Math.round(analysis.metrics.highlightClipping * 100)}%`}
          />
          <MetricCard
            label="阴影细节"
            value={`${Math.round(analysis.metrics.shadowDetail * 100)}%`}
          />
          <MetricCard
            label="综合评分"
            value={`${Math.round(analysis.overallScore * 100)}`}
            highlight
          />
        </div>
      )}

      {analysis && (
        <div className="mb-6 rounded-xl border border-sc-border bg-sc-panel p-4">
          <h3 className="mb-2 text-sm font-medium">调整建议</h3>
          <ul className="space-y-1">
            {analysis.suggestions.map((s) => (
              <li key={s} className="text-sm text-sc-muted">
                · {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium">推荐 Prompt 剪辑</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.promptEdits.map((pe) => (
              <button
                key={pe.prompt}
                type="button"
                onClick={() => applySuggestion(pe.prompt)}
                className="rounded-full border border-sc-border bg-sc-panel px-3 py-1.5 text-xs hover:border-sc-accent"
              >
                {pe.prompt}
                <span className="ml-1 text-sc-muted">
                  {Math.round(pe.confidence * 100)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto">
        <h3 className="mb-2 text-sm font-medium">Prompt 剪辑调整</h3>
        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例如：让前 3 秒渐显，整体偏暖色调…"
            className="flex-1 rounded-lg border border-sc-border bg-sc-panel px-4 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handlePrompt()}
          />
          <button
            type="button"
            onClick={handlePrompt}
            className="flex items-center gap-2 rounded-lg bg-sc-warm px-4 py-2 text-sm text-white"
          >
            <Send size={14} />
            执行
          </button>
        </div>
        {result && (
          <p className="mt-2 rounded-lg bg-sc-green/10 px-3 py-2 text-xs text-sc-green">
            {result}
          </p>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight ? "border-sc-warm bg-sc-warm/10" : "border-sc-border bg-sc-panel"
      }`}
    >
      <div className="text-[10px] text-sc-muted">{label}</div>
      <div className="mt-1 font-mono text-lg">{value}</div>
    </div>
  );
}

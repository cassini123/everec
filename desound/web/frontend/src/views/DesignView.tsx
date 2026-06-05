import { useState } from "react";
import { Key, Search, Sparkles, Tag } from "lucide-react";
import {
  analyzeSoundDesign,
  getStoredApiKey,
  setStoredApiKey,
} from "../lib/soundDesign";
import { ProjectPicker } from "../components/layout/ProjectPicker";
import type { DesoundProjectSummary, SoundDesignResult } from "../types";

interface DesignViewProps {
  projects: DesoundProjectSummary[];
  activeProjectId: string | null;
  onProjectSelect: (id: string) => void;
  onGoToProjects?: () => void;
  onApplyKeywords?: (keywords: string[]) => void;
}

export function DesignView({
  projects,
  activeProjectId,
  onProjectSelect,
  onGoToProjects,
  onApplyKeywords,
}: DesignViewProps) {
  const [description, setDescription] = useState("");
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SoundDesignResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (description.trim().length < 2) {
      setError("请输入至少 2 个字的描述");
      return;
    }
    setLoading(true);
    setError("");
    setStoredApiKey(apiKey);
    try {
      const data = await analyzeSoundDesign(description, apiKey);
      setResult(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col border-r border-ds-border">
        <div className="border-b border-ds-border bg-ds-panel px-4 py-3">
          <div className="mb-2">
            <ProjectPicker
              projects={projects}
              activeProjectId={activeProjectId}
              onSelect={onProjectSelect}
              onManage={onGoToProjects}
            />
          </div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-ds-purple" />
            声音设计 · AI 辅助
          </h2>
          <p className="mt-1 text-xs text-ds-muted">
            描述你想要的听感，AI 提取关键词并匹配相似风格参考
          </p>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div>
            <label className="mb-2 block text-xs text-ds-muted">创意描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：雨夜城市中的孤独感，带有轻微合成器底噪，适合纪录片片头…"
              rows={6}
              className="w-full resize-none rounded-lg border border-ds-border bg-ds-bg px-4 py-3 text-sm leading-relaxed outline-none focus:border-ds-purple"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs text-ds-muted">
              <Key className="h-3.5 w-3.5" />
              OpenAI API Key（可选，留空使用本地分析）
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full rounded border border-ds-border bg-ds-bg px-3 py-2 font-mono text-sm outline-none focus:border-ds-purple"
            />
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-ds-purple px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ds-purple/80 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {loading ? "分析中…" : "分析声音设计"}
          </button>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>

      <aside className="w-80 shrink-0 overflow-auto bg-ds-surface">
        <div className="border-b border-ds-border px-4 py-3 text-xs font-medium uppercase tracking-wider text-ds-muted">
          分析结果
          {result && (
            <span className="ml-2 normal-case text-ds-purple">
              · {result.source === "llm" ? "LLM" : "本地"}
            </span>
          )}
        </div>

        {!result ? (
          <div className="flex h-48 items-center justify-center p-4 text-center text-sm text-ds-muted">
            输入描述后点击分析
          </div>
        ) : (
          <div className="space-y-4 p-4">
            <div>
              <div className="mb-2 text-xs text-ds-muted">情绪 / Mood</div>
              <div className="rounded-lg bg-ds-panel px-3 py-2 text-sm">{result.mood}</div>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-1 text-xs text-ds-muted">
                <Tag className="h-3 w-3" />
                关键词
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-ds-accent/15 px-2.5 py-0.5 text-xs text-ds-accent"
                  >
                    {kw}
                  </span>
                ))}
              </div>
              {onApplyKeywords && (
                <button
                  type="button"
                  onClick={() => onApplyKeywords(result.keywords)}
                  className="mt-2 text-xs text-ds-blue hover:underline"
                >
                  应用到项目标签
                </button>
              )}
            </div>

            <div>
              <div className="mb-2 text-xs text-ds-muted">相似风格参考</div>
              <div className="space-y-2">
                {result.similarStyles.map((style) => (
                  <div
                    key={style.name}
                    className="rounded-lg border border-ds-border bg-ds-panel p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{style.nameZh}</span>
                      <span className="font-mono text-xs text-ds-green">
                        {(style.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-ds-muted">{style.name}</div>
                    <div className="mt-1 text-[10px] text-ds-muted">{style.reference}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {style.tags.slice(0, 4).map((t) => (
                        <span key={t} className="rounded bg-ds-bg px-1.5 py-0.5 text-[10px] text-ds-muted">
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs text-ds-muted">设计建议</div>
              <ul className="space-y-1.5 text-sm text-ds-muted">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-ds-purple">·</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

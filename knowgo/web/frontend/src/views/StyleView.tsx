import { useState } from "react";
import {
  ExternalLink,
  Film,
  Loader2,
  Palette,
  RefreshCw,
  Sparkles,
  Type,
  Wand2,
} from "lucide-react";
import type { KnowgoProject } from "../types";
import { api, saveStyleGuide } from "../lib/api";

interface StyleViewProps {
  project: KnowgoProject;
  onUpdate: (p: KnowgoProject) => void;
}

export function StyleView({ project, onUpdate }: StyleViewProps) {
  const style = project.styleGuide;
  const [loading, setLoading] = useState(false);
  const [previewShort, setPreviewShort] = useState<string | null>(null);

  const refreshStyle = async () => {
    setLoading(true);
    try {
      const hint = `${project.brief.tone} ${project.brief.references} ${project.captures.map((c) => c.title).join(" ")}`;
      const keywords = project.captures.flatMap((c) => [c.title, c.platform ?? ""]).filter(Boolean);
      const guide = await api.analyzeStyle(project.id, hint, keywords);
      const updated = await saveStyleGuide(project.id, guide);
      onUpdate(updated);
    } finally {
      setLoading(false);
    }
  };

  const activeShort = style.similarShorts.find((s) => s.id === previewShort);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="flex items-center justify-between border-b border-kg-border bg-kg-panel px-6 py-3">
        <div>
          <h2 className="text-lg font-semibold">风格体系</h2>
          <p className="text-xs text-kg-muted">
            整体风格关键词 · 字体预览 · 海报风格 · 特效参考 · 相似短片
          </p>
        </div>
        <button
          type="button"
          onClick={refreshStyle}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-kg-border px-4 py-2 text-xs hover:bg-kg-elevated disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          重新生成
        </button>
      </div>

      <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
        <section>
          <SectionTitle icon={Sparkles} title="整体风格关键词" />
          <div className="mt-3 flex flex-wrap gap-2">
            {style.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-kg-accent/15 px-3 py-1.5 text-sm text-kg-accent"
              >
                {kw}
              </span>
            ))}
            {style.moodTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-kg-purple/15 px-3 py-1.5 text-sm text-kg-purple"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle icon={Type} title="推荐字体（预览）" />
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {style.fonts.map((font) => (
              <div
                key={font.name}
                className="font-preview-card rounded-xl border border-kg-border p-5"
              >
                <div className="text-xs text-kg-muted">{font.category}</div>
                <div
                  className="mt-3 text-2xl font-semibold leading-tight"
                  style={{ fontFamily: font.cssFamily }}
                >
                  {font.previewText}
                </div>
                <div className="mt-2 text-sm font-medium">{font.name}</div>
                <p className="mt-1 text-xs text-kg-muted">{font.usage}</p>
                {font.googleFontUrl && (
                  <a
                    href={font.googleFontUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[11px] text-kg-blue hover:underline"
                  >
                    Google Fonts <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle icon={Palette} title="海报风格" />
          <div className="mt-3 rounded-xl border border-kg-border bg-kg-panel p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs text-kg-muted">布局</div>
                <div className="mt-1 text-sm">{style.posterStyle.layout}</div>
                <div className="mt-4 text-xs text-kg-muted">构图</div>
                <div className="mt-1 text-sm">{style.posterStyle.composition}</div>
                <div className="mt-4 text-xs text-kg-muted">字体组合</div>
                <div className="mt-1 text-sm">{style.posterStyle.typography}</div>
              </div>
              <div>
                <div className="text-xs text-kg-muted">色板</div>
                <div className="mt-2 flex gap-2">
                  {style.posterStyle.colorScheme.map((c) => (
                    <div key={c} className="flex flex-col items-center gap-1">
                      <div
                        className="h-12 w-12 rounded-lg border border-kg-border"
                        style={{ background: c }}
                      />
                      <span className="font-mono text-[10px]">{c}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-kg-muted">
                  {style.posterStyle.referenceDescription}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle icon={Wand2} title="特效实现（参考）" />
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {style.vfxRecommendations.map((vfx) => (
              <div
                key={vfx.name}
                className="overflow-hidden rounded-xl border border-kg-border bg-kg-panel"
              >
                <img
                  src={vfx.referenceImageUrl}
                  alt={vfx.name}
                  className="h-36 w-full object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{vfx.name}</div>
                    <span className="rounded bg-kg-elevated px-2 py-0.5 text-[10px] uppercase text-kg-muted">
                      {vfx.difficulty}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-kg-muted">{vfx.description}</p>
                  <div className="mt-2 text-[11px] text-kg-text">
                    {vfx.tools.join(" · ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle icon={Film} title="相似短片推荐" />
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              {style.similarShorts.map((short) => (
                <button
                  key={short.id}
                  type="button"
                  onClick={() => setPreviewShort(short.id)}
                  className={`flex w-full gap-3 rounded-lg border p-3 text-left transition ${
                    previewShort === short.id
                      ? "border-kg-accent bg-kg-accent/10"
                      : "border-kg-border bg-kg-panel hover:border-kg-accent/40"
                  }`}
                >
                  <img
                    src={short.previewUrl}
                    alt=""
                    className="h-14 w-24 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{short.title}</span>
                      <span className="shrink-0 text-xs text-kg-accent">
                        {Math.round(short.similarity * 100)}%
                      </span>
                    </div>
                    <div className="text-xs text-kg-muted">
                      {short.director} · {short.year}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {short.styleTags.map((t) => (
                        <span key={t} className="text-[10px] text-kg-muted">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-kg-border bg-kg-panel p-4">
              {activeShort ? (
                <>
                  <div className="aspect-video overflow-hidden rounded-lg bg-kg-bg">
                    <img
                      src={activeShort.previewUrl}
                      alt={activeShort.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold">{activeShort.title}</h3>
                    <p className="text-sm text-kg-muted">
                      {activeShort.director} · {activeShort.year}
                    </p>
                    <a
                      href={activeShort.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-kg-accent px-4 py-2 text-sm font-medium text-kg-bg hover:bg-kg-accent-dim"
                    >
                      观看 / 搜索
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-48 items-center justify-center text-sm text-kg-muted">
                  点击左侧短片查看预览
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Sparkles;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-kg-muted">
      <Icon className="h-4 w-4 text-kg-accent" />
      {title}
    </div>
  );
}

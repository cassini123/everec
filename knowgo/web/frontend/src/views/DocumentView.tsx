import { useEffect, useState } from "react";
import { ImagePlus, Save, Video } from "lucide-react";
import type { DocumentSection, InspirationDocument, KnowgoProject } from "../types";
import { saveDocument } from "../lib/api";

interface DocumentViewProps {
  project: KnowgoProject;
  onUpdate: (p: KnowgoProject) => void;
}

export function DocumentView({ project, onUpdate }: DocumentViewProps) {
  const [doc, setDoc] = useState<InspirationDocument>(project.document);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDoc(project.document);
  }, [project.id, project.document]);

  const updateSection = (id: string, patch: Partial<DocumentSection>) => {
    setDoc({
      ...doc,
      sections: doc.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const attachMedia = (sectionId: string, captureId: string) => {
    updateSection(sectionId, {
      mediaIds: [
        ...new Set([
          ...(doc.sections.find((s) => s.id === sectionId)?.mediaIds ?? []),
          captureId,
        ]),
      ],
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await saveDocument(project.id, doc);
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const syncFromAnalysis = () => {
    const brief = project.brief;
    const style = project.styleGuide;
    const captures = project.captures;

    setDoc({
      ...doc,
      title: brief.title || doc.title,
      sections: doc.sections.map((s) => {
        if (s.id === "overview") {
          return {
            ...s,
            content: [
              `**客户**：${brief.client}`,
              `**目标**：${brief.objective}`,
              `**受众**：${brief.audience}`,
              `**调性**：${brief.tone}`,
            ]
              .filter((l) => !l.endsWith("**："))
              .join("\n\n"),
          };
        }
        if (s.id === "inspiration") {
          return {
            ...s,
            content: captures.map((c) => `- ${c.title}（${c.type}）`).join("\n"),
            mediaIds: captures.slice(0, 4).map((c) => c.id),
          };
        }
        if (s.id === "visual") {
          return {
            ...s,
            content: [
              `**风格关键词**：${style.keywords.join(" · ")}`,
              `**情绪标签**：${style.moodTags.join(" · ")}`,
              `**海报风格**：${style.posterStyle.layout}`,
            ].join("\n\n"),
          };
        }
        if (s.id === "implementation") {
          return {
            ...s,
            content: style.vfxRecommendations
              .map((v) => `### ${v.name}\n${v.description}\n工具：${v.tools.join(", ")}`)
              .join("\n\n"),
          };
        }
        return s;
      }),
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-kg-border bg-kg-panel px-6 py-3">
        <div>
          <h2 className="text-lg font-semibold">灵感输出文档</h2>
          <p className="text-xs text-kg-muted">可编辑 Markdown 风格文档，嵌入图片/视频</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={syncFromAnalysis}
            className="rounded-lg border border-kg-border px-4 py-2 text-xs hover:bg-kg-elevated"
          >
            从 Brief / 风格同步
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-kg-accent px-4 py-2 text-sm font-medium text-kg-bg disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "保存中…" : "保存文档"}
          </button>
          {saved && <span className="self-center text-xs text-kg-accent">已保存</span>}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <input
          value={doc.title}
          onChange={(e) => setDoc({ ...doc, title: e.target.value })}
          className="mb-6 w-full max-w-2xl border-b border-kg-border bg-transparent pb-2 text-2xl font-semibold outline-none focus:border-kg-accent"
        />

        <div className="mx-auto max-w-3xl space-y-8">
          {doc.sections.map((section) => (
            <section key={section.id} className="rounded-xl border border-kg-border bg-kg-panel/50 p-5">
              <input
                value={section.heading}
                onChange={(e) => updateSection(section.id, { heading: e.target.value })}
                className="mb-3 w-full bg-transparent text-lg font-medium outline-none"
              />
              <textarea
                value={section.content}
                onChange={(e) => updateSection(section.id, { content: e.target.value })}
                rows={8}
                className="prose-edit w-full resize-y rounded-lg border border-kg-border bg-kg-bg px-4 py-3 font-mono text-sm leading-relaxed outline-none"
                placeholder="在此编辑内容… 支持 **粗体** 与 Markdown 风格"
              />

              {section.mediaIds.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                  {section.mediaIds.map((id) => {
                    const cap = project.captures.find((c) => c.id === id);
                    if (!cap?.previewUrl) return null;
                    return cap.type === "video" ? (
                      <video
                        key={id}
                        src={cap.previewUrl}
                        controls
                        className="rounded-lg border border-kg-border"
                      />
                    ) : (
                      <img
                        key={id}
                        src={cap.previewUrl}
                        alt={cap.title}
                        className="rounded-lg border border-kg-border object-cover"
                      />
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[11px] text-kg-muted">嵌入素材：</span>
                {project.captures.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => attachMedia(section.id, c.id)}
                    className="flex items-center gap-1 rounded border border-kg-border px-2 py-1 text-[11px] hover:bg-kg-elevated"
                  >
                    {c.type === "video" ? (
                      <Video className="h-3 w-3" />
                    ) : (
                      <ImagePlus className="h-3 w-3" />
                    )}
                    {c.title.slice(0, 12)}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

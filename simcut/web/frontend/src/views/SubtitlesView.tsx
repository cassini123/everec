import { useState } from "react";
import { Languages, Plus, Trash2, Wand2 } from "lucide-react";
import { api, formatMs } from "../lib/api";
import type { Project, SubtitleCue } from "../types";

const LANGUAGES = [
  { code: "zh", label: "中文" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
];

interface Props {
  project: Project;
  onUpdate: (project: Project) => void | Promise<void>;
  embedded?: boolean;
}

export function SubtitlesView({ project, onUpdate, embedded }: Props) {
  const [language, setLanguage] = useState("zh");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");

  const handleRecognize = async () => {
    setBusy(true);
    setMessage("");
    try {
      const cues = await api.recognizeSubtitles(
        project.id,
        language,
        project.media[0]?.id,
      );
      await onUpdate({ ...project, subtitles: [...project.subtitles, ...cues] });
      setMessage(`已识别 ${cues.length} 条字幕`);
    } catch (err) {
      setMessage(String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAddManual = async () => {
    const startMs = project.durationMs > 0 ? Math.max(0, project.durationMs - 3000) : 0;
    const updated = await api.addSubtitle(project, {
      startMs,
      endMs: startMs + 3000,
      text: "新字幕",
      language,
    });
    await onUpdate(updated);
    setMessage("已添加字幕，点击文字可编辑");
  };

  const handleSaveEdit = async (cueId: string) => {
    const updated = await api.updateSubtitle(project, cueId, { text: draftText });
    await onUpdate(updated);
    setEditingId(null);
  };

  const handleDelete = async (cueId: string) => {
    const updated = await api.removeSubtitle(project, cueId);
    await onUpdate(updated);
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          {!embedded && (
            <>
              <h1 className="flex items-center gap-2 text-lg font-semibold">
                <Languages size={20} />
                字幕轨道
              </h1>
              <p className="mt-1 text-sm text-sc-muted">
                自动识别或手动添加，导出时自动烧录到视频
              </p>
            </>
          )}
          {embedded && (
            <p className="text-sm text-sc-muted">自动识别或手动添加字幕</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-lg border border-sc-border bg-sc-panel px-3 py-2 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddManual}
            className="flex items-center gap-1.5 rounded-lg border border-sc-border bg-sc-panel px-3 py-2 text-sm hover:border-sc-accent/40"
          >
            <Plus size={14} />
            手动添加
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleRecognize}
            className="flex items-center gap-2 rounded-lg bg-sc-accent px-4 py-2 text-sm text-white hover:bg-sc-accent-dim disabled:opacity-50"
          >
            <Wand2 size={14} />
            {busy ? "识别中…" : "自动识别"}
          </button>
        </div>
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-sc-panel px-3 py-2 text-xs text-sc-muted">{message}</p>
      )}

      <div className="flex-1 space-y-2 overflow-auto">
        {project.subtitles.map((cue: SubtitleCue) => (
          <div key={cue.id} className="subtitle-cue group rounded-lg bg-sc-panel px-4 py-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-mono text-[10px] text-sc-muted">
                {formatMs(cue.startMs)} → {formatMs(cue.endMs)} · {cue.language}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(cue.id)}
                className="opacity-0 text-red-400 transition-opacity group-hover:opacity-100"
                title="删除字幕"
              >
                <Trash2 size={12} />
              </button>
            </div>
            {editingId === cue.id ? (
              <div className="flex gap-2">
                <input
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  className="flex-1 rounded border border-sc-border bg-sc-bg px-2 py-1 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(cue.id)}
                />
                <button
                  type="button"
                  onClick={() => handleSaveEdit(cue.id)}
                  className="rounded bg-sc-accent px-2 py-1 text-xs text-white"
                >
                  保存
                </button>
              </div>
            ) : (
              <p
                className="cursor-text text-sm hover:text-sc-accent"
                onClick={() => {
                  setEditingId(cue.id);
                  setDraftText(cue.text);
                }}
              >
                {cue.text}
              </p>
            )}
          </div>
        ))}
        {project.subtitles.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-16 text-sm text-sc-muted">
            导入视频后点击「自动识别」，或「手动添加」字幕
          </div>
        )}
      </div>
    </div>
  );
}

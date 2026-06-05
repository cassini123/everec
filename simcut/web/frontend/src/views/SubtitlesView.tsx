import { useState } from "react";
import { Languages, Wand2 } from "lucide-react";
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

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          {!embedded && (
            <>
              <h1 className="flex items-center gap-2 text-lg font-semibold">
                <Languages size={20} />
                多语言自动字幕
              </h1>
              <p className="mt-1 text-sm text-sc-muted">自动识别语音并生成多语言字幕轨道</p>
            </>
          )}
          {embedded && (
            <p className="text-sm text-sc-muted">自动识别语音并生成多语言字幕轨道</p>
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
          <div key={cue.id} className="subtitle-cue rounded-lg bg-sc-panel px-4 py-3">
            <div className="mb-1 font-mono text-[10px] text-sc-muted">
              {formatMs(cue.startMs)} → {formatMs(cue.endMs)} · {cue.language}
            </div>
            <p className="text-sm">{cue.text}</p>
          </div>
        ))}
        {project.subtitles.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-16 text-sm text-sc-muted">
            导入视频后点击「自动识别」生成字幕
          </div>
        )}
      </div>
    </div>
  );
}

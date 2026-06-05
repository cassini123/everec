import { Languages, LayoutTemplate, Type } from "lucide-react";
import type { Project, TextTab } from "../types";
import { FontsView } from "./FontsView";
import { SubtitlesView } from "./SubtitlesView";
import { TextDesignView } from "./TextDesignView";

const TABS: { id: TextTab; label: string; icon: typeof Type }[] = [
  { id: "subtitles", label: "字幕", icon: Languages },
  { id: "fonts", label: "字体", icon: Type },
  { id: "design", label: "文字设计", icon: LayoutTemplate },
];

interface Props {
  project: Project;
  tab: TextTab;
  onTabChange: (tab: TextTab) => void;
  onUpdate: (project: Project) => void | Promise<void>;
}

export function TextView({ project, tab, onTabChange, onUpdate }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-sc-border bg-sc-surface px-6 pt-5">
        <h1 className="text-lg font-semibold">文字</h1>
        <p className="mt-0.5 text-sm text-sc-muted">字幕识别 · 字体样式 · 版式设计</p>
        <nav className="mt-4 flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm transition-colors ${
                tab === id
                  ? "bg-sc-bg text-sc-accent"
                  : "text-sc-muted hover:bg-sc-panel hover:text-sc-text"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {tab === "subtitles" && <SubtitlesView project={project} onUpdate={onUpdate} embedded />}
        {tab === "fonts" && <FontsView embedded />}
        {tab === "design" && <TextDesignView />}
      </div>
    </div>
  );
}

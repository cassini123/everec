import {
  Brain,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  FolderOpen,
  Image,
  Languages,
  LayoutTemplate,
  Palette,
  Sparkles,
  Type,
} from "lucide-react";
import type { TextTab, Workspace } from "../../types";

const NAV: { id: Workspace; label: string; icon: typeof Clapperboard }[] = [
  { id: "projects", label: "项目", icon: FolderOpen },
  { id: "edit", label: "剪辑", icon: Clapperboard },
  { id: "color", label: "色彩", icon: Palette },
  { id: "stills", label: "静帧", icon: Image },
  { id: "effects", label: "特效", icon: Sparkles },
  { id: "ai", label: "AI 解析", icon: Brain },
];

const TEXT_TABS: { id: TextTab; label: string; icon: typeof Type }[] = [
  { id: "subtitles", label: "字幕", icon: Languages },
  { id: "fonts", label: "字体", icon: Type },
  { id: "design", label: "文字设计", icon: LayoutTemplate },
];

interface Props {
  workspace: Workspace;
  textTab: TextTab;
  onChange: (ws: Workspace) => void;
  onTextTabChange: (tab: TextTab) => void;
}

export function Sidebar({ workspace, textTab, onChange, onTextTabChange }: Props) {
  const textExpanded = workspace === "text";

  const openText = (tab: TextTab) => {
    onChange("text");
    onTextTabChange(tab);
  };

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-sc-border bg-sc-surface">
      <div className="border-b border-sc-border px-4 py-4">
        <div className="text-lg font-semibold tracking-tight text-sc-accent">Simcut</div>
        <div className="mt-0.5 text-xs text-sc-muted">轻量剪辑 · 超短篇</div>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {NAV.slice(0, 2).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              workspace === id
                ? "bg-sc-accent/15 text-sc-accent"
                : "text-sc-muted hover:bg-sc-panel hover:text-sc-text"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}

        {/* 文字：含二级分类 */}
        <div>
          <button
            type="button"
            onClick={() => openText(textTab)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              workspace === "text"
                ? "bg-sc-accent/15 text-sc-accent"
                : "text-sc-muted hover:bg-sc-panel hover:text-sc-text"
            }`}
          >
            {textExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Type size={16} />
            文字
          </button>
          {textExpanded && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sc-border pl-2">
              {TEXT_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => openText(id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                    textTab === id
                      ? "bg-sc-accent/10 text-sc-accent"
                      : "text-sc-muted hover:bg-sc-panel hover:text-sc-text"
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {NAV.slice(2).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              workspace === id
                ? "bg-sc-accent/15 text-sc-accent"
                : "text-sc-muted hover:bg-sc-panel hover:text-sc-text"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
      <div className="border-t border-sc-border p-3 text-[10px] leading-relaxed text-sc-muted">
        更清晰的文件管理
        <br />
        更简单的色彩设计
        <br />
        更快捷的结项
      </div>
    </aside>
  );
}

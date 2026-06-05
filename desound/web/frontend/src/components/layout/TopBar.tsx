import { Disc3, FolderOpen, Sparkles, Tag, Waves } from "lucide-react";
import type { Workspace } from "../../types";

const labels: Record<Workspace, string> = {
  projects: "项目 · 文件管理",
  library: "Library · 素材库",
  foley: "Foley · 拟声设计",
  compose: "Compose · 音乐设计/时间轴",
  processing: "Processing · 声音处理",
  design: "Design · AI 声音设计",
};

interface TopBarProps {
  workspace: Workspace;
  projectName?: string;
  projectTags?: string[];
}

export function TopBar({ workspace, projectName, projectTags = [] }: TopBarProps) {
  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-ds-border bg-ds-surface px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Disc3 className="h-5 w-5 text-ds-accent" strokeWidth={2.2} />
          <span className="text-sm font-semibold tracking-wide text-ds-text">
            desound
          </span>
        </div>
        <span className="text-xs text-ds-muted">|</span>
        <span className="text-xs text-ds-muted">{labels[workspace]}</span>
        {projectTags.length > 0 && (
          <div className="ml-2 flex items-center gap-1">
            <Tag className="h-3 w-3 text-ds-accent" />
            {projectTags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded bg-ds-accent/15 px-1.5 py-0.5 text-[10px] text-ds-accent"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 text-xs text-ds-muted">
        <span className="flex items-center gap-1.5">
          <FolderOpen className="h-3.5 w-3.5" />
          {projectName ?? "未选择项目"}
        </span>
        <span className="flex items-center gap-1.5">
          <Waves className="h-3.5 w-3.5 text-ds-green" />
          48 kHz
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-ds-accent" />
          v0.2
        </span>
      </div>
    </header>
  );
}

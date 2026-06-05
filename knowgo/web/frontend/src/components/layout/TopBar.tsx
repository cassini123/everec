import { Key, Plus } from "lucide-react";
import type { KnowgoWorkspace } from "../../types";

const labels: Record<KnowgoWorkspace, string> = {
  brief: "项目 Brief",
  capture: "灵感采集",
  analyze: "灵感分析",
  document: "输出文档",
  style: "风格体系",
  graph: "Project Graph",
};

interface TopBarProps {
  workspace: KnowgoWorkspace;
  projectTitle: string;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onNewProject: () => void;
}

export function TopBar({
  workspace,
  projectTitle,
  apiKey,
  onApiKeyChange,
  onNewProject,
}: TopBarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-kg-border bg-kg-surface px-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-kg-muted">{labels[workspace]}</span>
        <span className="text-kg-border">/</span>
        <span className="truncate text-sm font-semibold">{projectTitle || "未命名项目"}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 sm:flex">
          <Key className="h-3.5 w-3.5 text-kg-muted" />
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="OpenAI Key（可选）"
            className="w-44 rounded border border-kg-border bg-kg-bg px-2 py-1 font-mono text-[11px] outline-none focus:border-kg-accent"
          />
        </div>
        <button
          type="button"
          onClick={onNewProject}
          className="flex items-center gap-1.5 rounded-md bg-kg-accent/15 px-3 py-1.5 text-xs font-medium text-kg-accent hover:bg-kg-accent/25"
        >
          <Plus className="h-3.5 w-3.5" />
          新建项目
        </button>
      </div>
    </header>
  );
}

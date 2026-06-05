import { Clapperboard, FolderKanban, User } from "lucide-react";
import type { PrerectorWorkspace } from "../../types";

const labels: Record<PrerectorWorkspace, string> = {
  dashboard: "Dashboard · 总览",
  tasks: "Tasks · 任务拆解",
  teams: "Teams · 协作小组",
  friends: "Friends · 好友",
  chat: "Chat · 小组群聊",
  sync: "Sync · 文件同步",
  reminders: "Reminders · 时间提醒",
};

interface TopBarProps {
  workspace: PrerectorWorkspace;
  projectName?: string;
  userName?: string;
}

export function TopBar({ workspace, projectName, userName }: TopBarProps) {
  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-pr-border bg-pr-surface px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Clapperboard className="h-5 w-5 text-pr-accent" strokeWidth={2.2} />
          <span className="text-sm font-semibold tracking-wide text-pr-text">prerector</span>
        </div>
        <span className="text-xs text-pr-muted">|</span>
        <span className="text-xs text-pr-muted">{labels[workspace]}</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-pr-muted">
        <span className="flex items-center gap-1.5">
          <FolderKanban className="h-3.5 w-3.5" />
          {projectName ?? "协作项目"}
        </span>
        {userName && (
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-pr-green" />
            {userName}
          </span>
        )}
        <span className="rounded bg-pr-accent/15 px-1.5 py-0.5 text-[10px] text-pr-accent">v0.2</span>
      </div>
    </header>
  );
}

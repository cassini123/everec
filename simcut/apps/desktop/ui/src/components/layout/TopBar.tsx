import { Monitor, Smartphone } from "lucide-react";
import type { Project } from "../../types";
import { api } from "../../lib/api";

interface Props {
  project: Project | null;
}

export function TopBar({ project }: Props) {
  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-sc-border bg-sc-surface px-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {project?.name ?? "未选择项目"}
        </span>
        {project && (
          <span className="rounded bg-sc-panel px-2 py-0.5 text-[10px] text-sc-muted">
            {project.resolution[0]}×{project.resolution[1]} · {project.fps}fps
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-sc-muted">
        <span className="flex items-center gap-1">
          <Monitor size={12} />
          桌面端
        </span>
        <span className="text-sc-border">|</span>
        <span className="flex items-center gap-1">
          <Smartphone size={12} />
          网页端
        </span>
        <span className="rounded-full bg-sc-green/15 px-2 py-0.5 text-[10px] text-sc-green">
          {api.isDesktop() ? "Native" : "Web Preview"}
        </span>
      </div>
    </header>
  );
}

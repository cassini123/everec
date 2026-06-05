import { useEffect, useRef, useState } from "react";
import { ChevronDown, FolderOpen } from "lucide-react";
import type { DesoundProjectSummary } from "@everec/shared";

interface ProjectPickerProps {
  projects: DesoundProjectSummary[];
  activeProjectId: string | null;
  onSelect: (id: string) => void;
  onManage?: () => void;
}

export function ProjectPicker({
  projects,
  activeProjectId,
  onSelect,
  onManage,
}: ProjectPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const active = projects.find((p) => p.id === activeProjectId);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        title="选择归属项目"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-ds-border bg-ds-bg px-2.5 py-1.5 text-xs text-ds-muted transition hover:border-ds-accent hover:text-ds-text"
      >
        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-ds-accent" />
        <span className="max-w-[120px] truncate">
          {active?.name ?? "未选择项目"}
        </span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-[200px] rounded-md border border-ds-border bg-ds-surface py-1 shadow-lg">
          {projects.length === 0 ? (
            <div className="px-3 py-2 text-xs text-ds-muted">暂无项目</div>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelect(p.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-ds-panel ${
                  p.id === activeProjectId ? "text-ds-accent" : "text-ds-text"
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{p.name}</span>
              </button>
            ))
          )}
          {onManage && (
            <>
              <div className="my-1 border-t border-ds-border/60" />
              <button
                type="button"
                onClick={() => {
                  onManage();
                  setOpen(false);
                }}
                className="flex w-full px-3 py-2 text-left text-xs text-ds-muted transition hover:bg-ds-panel hover:text-ds-text"
              >
                管理项目…
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

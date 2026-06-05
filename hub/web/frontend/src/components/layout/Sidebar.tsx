import {
  Brain,
  FolderOpen,
  Grid3x3,
  Home,
  Settings,
} from "lucide-react";
import type { HubWorkspace } from "../../types";

interface Props {
  workspace: HubWorkspace;
  onChange: (ws: HubWorkspace) => void;
}

const NAV: { id: HubWorkspace; label: string; icon: typeof Home }[] = [
  { id: "home", label: "首页", icon: Home },
  { id: "apps", label: "应用", icon: Grid3x3 },
  { id: "projects", label: "项目", icon: FolderOpen },
  { id: "brain", label: "主脑", icon: Brain },
  { id: "settings", label: "设置", icon: Settings },
];

export function Sidebar({ workspace, onChange }: Props) {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-ev-border bg-ev-surface">
      <div className="border-b border-ev-border px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ev-accent to-ev-teal">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold tracking-tight">Everec</p>
            <p className="text-[11px] text-ev-muted">主脑 · Creative OS</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = workspace === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-ev-elevated text-ev-text"
                  : "text-ev-muted hover:bg-ev-panel hover:text-ev-text"
              }`}
            >
              <Icon size={18} className={active ? "text-ev-accent" : ""} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-ev-border p-4">
        <p className="text-[10px] uppercase tracking-wider text-ev-muted">创作闭环</p>
        <p className="mt-1 text-xs leading-relaxed text-ev-muted/80">
          灵感 → 风格 → 剪辑 → 声音 → 交付
        </p>
      </div>
    </aside>
  );
}

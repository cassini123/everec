import {
  Briefcase,
  FolderOpen,
  Mic2,
  Music4,
  Sparkles,
  Waves,
} from "lucide-react";
import type { Workspace } from "../../types";

const projectItem: {
  id: Workspace;
  label: string;
  sub: string;
  icon: typeof Briefcase;
  color: string;
} = {
  id: "projects",
  label: "项目",
  sub: "文件管理",
  icon: Briefcase,
  color: "text-ds-accent",
};

const topItems: {
  id: Workspace;
  label: string;
  sub: string;
  icon: typeof Music4;
  color: string;
}[] = [
  {
    id: "library",
    label: "Library",
    sub: "导入 / 保存",
    icon: FolderOpen,
    color: "text-ds-blue",
  },
  {
    id: "foley",
    label: "Foley",
    sub: "拟声设计",
    icon: Mic2,
    color: "text-ds-green",
  },
];

const productionItems: {
  id: Workspace;
  label: string;
  sub: string;
  icon: typeof Music4;
  color: string;
}[] = [
  {
    id: "compose",
    label: "Compose",
    sub: "音乐设计/时间轴",
    icon: Music4,
    color: "text-ds-accent",
  },
  {
    id: "processing",
    label: "Processing",
    sub: "声音处理",
    icon: Waves,
    color: "text-ds-blue",
  },
];

const bottomItems: {
  id: Workspace;
  label: string;
  sub: string;
  icon: typeof Sparkles;
  color: string;
}[] = [
  {
    id: "design",
    label: "Design",
    sub: "AI 声音设计",
    icon: Sparkles,
    color: "text-ds-purple",
  },
];

interface SidebarProps {
  workspace: Workspace;
  onChange: (ws: Workspace) => void;
}

function NavButton({
  id,
  label,
  sub,
  icon: Icon,
  color,
  active,
  onChange,
  indent,
}: {
  id: Workspace;
  label: string;
  sub: string;
  icon: typeof Music4;
  color: string;
  active: boolean;
  onChange: (ws: Workspace) => void;
  indent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(id)}
      className={`flex w-full items-center gap-3 rounded-md py-2.5 text-left transition-colors ${
        indent ? "px-3 pl-6" : "px-3"
      } ${
        active
          ? "bg-ds-elevated ring-1 ring-ds-accent/40"
          : "hover:bg-ds-panel"
      }`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${active ? color : "text-ds-muted"}`}
        strokeWidth={2}
      />
      <div className="min-w-0">
        <div
          className={`truncate text-sm font-medium ${active ? "text-ds-text" : "text-ds-muted"}`}
        >
          {label}
        </div>
        <div className="truncate text-[11px] text-ds-muted">{sub}</div>
      </div>
    </button>
  );
}

export function Sidebar({ workspace, onChange }: SidebarProps) {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-ds-border bg-ds-surface">
      <div className="px-3 py-3 text-[10px] font-medium uppercase tracking-widest text-ds-muted">
        Workspace
      </div>
      <nav className="flex flex-col gap-1 px-2">
        <NavButton
          {...projectItem}
          active={workspace === projectItem.id}
          onChange={onChange}
        />

        <div className="my-1 border-t border-ds-border/60" />

        {topItems.map((item) => (
          <NavButton
            key={item.id}
            {...item}
            active={workspace === item.id}
            onChange={onChange}
          />
        ))}

        <div className="px-3 pb-1 pt-3 text-[10px] font-medium uppercase tracking-widest text-ds-muted">
          制作
        </div>
        {productionItems.map((item) => (
          <NavButton
            key={item.id}
            {...item}
            active={workspace === item.id}
            onChange={onChange}
            indent
          />
        ))}

        <div className="my-1 border-t border-ds-border/60" />

        {bottomItems.map((item) => (
          <NavButton
            key={item.id}
            {...item}
            active={workspace === item.id}
            onChange={onChange}
          />
        ))}
      </nav>
    </aside>
  );
}

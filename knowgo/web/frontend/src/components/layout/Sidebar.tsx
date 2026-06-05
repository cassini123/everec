import {
  BookOpen,
  Camera,
  FileText,
  Globe,
  Palette,
  Sparkles,
} from "lucide-react";
import type { KnowgoWorkspace } from "../../types";

const items: {
  id: KnowgoWorkspace;
  label: string;
  sub: string;
  icon: typeof BookOpen;
  color: string;
}[] = [
  {
    id: "brief",
    label: "Brief",
    sub: "项目 Brief",
    icon: BookOpen,
    color: "text-kg-blue",
  },
  {
    id: "capture",
    label: "Capture",
    sub: "网址 / 上传",
    icon: Globe,
    color: "text-kg-accent",
  },
  {
    id: "analyze",
    label: "Analyze",
    sub: "灵感分析",
    icon: Sparkles,
    color: "text-kg-purple",
  },
  {
    id: "document",
    label: "Document",
    sub: "可编辑文档",
    icon: FileText,
    color: "text-kg-orange",
  },
  {
    id: "style",
    label: "Style",
    sub: "风格体系",
    icon: Palette,
    color: "text-kg-accent",
  },
];

interface SidebarProps {
  workspace: KnowgoWorkspace;
  onChange: (ws: KnowgoWorkspace) => void;
}

export function Sidebar({ workspace, onChange }: SidebarProps) {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-kg-border bg-kg-surface">
      <div className="flex items-center gap-2 border-b border-kg-border px-4 py-4">
        <Camera className="h-5 w-5 text-kg-accent" />
        <div>
          <div className="text-sm font-semibold tracking-wide">Knowgo</div>
          <div className="text-[10px] text-kg-muted">视觉灵感认知</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = workspace === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                active
                  ? "bg-kg-elevated ring-1 ring-kg-accent/40"
                  : "hover:bg-kg-panel"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? item.color : "text-kg-muted"}`}
              />
              <div className="min-w-0">
                <div
                  className={`truncate text-sm font-medium ${active ? "text-kg-text" : "text-kg-muted"}`}
                >
                  {item.label}
                </div>
                <div className="truncate text-[11px] text-kg-muted">{item.sub}</div>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

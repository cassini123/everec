import {
  Bell,
  CloudUpload,
  LayoutDashboard,
  ListTodo,
  MessageCircle,
  UserPlus,
  Users,
} from "lucide-react";
import type { PrerectorWorkspace } from "../../types";

const navItems: {
  id: PrerectorWorkspace;
  label: string;
  sub: string;
  icon: typeof LayoutDashboard;
  color: string;
  badgeKey?: "friends" | "chat";
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    sub: "项目总览",
    icon: LayoutDashboard,
    color: "text-pr-accent",
  },
  {
    id: "tasks",
    label: "Tasks",
    sub: "任务拆解 / 评估",
    icon: ListTodo,
    color: "text-pr-blue",
  },
  {
    id: "teams",
    label: "Teams",
    sub: "协作小组",
    icon: Users,
    color: "text-pr-green",
  },
  {
    id: "friends",
    label: "Friends",
    sub: "加好友",
    icon: UserPlus,
    color: "text-pr-green",
    badgeKey: "friends",
  },
  {
    id: "chat",
    label: "Chat",
    sub: "小组群聊",
    icon: MessageCircle,
    color: "text-pr-accent",
    badgeKey: "chat",
  },
  {
    id: "sync",
    label: "Sync",
    sub: "文件同步",
    icon: CloudUpload,
    color: "text-pr-orange",
  },
  {
    id: "reminders",
    label: "Reminders",
    sub: "时间提醒",
    icon: Bell,
    color: "text-pr-red",
  },
];

interface SidebarProps {
  workspace: PrerectorWorkspace;
  onChange: (ws: PrerectorWorkspace) => void;
  badges?: { friends?: number; chat?: number };
}

export function Sidebar({ workspace, onChange, badges }: SidebarProps) {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-pr-border bg-pr-surface">
      <div className="px-3 py-3 text-[10px] font-medium uppercase tracking-widest text-pr-muted">
        协作制片
      </div>
      <nav className="flex flex-col gap-1 px-2 pb-3">
        {navItems.map((item) => {
          const active = workspace === item.id;
          const Icon = item.icon;
          const badge = item.badgeKey ? badges?.[item.badgeKey] : 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                active ? "bg-pr-elevated ring-1 ring-pr-accent/40" : "hover:bg-pr-panel"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? item.color : "text-pr-muted"}`}
                strokeWidth={2}
              />
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate text-sm font-medium ${active ? "text-pr-text" : "text-pr-muted"}`}
                >
                  {item.label}
                </div>
                <div className="truncate text-[11px] text-pr-muted">{item.sub}</div>
              </div>
              {badge ? (
                <span className="rounded-full bg-pr-red px-1.5 py-0.5 text-[10px] text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

import {
  Bell,
  CheckCircle2,
  Clock,
  CloudUpload,
  ListTodo,
  Loader2,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import type { DashboardStats, PrerectorProject } from "@everec/shared";
import { PROJECT_TYPE_LABELS, formatDue } from "../lib/api";

interface DashboardViewProps {
  stats: DashboardStats | null;
  projects: PrerectorProject[];
  loading: boolean;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof ListTodo;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-pr-border bg-pr-panel p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-pr-muted">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="text-2xl font-semibold text-pr-text">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-pr-muted">{sub}</div>}
    </div>
  );
}

export function DashboardView({ stats, projects, loading }: DashboardViewProps) {
  if (loading || !stats) {
    return (
      <div className="flex flex-1 items-center justify-center text-pr-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        加载协作数据…
      </div>
    );
  }

  const progress =
    stats.totalTasks > 0 ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
      <div>
        <h1 className="text-lg font-semibold text-pr-text">协作制片总览</h1>
        <p className="mt-1 text-sm text-pr-muted">
          视频、设计、开发、小组作业等多类型项目 — 好友协作与群聊
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="任务进度"
          value={`${progress}%`}
          sub={`${stats.doneTasks}/${stats.totalTasks} 完成`}
          icon={CheckCircle2}
          color="text-pr-green"
        />
        <StatCard
          label="好友"
          value={stats.friendCount}
          sub={
            stats.pendingFriendRequests > 0
              ? `${stats.pendingFriendRequests} 条待处理请求`
              : "协作伙伴"
          }
          icon={UserPlus}
          color="text-pr-green"
        />
        <StatCard
          label="群聊未读"
          value={stats.unreadChatCount}
          sub="小组消息"
          icon={MessageCircle}
          color="text-pr-accent"
        />
        <StatCard
          label="预估工时"
          value={`${stats.totalEstimatedHours}h`}
          sub="全项目合计"
          icon={Clock}
          color="text-pr-orange"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="进行中"
          value={stats.inProgressTasks}
          sub="当前活跃任务"
          icon={ListTodo}
          color="text-pr-blue"
        />
        <StatCard
          label="同步会话"
          value={stats.activeSyncSessions}
          sub="文件传输中"
          icon={CloudUpload}
          color="text-pr-accent"
        />
        <StatCard
          label="近期提醒"
          value={stats.upcomingReminders.length}
          sub="待关注"
          icon={Bell}
          color="text-pr-red"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-pr-border bg-pr-panel p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-pr-text">
            <Bell className="h-4 w-4 text-pr-red" />
            近期提醒
          </h2>
          {stats.upcomingReminders.length === 0 ? (
            <p className="text-sm text-pr-muted">暂无待处理提醒</p>
          ) : (
            <ul className="space-y-2">
              {stats.upcomingReminders.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between rounded-md bg-pr-elevated px-3 py-2"
                >
                  <div>
                    <div className="text-sm text-pr-text">{r.title}</div>
                    <div className="text-[11px] text-pr-muted">{r.message}</div>
                  </div>
                  <span className="shrink-0 text-[11px] text-pr-orange">
                    {formatDue(r.dueAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-pr-border bg-pr-panel p-4">
          <h2 className="mb-3 text-sm font-medium text-pr-text">活跃项目</h2>
          {projects.length === 0 ? (
            <p className="text-sm text-pr-muted">在「Tasks」中创建 Brief 自动拆解项目</p>
          ) : (
            <ul className="space-y-2">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="rounded-md bg-pr-elevated px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-pr-text">{p.name}</div>
                    <span className="rounded bg-pr-accent/15 px-1.5 py-0.5 text-[10px] text-pr-accent">
                      {PROJECT_TYPE_LABELS[p.projectType ?? "general"]}
                    </span>
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-[11px] text-pr-muted">
                    {p.brief}
                  </div>
                  <div className="mt-1 text-[10px] text-pr-muted">
                    规模 {p.scope ?? p.videoDurationMin ?? "—"} {p.scopeUnit ?? "min"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

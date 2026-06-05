import { useState } from "react";
import { Bell, BellOff, Loader2, Plus } from "lucide-react";
import type { PrerectorProject, Reminder } from "@everec/shared";
import { api, formatDue } from "../lib/api";

interface RemindersViewProps {
  projects: PrerectorProject[];
  reminders: Reminder[];
  onRefresh: () => Promise<void>;
}

export function RemindersView({ projects, reminders, onRefresh }: RemindersViewProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!title.trim() || !dueAt || !projectId) return;
    setLoading(true);
    try {
      await api.createReminder({ projectId, title, message, dueAt: new Date(dueAt).toISOString() });
      setTitle("");
      setMessage("");
      setDueAt("");
      await onRefresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDismiss(id: string) {
    await api.dismissReminder(id);
    await onRefresh();
  }

  const pending = reminders.filter((r) => !r.notified);
  const done = reminders.filter((r) => r.notified);

  return (
    <div className="flex flex-1 flex-col overflow-auto p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-pr-text">
          <Bell className="h-5 w-5 text-pr-red" />
          时间提醒
        </h1>
        <p className="mt-1 text-sm text-pr-muted">
          任务截止、审片节点与交付里程碑自动提醒
        </p>
      </div>

      <div className="mb-8 rounded-lg border border-pr-border bg-pr-panel p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-pr-text">
          <Plus className="h-4 w-4 text-pr-accent" />
          新建提醒
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="提醒标题"
            className="rounded border border-pr-border bg-pr-elevated px-3 py-2 text-sm text-pr-text"
          />
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded border border-pr-border bg-pr-elevated px-3 py-2 text-sm text-pr-text"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="rounded border border-pr-border bg-pr-elevated px-3 py-2 text-sm text-pr-text"
          />
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="提醒内容（可选）"
            className="rounded border border-pr-border bg-pr-elevated px-3 py-2 text-sm text-pr-text"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={loading || !title.trim() || !dueAt}
          className="mt-3 flex items-center gap-2 rounded bg-pr-red px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          添加提醒
        </button>
      </div>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-pr-text">待处理 ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-pr-muted">暂无待处理提醒</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((r) => {
              const isOverdue = new Date(r.dueAt).getTime() < Date.now();
              return (
                <li
                  key={r.id}
                  className={`flex items-center gap-4 rounded-lg border px-4 py-3 ${
                    isOverdue
                      ? "border-pr-red/40 bg-pr-red/5"
                      : "border-pr-border bg-pr-panel"
                  }`}
                >
                  <Bell className={`h-4 w-4 shrink-0 ${isOverdue ? "text-pr-red" : "text-pr-orange"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-pr-text">{r.title}</div>
                    {r.message && (
                      <div className="text-[11px] text-pr-muted">{r.message}</div>
                    )}
                  </div>
                  <span className={`text-xs ${isOverdue ? "text-pr-red" : "text-pr-orange"}`}>
                    {formatDue(r.dueAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDismiss(r.id)}
                    className="flex items-center gap-1 rounded border border-pr-border px-2 py-1 text-[11px] text-pr-muted hover:bg-pr-elevated"
                  >
                    <BellOff className="h-3 w-3" />
                    已读
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-pr-muted">已处理</h2>
          <ul className="space-y-1">
            {done.slice(0, 5).map((r) => (
              <li key={r.id} className="text-xs text-pr-muted line-through">
                {r.title}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

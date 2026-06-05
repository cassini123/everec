import { useState } from "react";
import { Loader2, Sparkles, User } from "lucide-react";
import type { PrerectorProject, PrerectorTask, Team } from "@everec/shared";
import { ROLE_LABELS, STATUS_LABELS, api } from "../lib/api";

interface TasksViewProps {
  projects: PrerectorProject[];
  tasks: PrerectorTask[];
  teams: Team[];
  activeProjectId: string | null;
  onProjectChange: (id: string | null) => void;
  onRefresh: () => Promise<void>;
}

function DifficultyBadge({ level }: { level: number }) {
  return (
    <span className={`text-xs font-medium difficulty-${level}`}>
      {"★".repeat(level)}
      <span className="text-pr-muted">{"☆".repeat(5 - level)}</span>
    </span>
  );
}

export function TasksView({
  projects,
  tasks,
  teams,
  activeProjectId,
  onProjectChange,
  onRefresh,
}: TasksViewProps) {
  const [brief, setBrief] = useState("");
  const [durationMin, setDurationMin] = useState(5);
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtered = activeProjectId
    ? tasks.filter((t) => t.projectId === activeProjectId)
    : tasks;

  const memberMap = new Map<string, { name: string; color: string }>();
  for (const team of teams) {
    for (const m of team.members) {
      memberMap.set(m.id, { name: m.name, color: m.color });
    }
  }

  async function handleDecompose() {
    if (!brief.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.decompose({
        brief,
        videoDurationMin: durationMin,
        teamId: teamId || undefined,
      });
      onProjectChange(result.project.id);
      setBrief("");
      await onRefresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(taskId: string, status: PrerectorTask["status"]) {
    await api.updateTaskStatus(taskId, status);
    await onRefresh();
  }

  const phases = [...new Set(filtered.map((t) => t.phase))];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-pr-border bg-pr-panel p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-pr-text">
          <Sparkles className="h-4 w-4 text-pr-accent" />
          自动拆解任务
        </h2>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="输入项目 Brief，例如：60 秒产品宣传片 · 赛博朋克风格 · 需调色与字幕"
          className="mb-3 w-full resize-none rounded-md border border-pr-border bg-pr-elevated px-3 py-2 text-sm text-pr-text placeholder:text-pr-muted focus:outline-none focus:ring-1 focus:ring-pr-accent"
          rows={3}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-pr-muted">
            视频时长 (min)
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              className="w-20 rounded border border-pr-border bg-pr-elevated px-2 py-1 text-sm text-pr-text"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-pr-muted">
            分配小组
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="rounded border border-pr-border bg-pr-elevated px-2 py-1 text-sm text-pr-text"
            >
              <option value="">自动分配</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleDecompose}
            disabled={loading || !brief.trim()}
            className="ml-auto flex items-center gap-2 rounded-md bg-pr-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            拆解并分配
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-pr-red">{error}</p>}
      </div>

      <div className="flex items-center gap-2 border-b border-pr-border px-4 py-2">
        <span className="text-xs text-pr-muted">项目筛选</span>
        <button
          type="button"
          onClick={() => onProjectChange(null)}
          className={`rounded px-2 py-1 text-xs ${!activeProjectId ? "bg-pr-accent/20 text-pr-accent" : "text-pr-muted hover:bg-pr-panel"}`}
        >
          全部
        </button>
        {projects.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onProjectChange(p.id)}
            className={`rounded px-2 py-1 text-xs ${activeProjectId === p.id ? "bg-pr-accent/20 text-pr-accent" : "text-pr-muted hover:bg-pr-panel"}`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-pr-muted">输入 Brief 开始自动拆解</p>
        ) : (
          phases.map((phase) => (
            <section key={phase} className="mb-6">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-pr-muted">
                {phase}
              </h3>
              <div className="space-y-2">
                {filtered
                  .filter((t) => t.phase === phase)
                  .map((task) => {
                    const assignee = task.assigneeId
                      ? memberMap.get(task.assigneeId)
                      : undefined;
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-4 rounded-lg border border-pr-border bg-pr-panel px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-pr-text">{task.title}</div>
                          <div className="text-[11px] text-pr-muted">{task.description}</div>
                        </div>
                        <DifficultyBadge level={task.difficulty} />
                        <span className="w-16 text-right text-xs text-pr-orange">
                          {task.estimatedHours}h
                        </span>
                        {assignee ? (
                          <span
                            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
                            style={{ backgroundColor: `${assignee.color}22`, color: assignee.color }}
                          >
                            <User className="h-3 w-3" />
                            {assignee.name}
                          </span>
                        ) : (
                          <span className="text-[11px] text-pr-muted">未分配</span>
                        )}
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(task.id, e.target.value as PrerectorTask["status"])
                          }
                          className="rounded border border-pr-border bg-pr-elevated px-2 py-1 text-xs text-pr-text"
                        >
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

export { ROLE_LABELS };

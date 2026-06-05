import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, User } from "lucide-react";
import type { PrerectorProject, PrerectorTask, ProjectType, Team, AssessTaskResult } from "@everec/shared";
import {
  DIFFICULTY_LABELS,
  PROJECT_TYPE_LABELS,
  ROLE_LABELS,
  SCOPE_LABELS,
  STATUS_LABELS,
  api,
} from "../lib/api";

interface TasksViewProps {
  projects: PrerectorProject[];
  tasks: PrerectorTask[];
  teams: Team[];
  activeProjectId: string | null;
  onProjectChange: (id: string | null) => void;
  onRefresh: () => Promise<void>;
}

const PROJECT_TYPES = Object.keys(PROJECT_TYPE_LABELS) as ProjectType[];

function DifficultyBadge({ level }: { level: number }) {
  return (
    <span className={`text-xs font-medium difficulty-${level}`} title={DIFFICULTY_LABELS[level as 1 | 2 | 3 | 4 | 5]}>
      {"★".repeat(level)}
      <span className="text-pr-muted">{"☆".repeat(5 - level)}</span>
    </span>
  );
}

function scopeMeta(projectType: ProjectType) {
  if (projectType === "auto") return SCOPE_LABELS.general;
  return SCOPE_LABELS[projectType];
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
  const [taskInput, setTaskInput] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("auto");
  const [scope, setScope] = useState(SCOPE_LABELS.general.default);
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previews, setPreviews] = useState<AssessTaskResult[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const scopeInfo = useMemo(() => scopeMeta(projectType), [projectType]);

  useEffect(() => {
    setScope(scopeInfo.default);
  }, [scopeInfo.default]);

  const taskLines = useMemo(
    () =>
      taskInput
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [taskInput],
  );

  useEffect(() => {
    if (taskLines.length === 0) {
      setPreviews([]);
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const results = await Promise.all(
          taskLines.map((line) => {
            const cleaned = line.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "");
            const [title] = cleaned.split("|").map((s) => s.trim());
            return api.assessTask({
              title: title || cleaned,
              brief,
              projectType,
              scope,
            });
          }),
        );
        setPreviews(results);
      } catch {
        setPreviews([]);
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [taskLines, brief, projectType, scope]);

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
    if (!brief.trim() && taskLines.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.decompose({
        brief: brief.trim() || "自定义项目",
        projectType,
        scope,
        taskInput: taskInput.trim() || undefined,
        teamId: teamId || undefined,
      });
      onProjectChange(result.project.id);
      setBrief("");
      setTaskInput("");
      setPreviews([]);
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
  const canSubmit = brief.trim() || taskLines.length > 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-pr-border bg-pr-panel p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-pr-text">
          <Sparkles className="h-4 w-4 text-pr-accent" />
          项目任务输入与拆解
        </h2>

        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] text-pr-muted">项目 Brief</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="描述项目目标，例如：电商 App 改版 / 播客片头制作 / 618 营销活动"
              className="w-full resize-none rounded-md border border-pr-border bg-pr-elevated px-3 py-2 text-sm text-pr-text placeholder:text-pr-muted focus:outline-none focus:ring-1 focus:ring-pr-accent"
              rows={2}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-pr-muted">
              自定义任务（每行一项，可选）
            </label>
            <textarea
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder={"- 用户调研\n- 首页 UI 设计 | 含 dark mode\n1. 后端 API 开发"}
              className="w-full resize-none rounded-md border border-pr-border bg-pr-elevated px-3 py-2 font-mono text-sm text-pr-text placeholder:text-pr-muted focus:outline-none focus:ring-1 focus:ring-pr-accent"
              rows={2}
            />
          </div>
        </div>

        {taskLines.length > 0 && (
          <div className="mb-3 rounded-md border border-pr-border/60 bg-pr-elevated/50 px-3 py-2">
            <div className="mb-1 flex items-center gap-2 text-[11px] text-pr-muted">
              难度评估预览
              {previewLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
            <ul className="space-y-1">
              {taskLines.map((line, i) => {
                const preview = previews[i];
                const cleaned = line.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "");
                const title = cleaned.split("|")[0]?.trim() ?? cleaned;
                return (
                  <li key={i} className="flex items-center gap-3 text-xs">
                    <span className="min-w-0 flex-1 truncate text-pr-text">{title}</span>
                    {preview ? (
                      <>
                        <DifficultyBadge level={preview.difficulty} />
                        <span className="text-pr-orange">{preview.estimatedHours}h</span>
                        <span className="text-pr-muted">{preview.difficultyLabel}</span>
                      </>
                    ) : (
                      <span className="text-pr-muted">评估中…</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-pr-muted">
            项目类型
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as ProjectType)}
              className="rounded border border-pr-border bg-pr-elevated px-2 py-1 text-sm text-pr-text"
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROJECT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-pr-muted">
            {scopeInfo.label}
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={scope}
              onChange={(e) => setScope(Number(e.target.value))}
              className="w-20 rounded border border-pr-border bg-pr-elevated px-2 py-1 text-sm text-pr-text"
            />
            <span>{scopeInfo.unit}</span>
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
            disabled={loading || !canSubmit}
            className="ml-auto flex items-center gap-2 rounded-md bg-pr-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {taskLines.length > 0 ? "评估并创建" : "拆解并分配"}
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
          <p className="text-center text-sm text-pr-muted">
            输入 Brief 或自定义任务列表，系统将自动评估难度与工时
          </p>
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

import { ExternalLink, Plus } from "lucide-react";
import { useState } from "react";
import { EVEREC_APPS, getAppById, launchApp } from "../lib/apps";
import { AppIcon, getAppAccent } from "../lib/appIcons";
import {
  APP_LABELS,
  formatRelativeTime,
  loadRecentProjects,
  saveRecentProject,
} from "../lib/recentProjects";
import type { EverecAppId, EverecProject } from "../types";

export function ProjectsView() {
  const [projects, setProjects] = useState(loadRecentProjects);
  const [title, setTitle] = useState("");
  const [appId, setAppId] = useState<EverecAppId>("knowgo");

  const handleCreate = () => {
    if (!title.trim()) return;
    const project: EverecProject = {
      id: `hub-${Date.now()}`,
      title: title.trim(),
      appId,
      updatedAt: new Date().toISOString(),
      status: "draft",
    };
    saveRecentProject(project);
    setProjects(loadRecentProjects());
    setTitle("");
    const app = getAppById(appId);
    if (app) launchApp(app);
  };

  const grouped = EVEREC_APPS.filter((a) => a.status !== "coming_soon").map(
    (app) => ({
      app,
      projects: projects.filter((p) => p.appId === app.id),
    }),
  );

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
      <div>
        <h2 className="font-display text-lg font-semibold">统筹项目</h2>
        <p className="mt-1 text-sm text-ev-muted">
          跨应用查看与管理项目 — 未来将接入 Project Graph 统一索引
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-ev-border bg-ev-panel p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="新建项目名称…"
          className="min-w-[200px] flex-1 rounded-lg border border-ev-border bg-ev-elevated px-4 py-2 text-sm outline-none focus:border-ev-accent"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <select
          value={appId}
          onChange={(e) => setAppId(e.target.value as EverecAppId)}
          className="rounded-lg border border-ev-border bg-ev-elevated px-3 py-2 text-sm outline-none"
        >
          {EVEREC_APPS.filter((a) => a.status !== "coming_soon").map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-ev-accent px-4 py-2 text-sm font-medium text-white hover:bg-ev-accent-dim"
        >
          <Plus size={16} />
          创建并打开
        </button>
      </div>

      {grouped.map(({ app, projects: appProjects }) => (
        <section key={app.id}>
          <div className="mb-3 flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-ev-elevated"
              style={{ color: app.glowColor }}
            >
              <AppIcon icon={app.icon} size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{app.name}</h3>
              <p className="text-xs text-ev-muted">{appProjects.length} 个项目</p>
            </div>
          </div>

          {appProjects.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ev-border px-4 py-6 text-center text-sm text-ev-muted">
              暂无 {app.name} 项目
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {appProjects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => launchApp(app)}
                  className="group flex flex-col rounded-xl border border-ev-border bg-ev-panel p-4 text-left transition-colors hover:border-ev-accent/30"
                >
                  <div className="flex items-start justify-between">
                    <p className="font-medium">{p.title}</p>
                    <ExternalLink
                      size={14}
                      className="text-ev-muted opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </div>
                  <p className="mt-2 text-xs text-ev-muted">
                    <span className={getAppAccent(p.appId)}>
                      {APP_LABELS[p.appId]}
                    </span>
                    {" · 更新于 "}
                    {formatRelativeTime(p.updatedAt)}
                  </p>
                  {p.status && (
                    <span
                      className={`mt-3 self-start rounded px-2 py-0.5 text-[10px] ${
                        p.status === "active"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : p.status === "draft"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-ev-elevated text-ev-muted"
                      }`}
                    >
                      {p.status === "active" ? "进行中" : p.status === "draft" ? "草稿" : "已归档"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

import { ArrowRight, Zap } from "lucide-react";
import { AppCard } from "../components/AppCard";
import { PipelineBar } from "../components/PipelineBar";
import { EVEREC_APPS, getAppById, launchApp } from "../lib/apps";
import { getAppAccent, AppIcon } from "../lib/appIcons";
import { APP_LABELS, formatRelativeTime, loadRecentProjects } from "../lib/recentProjects";

export function HomeView() {
  const recent = loadRecentProjects().slice(0, 5);
  const readyApps = EVEREC_APPS.filter((a) => a.status !== "coming_soon");

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-ev-border bg-gradient-to-br from-ev-accent/10 via-ev-panel to-ev-teal/5 p-8">
        <div className="relative z-10 max-w-xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-ev-accent/30 bg-ev-accent/10 px-3 py-1 text-xs text-ev-accent">
            <Zap size={12} />
            Creative OS 主脑
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            统筹你的全部创作项目
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ev-muted">
            类似 Adobe Creative Cloud，Everec 主脑连接 Knowgo、Simcut、desound 等全部应用。
            从灵感采集到成片交付，Project Graph 贯穿始终。
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => launchApp(EVEREC_APPS[0])}
              className="flex items-center gap-2 rounded-lg bg-ev-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ev-accent-dim"
            >
              开始创作
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => launchApp(EVEREC_APPS[1])}
              className="rounded-lg border border-ev-border bg-ev-elevated px-4 py-2 text-sm text-ev-muted transition-colors hover:text-ev-text"
            >
              打开 Simcut
            </button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-ev-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-ev-teal/10 blur-2xl" />
      </section>

      <PipelineBar />

      {/* App grid */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold">你的应用</h2>
          <span className="text-xs text-ev-muted">
            {readyApps.length} 个可用 · {EVEREC_APPS.length - readyApps.length} 个即将推出
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {EVEREC_APPS.map((app) => (
            <AppCard key={app.id} app={app} compact />
          ))}
        </div>
      </section>

      {/* Recent projects */}
      <section>
        <h2 className="mb-4 font-display text-sm font-semibold">最近项目</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {recent.map((project) => {
            const app = getAppById(project.appId);
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => app && launchApp(app)}
                className="flex items-center gap-4 rounded-xl border border-ev-border bg-ev-panel p-4 text-left transition-colors hover:border-ev-accent/30"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ev-elevated"
                  style={{ color: app?.glowColor }}
                >
                  {app && <AppIcon icon={app.icon} size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{project.title}</p>
                  <p className="mt-0.5 text-xs text-ev-muted">
                    <span className={getAppAccent(project.appId)}>
                      {APP_LABELS[project.appId]}
                    </span>
                    {" · "}
                    {formatRelativeTime(project.updatedAt)}
                  </p>
                </div>
                {project.status === "draft" && (
                  <span className="shrink-0 rounded bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-400">
                    草稿
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

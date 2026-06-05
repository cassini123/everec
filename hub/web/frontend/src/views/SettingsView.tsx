import { EVEREC_APPS } from "../lib/apps";

export function SettingsView() {
  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
      <div>
        <h2 className="font-display text-lg font-semibold">设置</h2>
        <p className="mt-1 text-sm text-ev-muted">主脑与应用连接配置</p>
      </div>

      <section className="rounded-xl border border-ev-border bg-ev-panel p-5">
        <h3 className="text-sm font-semibold">本地开发地址</h3>
        <p className="mt-1 mb-4 text-xs text-ev-muted">
          各应用独立运行时的默认端口（通过主脑一键跳转）
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-ev-elevated px-4 py-3">
            <span className="text-sm">Everec 主脑</span>
            <code className="text-xs text-ev-teal">http://localhost:1400</code>
          </div>
          {EVEREC_APPS.filter((a) => a.status !== "coming_soon").map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between rounded-lg bg-ev-elevated px-4 py-3"
            >
              <span className="text-sm">{app.name}</span>
              <code className="text-xs text-ev-muted">{app.devUrl}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-ev-border bg-ev-panel p-5">
        <h3 className="text-sm font-semibold">启动命令</h3>
        <div className="mt-3 space-y-2 font-mono text-xs text-ev-muted">
          <p>
            <span className="text-ev-teal">npm run dev:hub</span> — 主脑
          </p>
          <p>
            <span className="text-ev-teal">npm run dev:knowgo</span> — Knowgo
          </p>
          <p>
            <span className="text-ev-teal">npm run dev:simcut</span> — Simcut
          </p>
          <p>
            <span className="text-ev-teal">npm run dev:web</span> — desound
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-ev-border bg-ev-panel p-5">
        <h3 className="text-sm font-semibold">关于</h3>
        <p className="mt-2 text-sm text-ev-muted">
          Everec 每刻 — 创作者认知增强系统。主脑 v0.1 统筹 Knowgo、Simcut、desound，
          对标 Adobe Creative Cloud 的应用启动器体验。
        </p>
      </section>
    </div>
  );
}

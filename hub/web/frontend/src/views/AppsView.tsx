import { AppCard } from "../components/AppCard";
import { EVEREC_APPS } from "../lib/apps";

export function AppsView() {
  const ready = EVEREC_APPS.filter((a) => a.status !== "coming_soon");
  const upcoming = EVEREC_APPS.filter((a) => a.status === "coming_soon");

  return (
    <div className="flex flex-1 flex-col gap-8 overflow-auto p-6">
      <section>
        <h2 className="mb-1 font-display text-lg font-semibold">已安装应用</h2>
        <p className="mb-5 text-sm text-ev-muted">
          点击卡片在新标签页中打开对应应用
        </p>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {ready.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      </section>

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-1 font-display text-lg font-semibold">路线图</h2>
          <p className="mb-5 text-sm text-ev-muted">
            按 PRD 规划中的模块，将逐步接入主脑
          </p>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {upcoming.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

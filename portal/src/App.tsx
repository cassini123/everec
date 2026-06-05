import { useCallback, useEffect, useState } from "react";
import {
  Clapperboard,
  Home,
  Layers,
  Music2,
  Sparkles,
  Users,
} from "lucide-react";

type AppId = "home" | "simcut" | "desound" | "knowgo" | "prerector";

interface NavItem {
  id: AppId;
  label: string;
  subtitle: string;
  icon: typeof Home;
  color: string;
  href?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Everec 总览",
    subtitle: "Creative OS 入口",
    icon: Home,
    color: "var(--color-ev-accent)",
  },
  {
    id: "simcut",
    label: "Simcut",
    subtitle: "轻量视频剪辑",
    icon: Clapperboard,
    color: "var(--color-ev-simcut)",
    href: "/apps/simcut/",
  },
  {
    id: "desound",
    label: "Desound",
    subtitle: "音频 / 音效创作",
    icon: Music2,
    color: "var(--color-ev-desound)",
    href: "/apps/desound/",
  },
  {
    id: "knowgo",
    label: "Knowgo",
    subtitle: "视觉灵感 · Project Graph",
    icon: Sparkles,
    color: "var(--color-ev-knowgo)",
    href: "/apps/knowgo/",
  },
  {
    id: "prerector",
    label: "Prerector",
    subtitle: "协作制片 · 任务 / 群聊",
    icon: Users,
    color: "var(--color-ev-prerector)",
    href: "/apps/prerector/",
  },
];

function pathToApp(pathname: string): AppId {
  if (pathname.startsWith("/simcut")) return "simcut";
  if (pathname.startsWith("/desound")) return "desound";
  if (pathname.startsWith("/knowgo")) return "knowgo";
  if (pathname.startsWith("/prerector")) return "prerector";
  return "home";
}

function appToPath(app: AppId): string {
  if (app === "home") return "/";
  return `/${app}`;
}

export default function App() {
  const [active, setActive] = useState<AppId>(() =>
    pathToApp(window.location.pathname),
  );

  const navigate = useCallback((app: AppId) => {
    const path = appToPath(app);
    window.history.pushState({ app }, "", path);
    setActive(app);
  }, []);

  useEffect(() => {
    const onPopState = () => setActive(pathToApp(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const current = NAV_ITEMS.find((item) => item.id === active)!;

  return (
    <div className="flex h-full overflow-hidden bg-ev-bg">
      <aside className="flex w-64 shrink-0 flex-col border-r border-ev-border bg-ev-surface">
        <div className="border-b border-ev-border px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ev-accent/15">
              <Layers className="h-5 w-5 text-ev-accent" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide">Everec 每刻</div>
              <div className="text-xs text-ev-muted">创作者认知增强系统</div>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <div className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-ev-muted">
            产品目录
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const selected = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                  selected
                    ? "bg-ev-panel ring-1 ring-ev-border"
                    : "hover:bg-ev-panel/60"
                }`}
              >
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: selected ? `${item.color}22` : "transparent",
                    color: item.color,
                  }}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-sm font-medium ${selected ? "text-ev-text" : "text-ev-text/90"}`}
                  >
                    {item.label}
                  </div>
                  <div className="truncate text-xs text-ev-muted">{item.subtitle}</div>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-ev-border px-5 py-4 text-[11px] text-ev-muted">
          Vercel 统一部署 · Web 端
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        {active === "home" ? (
          <HomeView onNavigate={navigate} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-ev-border bg-ev-surface/80 px-4 py-2.5 text-sm">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: current.color }}
              />
              <span className="font-medium">{current.label}</span>
              <span className="text-ev-muted">·</span>
              <span className="text-ev-muted">{current.subtitle}</span>
            </div>
            <iframe
              key={active}
              title={current.label}
              src={current.href}
              className="min-h-0 flex-1 border-0 bg-black"
              allow="clipboard-read; clipboard-write"
            />
          </div>
        )}
      </main>
    </div>
  );
}

function HomeView({ onNavigate }: { onNavigate: (app: AppId) => void }) {
  const apps = NAV_ITEMS.filter((item) => item.id !== "home");

  return (
    <div className="flex flex-1 flex-col overflow-auto p-8">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-3xl font-semibold tracking-tight">Everec Creative OS</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ev-muted">
          Simcut、Desound、Knowgo、Prerector 四个产品 Web 端已合并为统一入口。请从左侧目录选择产品，或点击下方卡片进入。
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {apps.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className="group rounded-2xl border border-ev-border bg-ev-surface p-6 text-left transition hover:border-ev-muted/40 hover:bg-ev-panel"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${item.color}18`, color: item.color }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-lg font-medium">{item.label}</div>
                <div className="mt-1 text-sm text-ev-muted">{item.subtitle}</div>
                <div
                  className="mt-4 text-sm font-medium opacity-0 transition group-hover:opacity-100"
                  style={{ color: item.color }}
                >
                  进入 Web 端 →
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-ev-border bg-ev-surface/50 p-6">
          <h2 className="text-sm font-medium text-ev-muted">部署说明</h2>
          <ul className="mt-3 space-y-2 text-sm text-ev-muted">
            <li>· 四个产品共享同一 Vercel 域名，Root Directory 设为仓库根 <code className="text-ev-text">/</code></li>
            <li>· Desound API：<code className="text-ev-text">/api/*</code></li>
            <li>· Knowgo API：<code className="text-ev-text">/api/knowgo/*</code></li>
            <li>· Prerector API：<code className="text-ev-text">/api/prerector/*</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

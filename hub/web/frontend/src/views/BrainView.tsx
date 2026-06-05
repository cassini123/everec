import {
  ArrowRight,
  Database,
  GitBranch,
  Layers,
  Network,
  Share2,
} from "lucide-react";
import { launchApp, EVEREC_APPS } from "../lib/apps";

const GRAPH_STATS = [
  { label: "节点类型", value: "13", desc: "Project → Brief → Shot → Style…" },
  { label: "关系类型", value: "10", desc: "belongs_to, evidences, implements…" },
  { label: "风格种子", value: "200+", desc: "Style Dataset 初始节点" },
];

const BRAIN_FEATURES = [
  {
    icon: Network,
    title: "Project Graph",
    desc: "统一知识图谱 — 灵感、风格、镜头、实现全部可追溯",
    app: "knowgo",
  },
  {
    icon: Layers,
    title: "Style Dataset",
    desc: "跨项目复用审美语言 — LUT、字体、镜头语言体系",
    app: "knowgo",
  },
  {
    icon: GitBranch,
    title: "跨应用链接",
    desc: "Knowgo 分析 → Simcut 剪辑 → desound 配乐，图谱贯穿",
    app: "simcut",
  },
  {
    icon: Share2,
    title: "云同步 (Phase 3+)",
    desc: "embedding 跨设备、图谱备份、AI offload — 本地优先",
    app: "knowgo",
  },
];

export function BrainView() {
  const knowgo = EVEREC_APPS.find((a) => a.id === "knowgo")!;

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
      <section className="relative overflow-hidden rounded-2xl border border-ev-border bg-ev-panel p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ev-teal/20 to-ev-accent/20">
              <Database size={32} className="brain-pulse text-ev-teal" />
            </div>
            <h2 className="font-display text-xl font-bold">Everec 主脑</h2>
            <p className="mt-2 text-sm leading-relaxed text-ev-muted">
              主脑不是单独的 UI 壳，而是 <strong className="text-ev-text">Project Graph + Style Dataset</strong> 构成的创作认知层。
              所有应用共享同一套 schema，灵感与剪辑决策绑在同一图谱上。
            </p>
            <button
              type="button"
              onClick={() => launchApp(knowgo)}
              className="mt-5 flex items-center gap-2 rounded-lg bg-ev-teal/15 px-4 py-2 text-sm font-medium text-ev-teal transition-colors hover:bg-ev-teal/25"
            >
              打开 Project Graph
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {GRAPH_STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-ev-border bg-ev-elevated p-4 text-center"
              >
                <p className="font-display text-2xl font-bold text-ev-accent">
                  {s.value}
                </p>
                <p className="mt-1 text-xs font-medium">{s.label}</p>
                <p className="mt-1 text-[10px] text-ev-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-4 font-display text-sm font-semibold">认知层能力</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {BRAIN_FEATURES.map((f) => {
            const app = EVEREC_APPS.find((a) => a.id === f.app)!;
            const Icon = f.icon;
            return (
              <button
                key={f.title}
                type="button"
                onClick={() => launchApp(app)}
                className="group flex gap-4 rounded-xl border border-ev-border bg-ev-panel p-5 text-left transition-colors hover:border-ev-teal/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ev-teal/10 text-ev-teal">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-medium">{f.title}</p>
                  <p className="mt-1 text-sm text-ev-muted">{f.desc}</p>
                  <p className="mt-2 text-xs text-ev-teal opacity-0 transition-opacity group-hover:opacity-100">
                    在 {app.name} 中查看 →
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-ev-border p-6 text-center">
        <p className="text-sm text-ev-muted">
          云主脑（embedding 同步、团队协作）将在 Phase 3+ 接入。
          当前以本地 Project Graph 为真源，遵循 PRD「本地优先」原则。
        </p>
      </section>
    </div>
  );
}

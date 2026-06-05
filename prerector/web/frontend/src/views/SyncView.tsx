import { useEffect, useRef, useState } from "react";
import { CloudUpload, Film, Loader2, Play, Settings2 } from "lucide-react";
import type { PrerectorProject } from "@everec/shared";
import { api, formatBytes, type SyncSessionWithStats } from "../lib/api";

interface SyncViewProps {
  projects: PrerectorProject[];
  sessions: SyncSessionWithStats[];
  activeProjectId: string | null;
  onRefresh: () => Promise<void>;
}

const STRATEGY_LABELS = {
  proxy_first: "代理优先（推荐）",
  timeline_first: "时间轴优先",
  full: "全量同步",
};

const PRIORITY_LABELS = {
  proxy: "代理",
  timeline: "时间轴",
  raw: "原始素材",
};

export function SyncView({ projects, sessions, activeProjectId, onRefresh }: SyncViewProps) {
  const [name, setName] = useState("协作同步");
  const [strategy, setStrategy] = useState<"proxy_first" | "timeline_first" | "full">("proxy_first");
  const [loading, setLoading] = useState(false);
  const [ticking, setTicking] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const projectId = activeProjectId ?? projects[0]?.id;

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  async function handleStart() {
    if (!projectId) return;
    setLoading(true);
    try {
      await api.startSync({ projectId, name, strategy });
      await onRefresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleTick(sessionId: string) {
    setTicking(sessionId);
    try {
      await api.tickSync(sessionId);
      await onRefresh();
    } finally {
      setTicking(null);
    }
  }

  function startAutoSync(sessionId: string) {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(async () => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session || session.stats.percent >= 100) {
        if (tickRef.current) clearInterval(tickRef.current);
        return;
      }
      await api.tickSync(sessionId);
      await onRefresh();
    }, 800);
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-pr-text">
          <CloudUpload className="h-5 w-5 text-pr-orange" />
          视频文件同步
        </h1>
        <p className="mt-1 text-sm text-pr-muted">
          代理优先策略：先同步低码率 proxy 与时间轴，原始素材后台传输
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-pr-border bg-pr-panel p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-pr-text">
          <Settings2 className="h-4 w-4 text-pr-accent" />
          新建同步会话
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="会话名称"
            className="rounded border border-pr-border bg-pr-elevated px-3 py-2 text-sm text-pr-text"
          />
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as typeof strategy)}
            className="rounded border border-pr-border bg-pr-elevated px-3 py-2 text-sm text-pr-text"
          >
            {Object.entries(STRATEGY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleStart}
            disabled={loading || !projectId}
            className="flex items-center gap-2 rounded bg-pr-orange px-4 py-2 text-sm font-medium text-pr-bg disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            开始同步
          </button>
        </div>
        {!projectId && (
          <p className="mt-2 text-xs text-pr-muted">请先在 Tasks 中创建项目</p>
        )}
      </div>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <p className="text-center text-sm text-pr-muted">暂无同步会话</p>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="rounded-lg border border-pr-border bg-pr-panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-pr-text">{session.name}</h3>
                  <p className="text-[11px] text-pr-muted">
                    {STRATEGY_LABELS[session.strategy]} · {session.files.length} 文件
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-pr-accent">
                    {Math.round(session.stats.percent)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTick(session.id)}
                    disabled={ticking === session.id}
                    className="rounded border border-pr-border px-2 py-1 text-[11px] text-pr-muted hover:bg-pr-elevated"
                  >
                    单步
                  </button>
                  <button
                    type="button"
                    onClick={() => startAutoSync(session.id)}
                    className="rounded bg-pr-accent/20 px-2 py-1 text-[11px] text-pr-accent"
                  >
                    自动
                  </button>
                </div>
              </div>

              <div className="mb-3 h-2 overflow-hidden rounded-full bg-pr-elevated">
                <div
                  className="h-full bg-pr-accent transition-all"
                  style={{ width: `${session.stats.percent}%` }}
                />
              </div>

              <div className="mb-2 text-[11px] text-pr-muted">
                {formatBytes(session.stats.bytesDone)} / {formatBytes(session.stats.bytesTotal)}
              </div>

              <ul className="space-y-1.5">
                {session.files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-3 rounded-md bg-pr-elevated px-3 py-2 text-xs"
                  >
                    <Film className={`h-3.5 w-3.5 ${f.isProxy ? "text-pr-green" : "text-pr-muted"}`} />
                    <span className="min-w-0 flex-1 truncate text-pr-text">{f.name}</span>
                    <span className="text-pr-muted">{PRIORITY_LABELS[f.priority]}</span>
                    <span className="w-14 text-right text-pr-muted">{formatBytes(f.sizeBytes)}</span>
                    <span
                      className={`w-16 text-right ${
                        f.status === "done"
                          ? "text-pr-green"
                          : f.status === "syncing"
                            ? "text-pr-accent"
                            : "text-pr-muted"
                      }`}
                    >
                      {f.status === "done" ? "完成" : f.status === "syncing" ? `${f.progress}%` : "等待"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import { ArrowUpRight, Clock } from "lucide-react";
import { launchApp } from "../lib/apps";
import { AppIcon } from "../lib/appIcons";
import type { EverecApp } from "../types";

interface Props {
  app: EverecApp;
  compact?: boolean;
}

const STATUS_LABELS = {
  ready: "可用",
  beta: "Beta",
  coming_soon: "即将推出",
};

export function AppCard({ app, compact }: Props) {
  const disabled = app.status === "coming_soon";

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
    e.currentTarget.style.setProperty("--glow-color", app.glowColor);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => launchApp(app)}
      onMouseMove={handleMouseMove}
      className={`app-card-glow group relative flex flex-col rounded-2xl border border-ev-border bg-gradient-to-br ${app.gradient} bg-ev-panel text-left transition-all ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:border-ev-accent/40 hover:shadow-lg hover:shadow-ev-accent/5"
      } ${compact ? "p-4" : "p-6"}`}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/20"
          style={{ color: app.glowColor }}
        >
          <AppIcon icon={app.icon} size={24} />
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              app.status === "ready"
                ? "bg-emerald-500/15 text-emerald-400"
                : app.status === "beta"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-ev-elevated text-ev-muted"
            }`}
          >
            {STATUS_LABELS[app.status]}
          </span>
          {!disabled && (
            <ArrowUpRight
              size={16}
              className="text-ev-muted opacity-0 transition-opacity group-hover:opacity-100"
            />
          )}
        </div>
      </div>

      <div className={`mt-4 ${compact ? "" : "flex-1"}`}>
        <h3 className="font-display text-lg font-semibold">{app.name}</h3>
        <p className="mt-0.5 text-sm text-ev-muted">{app.tagline}</p>
        {!compact && (
          <p className="mt-3 text-sm leading-relaxed text-ev-muted/90">
            {app.description}
          </p>
        )}
      </div>

      {!compact && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {app.features.map((f) => (
            <span
              key={f}
              className="rounded-md bg-black/20 px-2 py-0.5 text-[11px] text-ev-muted"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {disabled && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-ev-muted">
          <Clock size={12} />
          Phase 6 规划中
        </div>
      )}
    </button>
  );
}

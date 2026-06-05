import { ChevronRight } from "lucide-react";
import { EVEREC_APPS, PIPELINE, launchApp } from "../lib/apps";
import { AppIcon } from "../lib/appIcons";

export function PipelineBar() {
  return (
    <div className="rounded-2xl border border-ev-border bg-ev-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm font-semibold">创作闭环</h2>
          <p className="mt-0.5 text-xs text-ev-muted">
            从灵感到交付 — 一条链路贯穿所有应用
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PIPELINE.map((step, i) => {
          const app = EVEREC_APPS.find((a) => a.id === step.appId);
          if (!app) return null;
          return (
            <div key={step.step} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => launchApp(app)}
                disabled={app.status === "coming_soon"}
                className="pipeline-step group flex items-center gap-3 rounded-xl border border-ev-border bg-ev-elevated px-4 py-3 transition-colors hover:border-ev-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ev-accent/15 text-xs font-bold text-ev-accent">
                  {step.step}
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="text-[11px] text-ev-muted">{step.description}</p>
                </div>
                <AppIcon
                  icon={app.icon}
                  size={16}
                  className="ml-1 text-ev-muted opacity-0 transition-opacity group-hover:opacity-100"
                />
              </button>
              {i < PIPELINE.length - 1 && (
                <ChevronRight size={16} className="shrink-0 text-ev-border" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

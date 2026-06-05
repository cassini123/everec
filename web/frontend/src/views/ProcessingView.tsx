import { Check, Waves } from "lucide-react";
import { FX_PRESETS } from "../lib/fxPresets";
import type { EffectSettings } from "../types";

interface ProcessingViewProps {
  activePresetId: string | null;
  effects: EffectSettings;
  onApplyPreset: (presetId: string, effects: EffectSettings) => void;
}

export function ProcessingView({
  activePresetId,
  effects,
  onApplyPreset,
}: ProcessingViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-ds-border bg-ds-panel px-4 py-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Waves className="h-5 w-5 text-ds-blue" />
          声音处理
        </h2>
        <p className="mt-1 text-xs text-ds-muted">
          选择预设应用到当前项目 · 可在底部栏微调参数
        </p>
      </div>

      <div className="grid-bg flex-1 overflow-auto p-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {FX_PRESETS.map((preset) => {
            const active = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset(preset.id, preset.effects)}
                className={`rounded-lg border p-4 text-left transition ${
                  active
                    ? "border-ds-blue bg-ds-blue/10 ring-1 ring-ds-blue/40"
                    : "border-ds-border bg-ds-panel hover:border-ds-muted"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-2xl">{preset.icon}</span>
                  {active && <Check className="h-4 w-4 text-ds-blue" />}
                </div>
                <div className="font-medium">{preset.nameZh}</div>
                <div className="text-[11px] text-ds-muted">{preset.name}</div>
                <p className="mt-2 text-xs leading-relaxed text-ds-muted">
                  {preset.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1 text-[10px] text-ds-muted">
                  <span className="rounded bg-ds-bg px-1.5 py-0.5">
                    混响 {preset.effects.reverb}%
                  </span>
                  <span className="rounded bg-ds-bg px-1.5 py-0.5">
                    延迟 {preset.effects.delay}%
                  </span>
                  <span className="rounded bg-ds-bg px-1.5 py-0.5">
                    压缩 {preset.effects.compress}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-ds-border bg-ds-surface px-4 py-3">
        <div className="text-[10px] uppercase tracking-wider text-ds-muted">
          当前参数
        </div>
        <div className="mt-2 grid grid-cols-5 gap-3 text-xs">
          {(
            [
              ["混响", effects.reverb],
              ["延迟", effects.delay],
              ["高频", effects.eqHigh],
              ["低频", effects.eqLow],
              ["压缩", effects.compress],
            ] as const
          ).map(([label, val]) => (
            <div key={label} className="rounded bg-ds-panel px-2 py-1.5">
              <span className="text-ds-muted">{label}</span>
              <span className="ml-1 font-mono text-ds-text">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

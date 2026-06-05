import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { describeEffect, EFFECT_CATEGORIES } from "../lib/effectPresets";
import type { EffectPreset } from "../types";

interface Props {
  activeEffects: string[];
  onToggle: (id: string) => void;
}

export function EffectsView({ activeEffects, onToggle }: Props) {
  const [presets, setPresets] = useState<EffectPreset[]>([]);

  useEffect(() => {
    api.listEffectPresets().then(setPresets);
  }, []);

  const grouped = presets.reduce<Record<string, EffectPreset[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles size={20} />
          简单特效预设
        </h1>
        <p className="mt-1 text-sm text-sc-muted">
          渐隐、渐显、高亮等一键应用 — 适合超短篇快剪
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-auto">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-sc-muted">
              {EFFECT_CATEGORIES[category] ?? category}
            </h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {items.map((preset) => {
                const active = activeEffects.includes(preset.id);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onToggle(preset.id)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      active
                        ? "border-sc-accent bg-sc-accent/10"
                        : "border-sc-border bg-sc-panel hover:border-sc-accent/40"
                    }`}
                  >
                    <div className="text-sm font-medium">{preset.name}</div>
                    <div className="mt-1 text-[10px] text-sc-muted">
                      {describeEffect(preset)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

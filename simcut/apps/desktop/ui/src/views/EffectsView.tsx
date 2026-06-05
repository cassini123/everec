import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { EffectPreview } from "../components/effects/EffectPreview";
import { api } from "../lib/api";
import {
  describeEffect,
  EFFECT_CATEGORIES,
  EFFECT_CATEGORY_ORDER,
} from "../lib/effectPresets";
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
          转场、画面与环境特效 — 右侧可预览实际效果
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-auto">
        {EFFECT_CATEGORY_ORDER.map((category) => {
          const items = grouped[category];
          if (!items?.length) return null;
          return (
            <div key={category}>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-sc-muted">
                {EFFECT_CATEGORIES[category] ?? category}
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((preset) => {
                  const active = activeEffects.includes(preset.id);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onToggle(preset.id)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                        active
                          ? "border-sc-accent bg-sc-accent/10"
                          : "border-sc-border bg-sc-panel hover:border-sc-accent/40"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{preset.name}</div>
                        <div className="mt-0.5 text-[10px] text-sc-muted">
                          {describeEffect(preset)}
                        </div>
                      </div>
                      <EffectPreview effectId={preset.id} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

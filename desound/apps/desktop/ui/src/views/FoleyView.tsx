import { useMemo, useRef, useState } from "react";
import { Play, RotateCcw, Save, Volume2 } from "lucide-react";
import { api } from "../lib/api";
import { FOLEY_PRESETS, synthesizeFoley } from "../lib/foley";
import type { FoleyPreset, SoundAsset } from "../types";

interface FoleyViewProps {
  sounds: SoundAsset[];
  onSaved: () => void;
}

export function FoleyView({ sounds, onSaved }: FoleyViewProps) {
  const [preset, setPreset] = useState<FoleyPreset>(FOLEY_PRESETS[0]);
  const [params, setParams] = useState<Record<string, number>>(() =>
    Object.fromEntries(preset.params.map((p) => [p.id, p.default])),
  );
  const [name, setName] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const foleyHistory = useMemo(
    () => sounds.filter((s) => s.category === "foley").slice(-6).reverse(),
    [sounds],
  );

  const selectPreset = (next: FoleyPreset) => {
    setPreset(next);
    setParams(Object.fromEntries(next.params.map((p) => [p.id, p.default])));
    setName(`${next.nameZh}_${Date.now().toString(36).slice(-4)}`);
  };

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  };

  const handlePreview = async () => {
    setPreviewing(true);
    const ctx = getCtx();
    const source = synthesizeFoley(ctx, preset.id, params);
    source.connect(ctx.destination);
    source.start();
    source.onended = () => setPreviewing(false);
  };

  const handleReset = () => {
    setParams(Object.fromEntries(preset.params.map((p) => [p.id, p.default])));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveFoleySound(
        name || `${preset.nameZh}_design`,
        preset.id,
        [preset.category, ...Object.keys(params)],
      );
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="w-56 shrink-0 border-r border-ds-border bg-ds-surface">
        <div className="border-b border-ds-border px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-ds-muted">
          拟声预设
        </div>
        <div className="space-y-1 p-2">
          {FOLEY_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPreset(p)}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left transition ${
                preset.id === p.id
                  ? "bg-ds-elevated ring-1 ring-ds-green/40"
                  : "hover:bg-ds-panel"
              }`}
            >
              <span className="text-lg">{p.icon}</span>
              <div>
                <div className="text-sm font-medium">{p.nameZh}</div>
                <div className="text-[11px] text-ds-muted">{p.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-ds-border bg-ds-panel px-4 py-3">
          <span className="text-2xl">{preset.icon}</span>
          <div>
            <h2 className="text-lg font-semibold">{preset.nameZh}</h2>
            <p className="text-xs text-ds-muted">{preset.name} · {preset.category}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewing}
              className="flex items-center gap-2 rounded-md bg-ds-green/20 px-4 py-2 text-sm text-ds-green transition hover:bg-ds-green/30 disabled:opacity-50"
            >
              <Play className="h-4 w-4" fill="currentColor" />
              {previewing ? "播放中…" : "预览"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 rounded-md border border-ds-border px-3 py-2 text-sm text-ds-muted hover:text-ds-text"
            >
              <RotateCcw className="h-4 w-4" />
              重置
            </button>
          </div>
        </div>

        <div className="grid-bg flex flex-1 gap-6 overflow-auto p-6">
          <div className="grid flex-1 grid-cols-2 gap-4 lg:grid-cols-3">
            {preset.params.map((param) => (
              <div
                key={param.id}
                className="rounded-lg border border-ds-border bg-ds-panel p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{param.label}</span>
                  <span className="font-mono text-xs text-ds-accent">
                    {(params[param.id] ?? param.default).toFixed(2)}
                    {param.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={params[param.id] ?? param.default}
                  onChange={(e) =>
                    setParams((prev) => ({
                      ...prev,
                      [param.id]: Number(e.target.value),
                    }))
                  }
                  className="w-full"
                />
                <div
                  className="mx-auto mt-4 h-16 w-16 rounded-full knob-ring"
                  style={{
                    ["--value" as string]: String(
                      (((params[param.id] ?? param.default) - param.min) /
                        (param.max - param.min)) *
                        100,
                    ),
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex w-64 shrink-0 flex-col gap-4">
            <div className="rounded-lg border border-ds-border bg-ds-panel p-4">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-ds-muted">
                <Volume2 className="h-3.5 w-3.5" />
                波形预览
              </div>
              <div className="flex h-24 items-end justify-center gap-0.5">
                {Array.from({ length: 32 }).map((_, i) => {
                  const v = Object.values(params)[i % Object.values(params).length] ?? 0.5;
                  return (
                    <div
                      key={i}
                      className="w-1 rounded-sm bg-ds-green/60"
                      style={{ height: `${20 + v * 60 + Math.sin(i * 0.5) * 15}%` }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-ds-border bg-ds-panel p-4">
              <label className="mb-2 block text-xs text-ds-muted">保存名称</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${preset.nameZh}_design`}
                className="mb-3 w-full rounded border border-ds-border bg-ds-bg px-3 py-2 text-sm outline-none focus:border-ds-accent"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-ds-accent py-2.5 text-sm font-medium text-white transition hover:bg-ds-accent-dim disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "保存中…" : "保存到素材库"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {foleyHistory.length > 0 && (
        <aside className="w-52 shrink-0 border-l border-ds-border bg-ds-surface">
          <div className="border-b border-ds-border px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-ds-muted">
            最近保存
          </div>
          <div className="space-y-1 p-2">
            {foleyHistory.map((s) => (
              <div
                key={s.id}
                className="rounded-md bg-ds-panel px-3 py-2 text-sm"
              >
                <div className="truncate font-medium">{s.name}</div>
                <div className="text-[11px] text-ds-muted">{s.createdAt}</div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}

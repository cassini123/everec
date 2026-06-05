import { Mic, Sparkles, Waves } from "lucide-react";
import type { BottomPanel, DubSettings, EffectSettings } from "../../types";

const EFFECTS: { id: keyof EffectSettings; label: string; unit: string }[] = [
  { id: "reverb", label: "混响", unit: "%" },
  { id: "delay", label: "延迟", unit: "%" },
  { id: "eqHigh", label: "高频", unit: "dB" },
  { id: "eqLow", label: "低频", unit: "dB" },
  { id: "compress", label: "压缩", unit: "%" },
];

interface BottomToolBarProps {
  panel: BottomPanel;
  onPanelChange: (p: BottomPanel) => void;
  effects: EffectSettings;
  onEffectsChange: (e: EffectSettings) => void;
  dub: DubSettings;
  onDubChange: (d: DubSettings) => void;
}

export function BottomToolBar({
  panel,
  onPanelChange,
  effects,
  onEffectsChange,
  dub,
  onDubChange,
}: BottomToolBarProps) {
  return (
    <div className="flex shrink-0 flex-col border-t border-ds-border bg-ds-surface">
      <div className="flex h-9 items-center gap-1 border-b border-ds-border px-3">
        <button
          type="button"
          onClick={() => onPanelChange("effects")}
          className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs transition ${
            panel === "effects"
              ? "bg-ds-accent/20 text-ds-accent"
              : "text-ds-muted hover:text-ds-text"
          }`}
        >
          <Waves className="h-3.5 w-3.5" />
          声音效果
        </button>
        <button
          type="button"
          onClick={() => onPanelChange("dubbing")}
          className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs transition ${
            panel === "dubbing"
              ? "bg-ds-accent/20 text-ds-accent"
              : "text-ds-muted hover:text-ds-text"
          }`}
        >
          <Mic className="h-3.5 w-3.5" />
          配音
        </button>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-ds-muted">
          <Sparkles className="h-3 w-3" />
          选中轨道应用
        </span>
      </div>

      <div className="h-28 overflow-auto px-4 py-3">
        {panel === "effects" ? (
          <div className="grid grid-cols-5 gap-4">
            {EFFECTS.map(({ id, label, unit }) => (
              <div key={id}>
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-ds-muted">{label}</span>
                  <span className="font-mono text-ds-text">
                    {effects[id].toFixed(0)}{unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={id.startsWith("eq") ? -12 : 0}
                  max={id.startsWith("eq") ? 12 : 100}
                  value={effects[id]}
                  onChange={(e) =>
                    onEffectsChange({ ...effects, [id]: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] text-ds-muted">配音文稿</label>
              <textarea
                value={dub.script}
                onChange={(e) => onDubChange({ ...dub, script: e.target.value })}
                placeholder="输入旁白或对白文本…"
                rows={3}
                className="w-full resize-none rounded border border-ds-border bg-ds-bg px-3 py-2 text-sm outline-none focus:border-ds-accent"
              />
            </div>
            <div className="flex w-48 flex-col gap-2">
              <label className="text-[11px] text-ds-muted">
                语速 {dub.speed.toFixed(1)}x
                <input
                  type="range"
                  min={0.5}
                  max={1.5}
                  step={0.05}
                  value={dub.speed}
                  onChange={(e) =>
                    onDubChange({ ...dub, speed: Number(e.target.value) })
                  }
                  className="mt-1 w-full"
                />
              </label>
              <label className="text-[11px] text-ds-muted">
                音高 {dub.pitch > 0 ? "+" : ""}{dub.pitch} st
                <input
                  type="range"
                  min={-12}
                  max={12}
                  value={dub.pitch}
                  onChange={(e) =>
                    onDubChange({ ...dub, pitch: Number(e.target.value) })
                  }
                  className="mt-1 w-full"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

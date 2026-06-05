import { useState } from "react";
import { Ratio } from "lucide-react";
import {
  ASPECT_PRESETS,
  aspectCssRatio,
  findPresetByResolution,
} from "../../lib/aspectRatio";

interface Props {
  resolution: [number, number];
  onChange: (resolution: [number, number]) => void;
}

export function AspectRatioPicker({ resolution, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [customW, setCustomW] = useState(String(resolution[0]));
  const [customH, setCustomH] = useState(String(resolution[1]));

  const preset = findPresetByResolution(resolution);
  const label = preset?.label ?? `${resolution[0]}×${resolution[1]}`;

  const applyCustom = () => {
    const w = Math.max(1, Math.min(7680, parseInt(customW, 10) || 1920));
    const h = Math.max(1, Math.min(7680, parseInt(customH, 10) || 1080));
    onChange([w, h]);
    setCustom(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-sc-border bg-sc-panel px-2.5 py-1.5 text-xs text-sc-text hover:border-sc-accent"
      >
        <Ratio size={12} />
        {label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-sc-border bg-sc-surface p-2 shadow-xl">
            <p className="mb-2 px-1 text-[10px] text-sc-muted">画面比例</p>
            {ASPECT_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange([p.width, p.height]);
                  setCustom(false);
                  setOpen(false);
                }}
                className={`mb-1 flex w-full items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-sc-panel ${
                  preset?.id === p.id ? "bg-sc-accent/15 text-sc-accent" : "text-sc-text"
                }`}
              >
                <span>{p.label}</span>
                <span className="font-mono text-[10px] text-sc-muted">
                  {p.width}×{p.height}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setCustom(true);
                setCustomW(String(resolution[0]));
                setCustomH(String(resolution[1]));
              }}
              className="flex w-full items-center rounded px-2 py-1.5 text-xs text-sc-text hover:bg-sc-panel"
            >
              自定义…
            </button>
            {custom && (
              <div className="mt-2 space-y-2 border-t border-sc-border pt-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={7680}
                    value={customW}
                    onChange={(e) => setCustomW(e.target.value)}
                    className="w-full rounded border border-sc-border bg-sc-panel px-2 py-1 font-mono text-xs"
                  />
                  <span className="text-sc-muted">×</span>
                  <input
                    type="number"
                    min={1}
                    max={7680}
                    value={customH}
                    onChange={(e) => setCustomH(e.target.value)}
                    className="w-full rounded border border-sc-border bg-sc-panel px-2 py-1 font-mono text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyCustom}
                  className="w-full rounded bg-sc-accent py-1 text-xs text-white"
                >
                  应用
                </button>
              </div>
            )}
            <div
              className="mx-auto mt-2 rounded border border-sc-border bg-black"
              style={{
                aspectRatio: aspectCssRatio(resolution),
                width: resolution[0] >= resolution[1] ? "100%" : "40%",
                maxHeight: 48,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

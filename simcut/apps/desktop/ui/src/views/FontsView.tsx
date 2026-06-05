import { useEffect, useState } from "react";
import { Loader2, Type } from "lucide-react";
import { FONT_PRESETS, loadWebFonts } from "../lib/fonts";
import type { FontStyle } from "../types";

const DEFAULT: FontStyle = {
  id: "default",
  family: "Noto Sans SC",
  size: 32,
  weight: 700,
  color: "#ffffff",
  strokeColor: "#000000",
  strokeWidth: 0,
  shadow: true,
  letterSpacing: 0,
};

interface Props {
  embedded?: boolean;
}

export function FontsView({ embedded = false }: Props) {
  const [style, setStyle] = useState<FontStyle>(DEFAULT);
  const [fontsReady, setFontsReady] = useState(false);
  const [fontError, setFontError] = useState("");

  useEffect(() => {
    loadWebFonts()
      .then(() => setFontsReady(true))
      .catch((err) => setFontError(String(err)));
  }, []);

  const update = <K extends keyof FontStyle>(key: K, value: FontStyle[K]) => {
    setStyle((s) => ({ ...s, [key]: value }));
  };

  const selectFont = (preset: (typeof FONT_PRESETS)[number]) => {
    setStyle((s) => ({
      ...s,
      family: preset.family,
      weight: preset.weight,
    }));
  };

  const activePreset = FONT_PRESETS.find((f) => f.family === style.family);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
      <div className="flex items-center justify-between">
        {embedded ? (
          <p className="text-sm text-sc-muted">10 款真实 Web 字体，可调字号、字重与颜色</p>
        ) : (
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <Type size={20} />
            自定义字体 · 10 款真实 Web 字体
          </h1>
        )}
        {!fontsReady && !fontError && (
          <span className="flex items-center gap-1 text-xs text-sc-muted">
            <Loader2 size={12} className="animate-spin" />
            加载字体中…
          </span>
        )}
      </div>

      {fontError && (
        <p className="rounded-lg bg-red-950/40 px-3 py-2 text-xs text-red-300">{fontError}</p>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {FONT_PRESETS.map((font) => (
          <button
            key={font.id}
            type="button"
            onClick={() => selectFont(font)}
            className={`rounded-xl border p-3 text-left transition-colors ${
              style.family === font.family
                ? "border-sc-accent bg-sc-accent/10"
                : "border-sc-border bg-sc-panel hover:border-sc-accent/40"
            }`}
          >
            <div className="text-[10px] text-sc-muted">{font.category}</div>
            <div className="mt-1 text-sm font-medium text-sc-text">{font.label}</div>
            <p
              className="mt-2 text-lg leading-snug text-sc-text"
              style={{
                fontFamily: `"${font.family}", sans-serif`,
                fontWeight: font.weight,
                opacity: fontsReady ? 1 : 0.4,
              }}
            >
              {font.sample}
            </p>
            <div className="mt-1 font-mono text-[9px] text-sc-muted">{font.family}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-1 gap-6">
        <div className="w-64 shrink-0 space-y-4">
          <label className="block text-xs text-sc-muted">
            当前字体
            <div className="mt-1 rounded-lg border border-sc-border bg-sc-panel px-3 py-2 text-sm">
              {style.family}
            </div>
          </label>

          <label className="block text-xs text-sc-muted">
            字号 {style.size}px
            <input
              type="range"
              min={16}
              max={72}
              value={style.size}
              onChange={(e) => update("size", Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>

          <label className="block text-xs text-sc-muted">
            字重 {style.weight}
            <input
              type="range"
              min={300}
              max={900}
              step={100}
              value={style.weight}
              onChange={(e) => update("weight", Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>

          <label className="block text-xs text-sc-muted">
            字间距 {style.letterSpacing}px
            <input
              type="range"
              min={-2}
              max={8}
              value={style.letterSpacing}
              onChange={(e) => update("letterSpacing", Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={style.shadow}
              onChange={(e) => update("shadow", e.target.checked)}
            />
            文字阴影
          </label>

          <label className="block text-xs text-sc-muted">
            颜色
            <input
              type="color"
              value={style.color}
              onChange={(e) => update("color", e.target.value)}
              className="mt-1 h-8 w-full cursor-pointer rounded"
            />
          </label>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-sc-border bg-sc-track p-8">
          <p
            style={{
              fontFamily: `"${style.family}", sans-serif`,
              fontSize: style.size,
              fontWeight: style.weight,
              color: style.color,
              letterSpacing: style.letterSpacing,
              textShadow: style.shadow ? "0 2px 8px rgba(0,0,0,0.6)" : "none",
              opacity: fontsReady ? 1 : 0.35,
            }}
          >
            {activePreset?.sample ?? "超短篇，轻量出片"}
          </p>
          <p className="mt-4 font-mono text-[10px] text-sc-muted">
            {style.family} · {style.weight} · Google Fonts
          </p>
        </div>
      </div>
    </div>
  );
}

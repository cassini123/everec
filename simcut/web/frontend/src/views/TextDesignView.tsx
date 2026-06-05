import { useEffect, useState } from "react";
import { LayoutTemplate, Loader2 } from "lucide-react";
import { FONT_PRESETS, loadWebFonts } from "../lib/fonts";
import {
  DEFAULT_TEXT_STYLE,
  TEXT_LAYOUT_PRESETS,
  type TextLayoutPreset,
} from "../lib/textDesign";
import type { FontStyle } from "../types";

export function TextDesignView() {
  const [layout, setLayout] = useState<TextLayoutPreset>(TEXT_LAYOUT_PRESETS[0]);
  const [style, setStyle] = useState<FontStyle>(DEFAULT_TEXT_STYLE);
  const [content, setContent] = useState(layout.sample);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    loadWebFonts().then(() => setFontsReady(true));
  }, []);

  const selectLayout = (preset: TextLayoutPreset) => {
    setLayout(preset);
    setContent(preset.sample);
  };

  const justify =
    layout.align === "left"
      ? "flex-start"
      : layout.align === "right"
        ? "flex-end"
        : "center";

  const items =
    layout.vertical === "top"
      ? "flex-start"
      : layout.vertical === "bottom"
        ? "flex-end"
        : "center";

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
      <p className="text-sm text-sc-muted">
        组合字体、版式与位置，快速搭建片头标题、下三分之一与角标样式
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TEXT_LAYOUT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => selectLayout(preset)}
            className={`rounded-xl border p-3 text-left transition-colors ${
              layout.id === preset.id
                ? "border-sc-accent bg-sc-accent/10"
                : "border-sc-border bg-sc-panel hover:border-sc-accent/40"
            }`}
          >
            <LayoutTemplate size={14} className="text-sc-muted" />
            <div className="mt-1 text-sm font-medium">{preset.label}</div>
            <div className="mt-0.5 text-[10px] text-sc-muted">{preset.desc}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-1 gap-6">
        <div className="w-64 shrink-0 space-y-4">
          <label className="block text-xs text-sc-muted">
            文案
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-sc-border bg-sc-panel px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-xs text-sc-muted">
            字体
            <select
              value={style.family}
              onChange={(e) => {
                const font = FONT_PRESETS.find((f) => f.family === e.target.value);
                setStyle((s) => ({
                  ...s,
                  family: e.target.value,
                  weight: font?.weight ?? s.weight,
                }));
              }}
              className="mt-1 w-full rounded-lg border border-sc-border bg-sc-panel px-3 py-2 text-sm"
            >
              {FONT_PRESETS.map((f) => (
                <option key={f.id} value={f.family}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs text-sc-muted">
            字号 {style.size}px
            <input
              type="range"
              min={18}
              max={72}
              value={style.size}
              onChange={(e) => setStyle((s) => ({ ...s, size: Number(e.target.value) }))}
              className="mt-1 w-full"
            />
          </label>

          <label className="block text-xs text-sc-muted">
            底色透明度 {Math.round(layout.bgOpacity * 100)}%
            <input
              type="range"
              min={0}
              max={80}
              value={Math.round(layout.bgOpacity * 100)}
              onChange={(e) =>
                setLayout((l) => ({ ...l, bgOpacity: Number(e.target.value) / 100 }))
              }
              className="mt-1 w-full"
            />
          </label>

          <label className="block text-xs text-sc-muted">
            文字颜色
            <input
              type="color"
              value={style.color}
              onChange={(e) => setStyle((s) => ({ ...s, color: e.target.value }))}
              className="mt-1 h-8 w-full cursor-pointer rounded"
            />
          </label>
        </div>

        <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-sc-border bg-black">
          {!fontsReady && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 text-xs text-sc-muted">
              <Loader2 size={14} className="mr-1 animate-spin" />
              加载字体…
            </div>
          )}
          <div
            className="flex flex-1 p-6"
            style={{ justifyContent: justify, alignItems: items }}
          >
            <div
              className="max-w-[85%] rounded-lg"
              style={{
                padding: layout.padding,
                backgroundColor:
                  layout.bgOpacity > 0
                    ? `rgba(0,0,0,${layout.bgOpacity})`
                    : "transparent",
                textAlign: layout.align,
              }}
            >
              <p
                style={{
                  fontFamily: `"${style.family}", sans-serif`,
                  fontSize: style.size,
                  fontWeight: style.weight,
                  color: style.color,
                  letterSpacing: style.letterSpacing,
                  textShadow: style.shadow ? "0 2px 10px rgba(0,0,0,0.7)" : "none",
                  lineHeight: 1.35,
                }}
              >
                {content || "输入文案预览"}
              </p>
            </div>
          </div>
          <div className="border-t border-sc-border px-4 py-2 font-mono text-[10px] text-sc-muted">
            {layout.label} · {layout.align}/{layout.vertical} · {style.family}
          </div>
        </div>
      </div>
    </div>
  );
}

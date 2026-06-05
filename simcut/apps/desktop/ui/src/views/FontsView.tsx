import { useState } from "react";
import { Type } from "lucide-react";
import type { FontStyle } from "../types";

/** 10 款代表字体 — 覆盖中文/西文、标题/正文、衬线/无衬线 */
const FONT_PRESETS = [
  { id: "pingfang", family: "PingFang SC", label: "苹方", desc: "中文 UI 首选", category: "中文无衬线" },
  { id: "noto", family: "Noto Sans SC", label: "思源黑体", desc: "跨平台中文", category: "中文无衬线" },
  { id: "songti", family: "Songti SC", label: "宋体", desc: "文艺衬线", category: "中文衬线" },
  { id: "kaiti", family: "Kaiti SC", label: "楷体", desc: "手写韵味", category: "中文书法" },
  { id: "helvetica", family: "Helvetica Neue", label: "Helvetica", desc: "经典西文", category: "西文无衬线" },
  { id: "georgia", family: "Georgia", label: "Georgia", desc: "阅读衬线", category: "西文衬线" },
  { id: "avenir", family: "Avenir Next", label: "Avenir", desc: "现代几何", category: "西文标题" },
  { id: "futura", family: "Futura", label: "Futura", desc: "包豪斯风", category: "西文标题" },
  { id: "impact", family: "Impact", label: "Impact", desc: "冲击标题", category: "西文强调" },
  { id: "courier", family: "Courier New", label: "Courier", desc: "等宽字幕", category: "等宽" },
] as const;

const DEFAULT: FontStyle = {
  id: "default",
  family: "PingFang SC",
  size: 32,
  weight: 600,
  color: "#ffffff",
  strokeColor: "#000000",
  strokeWidth: 0,
  shadow: true,
  letterSpacing: 0,
};

const SAMPLE = "超短篇，轻量出片";

export function FontsView() {
  const [style, setStyle] = useState<FontStyle>(DEFAULT);

  const update = <K extends keyof FontStyle>(key: K, value: FontStyle[K]) => {
    setStyle((s) => ({ ...s, [key]: value }));
  };

  const selectFont = (family: string) => update("family", family);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
      <h1 className="flex items-center gap-2 text-lg font-semibold">
        <Type size={20} />
        自定义字体 · 10 款代表字体
      </h1>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
        {FONT_PRESETS.map((font) => (
          <button
            key={font.id}
            type="button"
            onClick={() => selectFont(font.family)}
            className={`rounded-xl border p-3 text-left transition-colors ${
              style.family === font.family
                ? "border-sc-accent bg-sc-accent/10"
                : "border-sc-border bg-sc-panel hover:border-sc-accent/40"
            }`}
          >
            <div className="text-[10px] text-sc-muted">{font.category}</div>
            <div className="mt-1 text-sm font-medium">{font.label}</div>
            <p
              className="mt-2 truncate text-base leading-tight"
              style={{ fontFamily: font.family }}
            >
              {SAMPLE}
            </p>
            <div className="mt-1 text-[10px] text-sc-muted">{font.desc}</div>
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

        <div className="flex flex-1 items-center justify-center rounded-xl border border-sc-border bg-sc-track">
          <p
            style={{
              fontFamily: style.family,
              fontSize: style.size,
              fontWeight: style.weight,
              color: style.color,
              letterSpacing: style.letterSpacing,
              textShadow: style.shadow ? "0 2px 8px rgba(0,0,0,0.6)" : "none",
              WebkitTextStroke: style.strokeWidth
                ? `${style.strokeWidth}px ${style.strokeColor}`
                : undefined,
            }}
          >
            {SAMPLE}
          </p>
        </div>
      </div>
    </div>
  );
}

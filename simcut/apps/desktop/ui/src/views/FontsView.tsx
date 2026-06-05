import { useState } from "react";
import { Type } from "lucide-react";
import type { FontStyle } from "../types";

const FONTS = ["PingFang SC", "SF Pro Display", "Noto Sans SC", "Helvetica Neue", "Georgia"];

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

export function FontsView() {
  const [style, setStyle] = useState<FontStyle>(DEFAULT);

  const update = <K extends keyof FontStyle>(key: K, value: FontStyle[K]) => {
    setStyle((s) => ({ ...s, [key]: value }));
  };

  return (
    <div className="flex flex-1 gap-6 p-6">
      <div className="w-72 shrink-0 space-y-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Type size={20} />
          自定义字体
        </h1>

        <label className="block text-xs text-sc-muted">
          字体
          <select
            value={style.family}
            onChange={(e) => update("family", e.target.value)}
            className="mt-1 w-full rounded-lg border border-sc-border bg-sc-panel px-3 py-2 text-sm"
          >
            {FONTS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
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
          超短篇，轻量出片
        </p>
      </div>
    </div>
  );
}

import type { EffectPreset } from "../types";

export const EFFECT_CATEGORIES: Record<string, string> = {
  transition: "转场",
  emphasis: "强调",
  motion: "运动",
  style: "风格",
};

export function describeEffect(preset: EffectPreset): string {
  switch (preset.id) {
    case "fade-in":
      return `入场渐显 ${preset.params.duration_ms ?? 500}ms`;
    case "fade-out":
      return `出场渐隐 ${preset.params.duration_ms ?? 500}ms`;
    case "highlight":
      return `高亮强度 ${Math.round((preset.params.intensity ?? 0.6) * 100)}%`;
    case "zoom-in":
      return `推近 ${preset.params.scale ?? 1.15}x`;
    case "blur-bg":
      return `虚化 ${preset.params.blur ?? 8}px`;
    default:
      return preset.name;
  }
}

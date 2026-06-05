import type { EffectPreset } from "../types";

export const EFFECT_CATEGORY_ORDER = ["transition", "visual", "environment"] as const;

export const EFFECT_CATEGORIES: Record<string, string> = {
  transition: "转场特效",
  visual: "画面效果",
  environment: "环境特效",
};

export const DEFAULT_EFFECT_PRESETS: EffectPreset[] = [
  // 转场特效
  { id: "fade-in", name: "渐显", category: "transition", params: { duration_ms: 500, intensity: 0, scale: 1, blur: 0 } },
  { id: "fade-out", name: "渐隐", category: "transition", params: { duration_ms: 500, intensity: 0, scale: 1, blur: 0 } },
  { id: "flash-white", name: "闪白", category: "transition", params: { duration_ms: 200, intensity: 1, scale: 1, blur: 0 } },
  { id: "dissolve", name: "叠化", category: "transition", params: { duration_ms: 600, intensity: 0.5, scale: 1, blur: 0 } },
  { id: "wipe", name: "划像", category: "transition", params: { duration_ms: 400, intensity: 0, scale: 1, blur: 0 } },
  // 画面效果
  { id: "highlight", name: "高亮", category: "visual", params: { duration_ms: 0, intensity: 0.6, scale: 1, blur: 0 } },
  { id: "zoom-in", name: "推近", category: "visual", params: { duration_ms: 800, intensity: 0, scale: 1.15, blur: 0 } },
  { id: "blur-bg", name: "背景虚化", category: "visual", params: { duration_ms: 0, intensity: 0, scale: 1, blur: 8 } },
  { id: "slow-mo", name: "慢动作", category: "visual", params: { duration_ms: 0, intensity: 0, scale: 0.5, blur: 0 } },
  { id: "sharpen", name: "锐化", category: "visual", params: { duration_ms: 0, intensity: 0.7, scale: 1, blur: 0 } },
  // 环境特效
  { id: "rain", name: "雨滴", category: "environment", params: { duration_ms: 0, intensity: 0.6, scale: 1, blur: 0 } },
  { id: "snow", name: "飘雪", category: "environment", params: { duration_ms: 0, intensity: 0.5, scale: 1, blur: 0 } },
  { id: "fog", name: "雾霭", category: "environment", params: { duration_ms: 0, intensity: 0.4, scale: 1, blur: 12 } },
  { id: "bokeh", name: "光斑", category: "environment", params: { duration_ms: 0, intensity: 0.5, scale: 1, blur: 4 } },
  { id: "dust", name: "尘埃", category: "environment", params: { duration_ms: 0, intensity: 0.3, scale: 1, blur: 0 } },
];

export function describeEffect(preset: EffectPreset): string {
  switch (preset.id) {
    case "fade-in":
      return `入场渐显 ${preset.params.duration_ms ?? 500}ms`;
    case "fade-out":
      return `出场渐隐 ${preset.params.duration_ms ?? 500}ms`;
    case "flash-white":
      return `闪白过渡 ${preset.params.duration_ms ?? 200}ms`;
    case "dissolve":
      return `叠化 ${preset.params.duration_ms ?? 600}ms`;
    case "wipe":
      return `划像 ${preset.params.duration_ms ?? 400}ms`;
    case "highlight":
      return `高亮强度 ${Math.round((preset.params.intensity ?? 0.6) * 100)}%`;
    case "zoom-in":
      return `推近 ${preset.params.scale ?? 1.15}x`;
    case "blur-bg":
      return `虚化 ${preset.params.blur ?? 8}px`;
    case "slow-mo":
      return `速率 ${preset.params.scale ?? 0.5}x`;
    case "sharpen":
      return `锐化 ${Math.round((preset.params.intensity ?? 0.7) * 100)}%`;
    case "rain":
      return `雨量 ${Math.round((preset.params.intensity ?? 0.6) * 100)}%`;
    case "snow":
      return `密度 ${Math.round((preset.params.intensity ?? 0.5) * 100)}%`;
    case "fog":
      return `浓度 ${Math.round((preset.params.intensity ?? 0.4) * 100)}%`;
    case "bokeh":
      return `光斑 ${Math.round((preset.params.intensity ?? 0.5) * 100)}%`;
    case "dust":
      return `颗粒 ${Math.round((preset.params.intensity ?? 0.3) * 100)}%`;
    default:
      return preset.name;
  }
}

import type { EffectSettings } from "../types";

export interface FxPreset {
  id: string;
  name: string;
  nameZh: string;
  icon: string;
  description: string;
  effects: EffectSettings;
}

export const FX_PRESETS: FxPreset[] = [
  {
    id: "radio",
    name: "AM Radio",
    nameZh: "电台",
    icon: "📻",
    description: "窄带宽 · 压缩 · 轻微失真",
    effects: { reverb: 8, delay: 0, eqHigh: -10, eqLow: 6, compress: 72 },
  },
  {
    id: "broadcast",
    name: "Broadcast",
    nameZh: "广播",
    icon: "📡",
    description: "人声广播 · 清晰中频 · 轻度压缩",
    effects: { reverb: 12, delay: 5, eqHigh: 2, eqLow: -4, compress: 55 },
  },
  {
    id: "underwater",
    name: "Underwater",
    nameZh: "水中",
    icon: "🫧",
    description: "低通滤波 · 闷沉 · 气泡感",
    effects: { reverb: 35, delay: 15, eqHigh: -18, eqLow: 4, compress: 25 },
  },
  {
    id: "echo",
    name: "Echo Hall",
    nameZh: "回音",
    icon: "🏛",
    description: "大厅混响 · 延迟回声",
    effects: { reverb: 58, delay: 42, eqHigh: 0, eqLow: 0, compress: 20 },
  },
  {
    id: "telephone",
    name: "Telephone",
    nameZh: "电话",
    icon: "📞",
    description: "极窄频带 · 失真质感",
    effects: { reverb: 0, delay: 0, eqHigh: -16, eqLow: -14, compress: 65 },
  },
  {
    id: "vinyl",
    name: "Vinyl",
    nameZh: "黑胶",
    icon: "💿",
    description: "温暖低频 · 高频衰减",
    effects: { reverb: 5, delay: 0, eqHigh: -8, eqLow: 5, compress: 30 },
  },
];

import type { EffectSettings } from "../types";

export interface FxPreset {
  id: string;
  name: string;
  nameZh: string;
  icon: string;
  description: string;
  preview: {
    label: string;
    pattern: number[];
    mutedSteps?: number[];
  };
  effects: EffectSettings;
}

export const FX_PRESETS: FxPreset[] = [
  {
    id: "radio",
    name: "AM Radio",
    nameZh: "电台",
    icon: "📻",
    description: "窄带宽 · 压缩 · 轻微失真",
    preview: {
      label: "narrow band",
      pattern: [44, 46, 45, 47, 42, 45, 43, 46],
    },
    effects: { reverb: 8, delay: 0, eqHigh: -10, eqLow: 6, compress: 72 },
  },
  {
    id: "broadcast",
    name: "Broadcast",
    nameZh: "广播",
    icon: "📡",
    description: "人声广播 · 清晰中频 · 轻度压缩",
    preview: {
      label: "voice lift",
      pattern: [42, 58, 64, 60, 68, 62, 56, 52],
    },
    effects: { reverb: 12, delay: 5, eqHigh: 2, eqLow: -4, compress: 55 },
  },
  {
    id: "underwater",
    name: "Underwater",
    nameZh: "水中",
    icon: "🫧",
    description: "低通滤波 · 闷沉 · 气泡感",
    preview: {
      label: "submerged",
      pattern: [28, 36, 31, 44, 38, 34, 30, 40],
    },
    effects: { reverb: 35, delay: 15, eqHigh: -18, eqLow: 4, compress: 25 },
  },
  {
    id: "echo",
    name: "Echo Hall",
    nameZh: "回音",
    icon: "🏛",
    description: "大厅混响 · 延迟回声",
    preview: {
      label: "echo tail",
      pattern: [70, 34, 55, 28, 42, 22, 32, 18],
    },
    effects: { reverb: 58, delay: 42, eqHigh: 0, eqLow: 0, compress: 20 },
  },
  {
    id: "sim-cut",
    name: "Sim Cut",
    nameZh: "Sim Cut",
    icon: "✂️",
    description: "节奏切片 · 门限抽吸 · 断续闪切",
    preview: {
      label: "cut gate",
      pattern: [76, 18, 70, 0, 58, 15, 66, 0, 82, 20, 62, 0],
      mutedSteps: [3, 7, 11],
    },
    effects: { reverb: 6, delay: 18, eqHigh: 5, eqLow: -7, compress: 82 },
  },
  {
    id: "telephone",
    name: "Telephone",
    nameZh: "电话",
    icon: "📞",
    description: "极窄频带 · 失真质感",
    preview: {
      label: "thin line",
      pattern: [34, 36, 33, 35, 32, 34, 31, 33],
    },
    effects: { reverb: 0, delay: 0, eqHigh: -16, eqLow: -14, compress: 65 },
  },
  {
    id: "vinyl",
    name: "Vinyl",
    nameZh: "黑胶",
    icon: "💿",
    description: "温暖低频 · 高频衰减",
    preview: {
      label: "warm roll",
      pattern: [46, 54, 50, 58, 44, 52, 48, 56],
    },
    effects: { reverb: 5, delay: 0, eqHigh: -8, eqLow: 5, compress: 30 },
  },
];

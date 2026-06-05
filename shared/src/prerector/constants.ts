import type { ProjectType } from "./types";

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  auto: "自动识别",
  video: "视频 / 影视",
  audio: "音频 / 声音",
  design: "设计 / UI",
  software: "软件 / 开发",
  campaign: "营销 / 活动",
  general: "通用项目",
};

export const SCOPE_LABELS: Record<Exclude<ProjectType, "auto">, { label: string; unit: string; default: number }> = {
  video: { label: "视频时长", unit: "min", default: 5 },
  audio: { label: "曲目/时长", unit: "min", default: 4 },
  design: { label: "页面/屏幕数", unit: "页", default: 5 },
  software: { label: "功能模块数", unit: "个", default: 8 },
  campaign: { label: "活动周期", unit: "天", default: 14 },
  general: { label: "预估工期", unit: "天", default: 7 },
};

export const DIFFICULTY_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "简单",
  2: "较易",
  3: "中等",
  4: "较难",
  5: "困难",
};

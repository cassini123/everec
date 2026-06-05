import type { FontStyle } from "../types";

export interface TextLayoutPreset {
  id: string;
  label: string;
  desc: string;
  align: "left" | "center" | "right";
  vertical: "top" | "center" | "bottom";
  padding: number;
  bgOpacity: number;
  sample: string;
}

export const TEXT_LAYOUT_PRESETS: TextLayoutPreset[] = [
  {
    id: "title-center",
    label: "居中标题",
    desc: "片头/章节大标题",
    align: "center",
    vertical: "center",
    padding: 24,
    bgOpacity: 0,
    sample: "章节标题",
  },
  {
    id: "lower-third",
    label: "底部字幕条",
    desc: "新闻/访谈下三分之一",
    align: "left",
    vertical: "bottom",
    padding: 16,
    bgOpacity: 0.55,
    sample: "受访者姓名 · 职位",
  },
  {
    id: "caption",
    label: "角标说明",
    desc: "右上角标注",
    align: "right",
    vertical: "top",
    padding: 12,
    bgOpacity: 0.35,
    sample: "地点 · 2026",
  },
  {
    id: "quote",
    label: "金句强调",
    desc: "居中大字 + 半透明底",
    align: "center",
    vertical: "center",
    padding: 32,
    bgOpacity: 0.4,
    sample: "「每一帧都是叙事」",
  },
];

export const DEFAULT_TEXT_STYLE: FontStyle = {
  id: "text-design",
  family: "Noto Sans SC",
  size: 36,
  weight: 700,
  color: "#ffffff",
  strokeColor: "#000000",
  strokeWidth: 0,
  shadow: true,
  letterSpacing: 0,
};

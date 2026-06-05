import type { InstrumentInfo } from "../types";

/** Web 端默认可用的 5 种代表乐器 */
export const WEB_INSTRUMENTS: InstrumentInfo[] = [
  {
    id: "grand_piano",
    name: "Grand Piano",
    slug: "grand_piano",
    category: "Piano",
    description: "明亮 acoustic 钢琴",
  },
  {
    id: "electric_piano",
    name: "Electric Piano",
    slug: "electric_piano",
    category: "Piano",
    description: "Rhodes 电钢琴",
  },
  {
    id: "synth_bass",
    name: "Synth Bass",
    slug: "synth_bass",
    category: "Bass",
    description: "有力合成贝斯",
  },
  {
    id: "strings",
    name: "Strings",
    slug: "strings",
    category: "Strings",
    description: "弦乐合奏",
  },
  {
    id: "drum_kit",
    name: "Drums",
    slug: "drum_kit",
    category: "Drums",
    description: "鼓组 kick / snare / hi-hat",
  },
];

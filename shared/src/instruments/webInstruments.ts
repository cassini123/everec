import type { InstrumentInfo } from "../types";

/** Web 端可用的 10 种乐器（与桌面端 catalog 对齐） */
export const WEB_INSTRUMENTS: InstrumentInfo[] = [
  {
    id: "grand_piano",
    name: "Grand Piano",
    slug: "grand_piano",
    category: "Piano",
    description: "明亮 acoustic 钢琴，多层泛音",
  },
  {
    id: "electric_piano",
    name: "Electric Piano",
    slug: "electric_piano",
    category: "Piano",
    description: "Rhodes 电钢琴，带轻微 detune",
  },
  {
    id: "synth_bass",
    name: "Synth Bass",
    slug: "synth_bass",
    category: "Bass",
    description: "有力合成贝斯",
  },
  {
    id: "synth_lead",
    name: "Synth Lead",
    slug: "synth_lead",
    category: "Lead",
    description: "明亮 Lead 合成器",
  },
  {
    id: "warm_pad",
    name: "Warm Pad",
    slug: "warm_pad",
    category: "Pad",
    description: "温暖铺底 Pad",
  },
  {
    id: "strings",
    name: "Strings",
    slug: "strings",
    category: "Strings",
    description: "弦乐合奏，慢起音",
  },
  {
    id: "organ",
    name: "Organ",
    slug: "organ",
    category: "Organ",
    description: "管风琴，持续音",
  },
  {
    id: "drum_kit",
    name: "Drums",
    slug: "drum_kit",
    category: "Drums",
    description: "鼓组 kick / snare / hi-hat / clap",
  },
  {
    id: "acoustic_guitar",
    name: "Acoustic Guitar",
    slug: "acoustic_guitar",
    category: "Guitar",
    description: "木吉他拨弦感",
  },
  {
    id: "synthesizer",
    name: "Synthesizer",
    slug: "synthesizer",
    category: "Synth",
    description: "通用合成器音色",
  },
];

export type WebInstrumentSlug = (typeof WEB_INSTRUMENTS)[number]["slug"];

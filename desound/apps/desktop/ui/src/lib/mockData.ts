import type { InstrumentInfo, SoundAsset, TrackInfo } from "../types";

export const MOCK_INSTRUMENTS: InstrumentInfo[] = [
  { id: "grand_piano", name: "Grand Piano", slug: "grand_piano", category: "Piano", description: "Bright acoustic piano with natural decay" },
  { id: "electric_piano", name: "Electric Piano", slug: "electric_piano", category: "Piano", description: "Warm Rhodes-style electric piano" },
  { id: "synth_bass", name: "Synth Bass", slug: "synth_bass", category: "Bass", description: "Punchy analog-style bass" },
  { id: "synth_lead", name: "Synth Lead", slug: "synth_lead", category: "Lead", description: "Cutting monophonic lead synth" },
  { id: "warm_pad", name: "Warm Pad", slug: "warm_pad", category: "Pad", description: "Slow-attack ambient pad" },
  { id: "strings", name: "Strings", slug: "strings", category: "Strings", description: "Lush ensemble strings" },
  { id: "organ", name: "Organ", slug: "organ", category: "Organ", description: "Classic drawbar organ" },
  { id: "drum_kit", name: "Drums", slug: "drum_kit", category: "Drums", description: "鼓组 · kick, snare, hi-hat, clap" },
  { id: "acoustic_guitar", name: "Guitar", slug: "acoustic_guitar", category: "Guitar", description: "木吉他 · 拨弦音色" },
  { id: "synthesizer", name: "Synthesizer", slug: "synthesizer", category: "Synth", description: "合成器 · 模拟电子音色" },
];

export const MOCK_TRACKS: TrackInfo[] = [];
export const MOCK_SOUNDS: SoundAsset[] = [];

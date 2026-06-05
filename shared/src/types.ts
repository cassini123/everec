export type Workspace =
  | "projects"
  | "library"
  | "foley"
  | "compose"
  | "processing"
  | "design";

export interface DesoundProjectSummary {
  id: string;
  name: string;
  soundCount: number;
  updatedAt: string;
}

export interface DesoundProject {
  id: string;
  name: string;
  soundCount: number;
  tags: string[];
  bpm: number;
  createdAt: string;
  updatedAt: string;
}
export type ExportFormat = "wav" | "mp3" | "flac" | "aac";
export type LibraryCategory = "all" | "imported" | "foley" | "music";

export interface InstrumentInfo {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
}

export interface TrackInfo {
  index: number;
  name: string;
  instrument: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  loudnessDb?: number;
  targetLufs?: number;
}

export interface SoundAsset {
  id: string;
  name: string;
  fileName: string;
  format: string;
  durationMs: number;
  tags: string[];
  category: string;
  createdAt: string;
  source: string;
  audioUrl?: string;
}

export interface MusicSearchResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
  previewUrl?: string;
  coverUrl?: string;
  source: string;
  playBvid?: string;
}

export interface SfxSearchResult {
  id: string;
  title: string;
  previewUrl: string;
  source: string;
  durationMs?: number;
}

export interface LinkParseResult {
  platform: string;
  title: string;
  author: string;
  durationSec: number;
  coverUrl?: string;
  audioUrl?: string;
  originalUrl: string;
}

export interface SoundDesignResult {
  keywords: string[];
  mood: string;
  similarStyles: StyleMatch[];
  suggestions: string[];
  source: "llm" | "local";
}

export interface StyleMatch {
  name: string;
  nameZh: string;
  similarity: number;
  tags: string[];
  reference: string;
}

export interface FoleyPreset {
  id: string;
  name: string;
  nameZh: string;
  category: string;
  icon: string;
  params: FoleyParam[];
}

export interface FoleyParam {
  id: string;
  label: string;
  min: number;
  max: number;
  default: number;
  step: number;
  unit?: string;
}

export interface NoteClip {
  id: string;
  track: number;
  note: number;
  startBeat: number;
  durationBeats: number;
  velocity: number;
}

export interface TimelineClip {
  id: string;
  trackId: number;
  name: string;
  startSec: number;
  durationSec: number;
  color: string;
  type: "audio" | "midi" | "dub";
}

export interface LoudnessSettings {
  trackIndex: number;
  gainDb: number;
  targetLufs: number;
  peakDb: number;
}

export interface EffectSettings {
  reverb: number;
  delay: number;
  eqHigh: number;
  eqLow: number;
  compress: number;
}

export interface DubSettings {
  script: string;
  speed: number;
  pitch: number;
  volume: number;
}

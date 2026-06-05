export type Workspace =
  | "projects"
  | "edit"
  | "subtitles"
  | "color"
  | "stills"
  | "effects"
  | "fonts"
  | "ai";

export interface ProjectSummary {
  id: string;
  name: string;
  durationMs: number;
  mediaCount: number;
  updatedAt: string;
}

export type MediaKind = "video" | "image" | "audio";

export interface MediaAsset {
  id: string;
  name: string;
  fileName: string;
  format: string;
  durationMs: number;
  width: number;
  height: number;
  tags: string[];
  createdAt: string;
  /** Web 端 IndexedDB blob 引用 */
  blobId?: string;
  mimeType?: string;
  kind?: MediaKind;
}

export interface Clip {
  id: string;
  trackIndex: number;
  mediaId: string;
  startMs: number;
  durationMs: number;
  trimInMs: number;
  trimOutMs: number;
  effectIds: string[];
}

export interface Track {
  index: number;
  name: string;
  kind: "video" | "audio" | "subtitle" | "overlay";
  muted: boolean;
  locked: boolean;
  clips: Clip[];
}

export interface StillFrame {
  id: string;
  mediaId: string;
  timestampMs: number;
  label: string;
  tags: string[];
  colorPalette: string[];
  /** 静帧缩略图 data URL */
  thumbnail?: string;
}

export interface SubtitleCue {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  language: string;
  mediaId?: string;
}

export interface Project {
  id: string;
  name: string;
  fps: number;
  resolution: [number, number];
  durationMs: number;
  tracks: Track[];
  media: MediaAsset[];
  stills: StillFrame[];
  subtitles: SubtitleCue[];
  createdAt: string;
  updatedAt: string;
}

export interface EffectPreset {
  id: string;
  name: string;
  category: string;
  params: Record<string, number>;
}

export type Pixel = { r: number; g: number; b: number };

export interface ColorSwatch {
  hex: string;
  weight: number;
  label: string;
}

export interface ColorSystem {
  name: string;
  description: string;
  palette: ColorSwatch[];
  temperature: number;
  contrast: number;
  saturation: number;
}

export interface LutPreset {
  id: string;
  name: string;
  source: string;
  colorSystem: ColorSystem;
  lutCube: string;
}

export interface WaveformData {
  luma: number[];
  r: number[];
  g: number[];
  b: number[];
}

export interface ColorAnalysisResult {
  dominantColors: ColorSwatch[];
  colorSystem: ColorSystem;
  suggestedLut: LutPreset;
  moodTags: string[];
  waveform?: WaveformData;
  matchCurves?: { luma: number[]; r: number[]; g: number[]; b: number[] };
}

export interface ExposureMetrics {
  iso: number;
  shutterSpeed: string;
  aperture: number;
  exposureValue: number;
  whiteBalanceK: number;
  highlightClipping: number;
  shadowDetail: number;
}

export interface PromptEdit {
  prompt: string;
  action: string;
  confidence: number;
}

export interface AiAnalysisResult {
  metrics: ExposureMetrics;
  suggestions: string[];
  promptEdits: PromptEdit[];
  overallScore: number;
}

export interface ExportOptions {
  format: string;
  resolution: string;
  fps: number;
  saveToPhotos: boolean;
  uploadCloud: boolean;
  cloudProvider?: string;
}

export interface ExportResult {
  success: boolean;
  outputPath: string;
  message: string;
  savedToPhotos: boolean;
  uploadedToCloud: boolean;
}

export interface FontStyle {
  id: string;
  family: string;
  size: number;
  weight: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  shadow: boolean;
  letterSpacing: number;
}

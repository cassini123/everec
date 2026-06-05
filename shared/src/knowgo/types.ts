export type KnowgoWorkspace =
  | "brief"
  | "capture"
  | "analyze"
  | "document"
  | "style"
  | "graph";

export interface KnowgoProject {
  id: string;
  title: string;
  brief: ProjectBrief;
  captures: InspirationCapture[];
  document: InspirationDocument;
  styleGuide: StyleGuide;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectBrief {
  title: string;
  client: string;
  objective: string;
  audience: string;
  tone: string;
  duration: string;
  references: string;
  constraints: string;
  deliverables: string;
}

export type CaptureType = "url" | "image" | "video";

export interface InspirationCapture {
  id: string;
  type: CaptureType;
  sourceUrl?: string;
  fileName?: string;
  previewUrl?: string;
  videoUrl?: string;
  title: string;
  description: string;
  platform?: string;
  author?: string;
  mediaType?: "video" | "image" | "article";
  createdAt: string;
}

import type { MediaDownloadItem } from "../media/types";

export interface UrlParseResult {
  url: string;
  resolvedUrl?: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  siteName?: string;
  platform: string;
  author?: string;
  durationSec?: number;
  mediaType?: "video" | "image" | "article";
  downloads?: MediaDownloadItem[];
}

export interface ImageAnalysis {
  captureId: string;
  subject: string;
  composition: string;
  colorPalette: string[];
  artStyle: string;
  mood: string;
  techniques: string[];
  implementation: ImplementationGuide;
  source: "llm" | "local";
}

export interface ImplementationGuide {
  summary: string;
  tools: string[];
  steps: string[];
  difficulty: "easy" | "medium" | "hard";
}

export interface VideoAnalysis {
  captureId: string;
  filmStyle: string;
  pacing: string;
  narrativeStructure: string;
  colorGrading: string;
  cameraLanguage: string;
  shots: StoryboardShot[];
  overallKeywords: string[];
  source: "llm" | "local";
}

export interface StoryboardShot {
  index: number;
  startSec: number;
  endSec: number;
  durationSec: number;
  shotType: string;
  description: string;
  cameraMovement: string;
  implementation: string;
  thumbnailHint: string;
}

export interface InspirationDocument {
  title: string;
  sections: DocumentSection[];
  updatedAt: string;
}

export interface DocumentSection {
  id: string;
  heading: string;
  content: string;
  mediaIds: string[];
}

export interface StyleGuide {
  keywords: string[];
  moodTags: string[];
  fonts: FontRecommendation[];
  posterStyle: PosterStyleGuide;
  vfxRecommendations: VfxRecommendation[];
  similarShorts: SimilarShort[];
}

export interface FontRecommendation {
  name: string;
  category: string;
  usage: string;
  previewText: string;
  googleFontUrl?: string;
  cssFamily: string;
}

export interface PosterStyleGuide {
  layout: string;
  colorScheme: string[];
  typography: string;
  composition: string;
  referenceDescription: string;
}

export interface VfxRecommendation {
  name: string;
  description: string;
  tools: string[];
  referenceImageUrl: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface SimilarShort {
  id: string;
  title: string;
  director: string;
  year: string;
  styleTags: string[];
  previewUrl: string;
  linkUrl: string;
  similarity: number;
}

export interface KnowgoAnalyzeRequest {
  captureId: string;
  apiKey?: string;
}

export const DEFAULT_BRIEF: ProjectBrief = {
  title: "",
  client: "",
  objective: "",
  audience: "",
  tone: "",
  duration: "",
  references: "",
  constraints: "",
  deliverables: "",
};

export const DEFAULT_STYLE_GUIDE: StyleGuide = {
  keywords: [],
  moodTags: [],
  fonts: [],
  posterStyle: {
    layout: "",
    colorScheme: [],
    typography: "",
    composition: "",
    referenceDescription: "",
  },
  vfxRecommendations: [],
  similarShorts: [],
};

export const DEFAULT_DOCUMENT: InspirationDocument = {
  title: "灵感分析文档",
  sections: [
    { id: "overview", heading: "项目概述", content: "", mediaIds: [] },
    { id: "inspiration", heading: "灵感来源", content: "", mediaIds: [] },
    { id: "visual", heading: "视觉语言", content: "", mediaIds: [] },
    { id: "implementation", heading: "实现方案", content: "", mediaIds: [] },
  ],
  updatedAt: new Date().toISOString(),
};

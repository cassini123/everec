export type MediaKind = "video" | "audio" | "image";

export type MediaContentType = "video" | "image" | "carousel" | "audio" | "article";

export interface MediaDownloadItem {
  url: string;
  label: string;
  ext: string;
  kind: MediaKind;
  noWatermark?: boolean;
  referer?: string;
}

export interface MediaExtractResult {
  url: string;
  resolvedUrl?: string;
  platform: string;
  title: string;
  description?: string;
  author?: string;
  coverUrl?: string;
  durationSec?: number;
  mediaType: MediaContentType;
  siteName?: string;
  downloads: MediaDownloadItem[];
}

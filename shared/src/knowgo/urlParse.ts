import {
  detectMediaPlatform,
  extractMedia,
  extractUrlFromText,
  pickPrimaryVideo,
} from "../media/extract";
import type { UrlParseResult } from "./types";

export { extractUrlFromText, detectMediaPlatform as detectPlatform };

function toUrlParseResult(result: Awaited<ReturnType<typeof extractMedia>>): UrlParseResult {
  const video = pickPrimaryVideo(result);
  return {
    url: result.url,
    resolvedUrl: result.resolvedUrl,
    title: result.title,
    description: result.description ?? "",
    imageUrl: result.coverUrl ?? result.downloads.find((d) => d.kind === "image")?.url,
    videoUrl: video?.url,
    siteName: result.siteName,
    platform: result.platform,
    author: result.author,
    durationSec: result.durationSec,
    mediaType:
      result.mediaType === "carousel"
        ? "image"
        : result.mediaType === "audio"
          ? "article"
          : result.mediaType,
    downloads: result.downloads,
  };
}

export async function parseWebUrl(input: string): Promise<UrlParseResult> {
  try {
    return toUrlParseResult(await extractMedia(input));
  } catch (err) {
    const url = extractUrlFromText(input);
    const platform = detectMediaPlatform(url);
    let title = url;
    try {
      const u = new URL(url);
      title = u.hostname + u.pathname.slice(0, 40);
    } catch {
      /* keep url */
    }
    return {
      url,
      title,
      description: err instanceof Error ? err.message : "无法抓取页面详情，已保存链接供后续分析",
      platform,
      mediaType: "article",
    };
  }
}

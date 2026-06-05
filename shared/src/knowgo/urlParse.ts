import { USER_AGENT } from "../constants";
import type { UrlParseResult } from "./types";

const MOBILE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

const URL_IN_TEXT_RE = /https?:\/\/[^\s<>"'`，。；！？、【】《》]+/i;

function detectPlatform(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("bilibili") || host === "b23.tv") return "bilibili";
    if (host.includes("douyin") || host.includes("tiktok") || host.includes("iesdouyin")) return "douyin";
    if (host.includes("xiaohongshu") || host.includes("xhslink")) return "xiaohongshu";
    if (host.includes("youtube") || host.includes("youtu.be")) return "youtube";
    if (host.includes("vimeo")) return "vimeo";
    if (host.includes("behance")) return "behance";
    if (host.includes("pinterest")) return "pinterest";
    if (host.includes("instagram")) return "instagram";
    return host;
  } catch {
    return "unknown";
  }
}

export function extractUrlFromText(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return normalizeUrl(trimmed);
  const match = trimmed.match(URL_IN_TEXT_RE);
  return match ? normalizeUrl(match[0]) : trimmed;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:") {
      const host = parsed.hostname.replace(/^www\./, "");
      if (host === "xhslink.com" || host.endsWith(".xhslink.com") || host === "b23.tv") {
        parsed.protocol = "https:";
        return parsed.toString();
      }
    }
    return url;
  } catch {
    return url;
  }
}

async function fetchJson<T>(url: string, referer?: string): Promise<T> {
  const headers: Record<string, string> = { "User-Agent": USER_AGENT };
  if (referer) headers.Referer = referer;
  const res = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchHtml(url: string, userAgent = USER_AGENT): Promise<{ html: string; finalUrl: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": userAgent, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { html: await res.text(), finalUrl: res.url || url };
}

function extractMeta(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  }
  return undefined;
}

function extractTitle(html: string): string | undefined {
  const og = extractMeta(html, "og:title");
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1] ? decodeHtmlEntities(m[1].trim()) : undefined;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function deepGet(data: unknown, keys: Array<string | number>): unknown {
  let current: unknown = data;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    if (typeof key === "number") {
      if (Array.isArray(current)) {
        current = current[key];
      } else {
        const values = Object.values(current as Record<string, unknown>);
        current = values.at(key);
      }
    } else {
      current = (current as Record<string, unknown>)[key];
    }
  }
  return current;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function extractInitialState(html: string): Record<string, unknown> | undefined {
  const match = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/);
  if (!match?.[1]) return undefined;
  try {
    const jsonText = match[1].replace(/\bundefined\b/g, "null");
    return JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function extractXhsNote(state: Record<string, unknown>): Record<string, unknown> | undefined {
  return (
    asRecord(deepGet(state, ["noteData", "data", "noteData"])) ??
    asRecord(deepGet(state, ["note", "noteDetailMap", -1, "note"]))
  );
}

function extractXhsCover(note: Record<string, unknown>): string | undefined {
  const list = note.imageList;
  if (!Array.isArray(list) || !list.length) return undefined;
  const img = asRecord(list[0]);
  const url = img?.urlDefault ?? img?.url;
  return typeof url === "string" && url ? url : undefined;
}

function extractXhsVideoUrl(note: Record<string, unknown>): string | undefined {
  const stream = asRecord(asRecord(asRecord(note.video)?.media)?.stream);
  if (!stream) return undefined;
  for (const codec of ["h264", "h265", "h266", "av1"]) {
    const entries = stream[codec];
    if (!Array.isArray(entries) || !entries.length) continue;
    const url = asRecord(entries[0])?.masterUrl;
    if (typeof url === "string" && url) return url;
  }
  return undefined;
}

function extractBvid(url: string): string | null {
  const match = url.match(/BV[a-zA-Z0-9]+/);
  return match ? match[0] : null;
}

async function parseBilibili(url: string): Promise<UrlParseResult> {
  const bvid = extractBvid(url);
  if (!bvid) throw new Error("无法识别 Bilibili 视频链接");

  const info = await fetchJson<{ code?: number; message?: string; data?: Record<string, unknown> }>(
    `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
    "https://www.bilibili.com",
  );
  if (info.code !== 0) throw new Error(info.message ?? "Bilibili API 错误");

  const data = info.data ?? {};
  const owner = asRecord(data.owner);

  return {
    url,
    resolvedUrl: `https://www.bilibili.com/video/${bvid}`,
    title: String(data.title ?? "Bilibili 视频"),
    description: String(data.desc ?? ""),
    imageUrl: data.pic ? String(data.pic) : undefined,
    siteName: "哔哩哔哩",
    platform: "bilibili",
    author: owner?.name ? String(owner.name) : undefined,
    durationSec: Number(data.duration ?? 0) || undefined,
    mediaType: "video",
  };
}

async function parseXiaohongshu(url: string): Promise<UrlParseResult> {
  const { html, finalUrl } = await fetchHtml(url, MOBILE_USER_AGENT);
  const state = extractInitialState(html);
  const note = state ? extractXhsNote(state) : undefined;

  if (note) {
    const title = String(note.title ?? note.desc ?? "小红书作品").trim();
    const description = String(note.desc ?? "").trim();
    const imageUrl = extractXhsCover(note) ?? extractMeta(html, "og:image");
    const videoUrl = extractXhsVideoUrl(note);
    const user = asRecord(note.user);
    const author = user?.nickname ? String(user.nickname) : user?.nickName ? String(user.nickName) : undefined;
    const noteType = String(note.type ?? "");
    const mediaType = noteType === "video" || videoUrl ? "video" : noteType === "normal" ? "image" : "article";

    return {
      url,
      resolvedUrl: finalUrl,
      title,
      description,
      imageUrl,
      videoUrl,
      siteName: "小红书",
      platform: "xiaohongshu",
      author,
      mediaType,
    };
  }

  const poster = html.match(/id="video_note_poster"[^>]+src="([^"]+)"/i)?.[1];
  const title = extractTitle(html) ?? extractMeta(html, "twitter:title") ?? "小红书作品";
  const description =
    extractMeta(html, "og:description") ?? extractMeta(html, "description") ?? extractMeta(html, "twitter:description") ?? "";

  return {
    url,
    resolvedUrl: finalUrl,
    title,
    description,
    imageUrl: poster ?? extractMeta(html, "og:image"),
    siteName: "小红书",
    platform: "xiaohongshu",
    mediaType: poster ? "video" : "article",
  };
}

async function parseDouyin(url: string): Promise<UrlParseResult> {
  const { html, finalUrl } = await fetchHtml(url, MOBILE_USER_AGENT);
  const title = extractTitle(html) ?? extractMeta(html, "twitter:title");
  const description =
    extractMeta(html, "og:description") ?? extractMeta(html, "description") ?? extractMeta(html, "twitter:description") ?? "";
  const imageUrl = extractMeta(html, "og:image") ?? extractMeta(html, "twitter:image");

  const renderDataMatch = html.match(/<script id="RENDER_DATA" type="application\/json">([^<]+)<\/script>/i);
  if (renderDataMatch?.[1]) {
    try {
      const decoded = decodeURIComponent(renderDataMatch[1]);
      const data = JSON.parse(decoded) as Record<string, unknown>;
      const detail = asRecord(deepGet(data, ["app", "videoDetail"]));
      if (detail) {
        const video = asRecord(detail.video);
        const playAddr = asRecord(video?.playAddr);
        const urlList = playAddr?.url_list;
        const videoUrl = Array.isArray(urlList) && typeof urlList[0] === "string" ? urlList[0] : undefined;
        const author = asRecord(detail.author);
        return {
          url,
          resolvedUrl: finalUrl,
          title: String(detail.desc ?? detail.title ?? title ?? "抖音作品"),
          description: String(detail.desc ?? description),
          imageUrl: typeof video?.cover === "string" ? video.cover : imageUrl,
          videoUrl,
          siteName: "抖音",
          platform: "douyin",
          author: typeof author?.nickname === "string" ? author.nickname : undefined,
          mediaType: "video",
        };
      }
    } catch {
      /* fall through */
    }
  }

  if (title || imageUrl) {
    return {
      url,
      resolvedUrl: finalUrl,
      title: title ?? "抖音作品",
      description,
      imageUrl,
      siteName: "抖音",
      platform: "douyin",
      mediaType: imageUrl ? "video" : "article",
    };
  }

  throw new Error("无法解析抖音链接");
}

async function parseGeneric(url: string, platform: string): Promise<UrlParseResult> {
  const { html, finalUrl } = await fetchHtml(url);
  const title = extractTitle(html) ?? extractMeta(html, "twitter:title") ?? "未命名页面";
  const description =
    extractMeta(html, "og:description") ??
    extractMeta(html, "description") ??
    extractMeta(html, "twitter:description") ??
    "";
  const imageUrl = extractMeta(html, "og:image") ?? extractMeta(html, "twitter:image");
  const siteName = extractMeta(html, "og:site_name");

  return { url, resolvedUrl: finalUrl, title, description, imageUrl, siteName, platform, mediaType: "article" };
}

function fallbackUrlParse(url: string, platform: string, message?: string): UrlParseResult {
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
    description: message ?? "无法抓取页面详情，已保存链接供后续分析",
    platform,
    mediaType: "article",
  };
}

export async function parseWebUrl(input: string): Promise<UrlParseResult> {
  const url = extractUrlFromText(input);
  const platform = detectPlatform(url);

  try {
    if (platform === "bilibili") return await parseBilibili(url);
    if (platform === "xiaohongshu") return await parseXiaohongshu(url);
    if (platform === "douyin") return await parseDouyin(url);
    return await parseGeneric(url, platform);
  } catch (err) {
    if (platform === "bilibili" || platform === "xiaohongshu" || platform === "douyin") {
      try {
        return await parseGeneric(url, platform);
      } catch {
        return fallbackUrlParse(url, platform, err instanceof Error ? err.message : undefined);
      }
    }
    return fallbackUrlParse(url, platform);
  }
}

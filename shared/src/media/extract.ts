import { USER_AGENT } from "../constants";
import type { MediaContentType, MediaDownloadItem, MediaExtractResult, MediaKind } from "./types";

export type { MediaDownloadItem, MediaExtractResult, MediaContentType, MediaKind } from "./types";

const MOBILE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

const URL_IN_TEXT_RE = /https?:\/\/[^\s<>"'`，。；！？、【】《》]+/i;

const SUPPORTED_PLATFORMS = [
  "bilibili",
  "douyin",
  "tiktok",
  "xiaohongshu",
  "youtube",
  "instagram",
  "twitter",
  "facebook",
  "vimeo",
  "weibo",
  "kuaishou",
] as const;

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

export function detectMediaPlatform(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("bilibili") || host === "b23.tv") return "bilibili";
    if (host.includes("douyin") || host.includes("iesdouyin")) return "douyin";
    if (host.includes("tiktok") || host === "vm.tiktok.com" || host === "vt.tiktok.com") return "tiktok";
    if (host.includes("xiaohongshu") || host.includes("xhslink")) return "xiaohongshu";
    if (host.includes("youtube") || host === "youtu.be") return "youtube";
    if (host.includes("instagram")) return "instagram";
    if (host.includes("twitter") || host === "x.com") return "twitter";
    if (host.includes("facebook") || host === "fb.watch") return "facebook";
    if (host.includes("vimeo")) return "vimeo";
    if (host.includes("weibo")) return "weibo";
    if (host.includes("kuaishou") || host.includes("gifshow")) return "kuaishou";
    return host;
  } catch {
    return "unknown";
  }
}

export function isSupportedMediaPlatform(platform: string): boolean {
  return (SUPPORTED_PLATFORMS as readonly string[]).includes(platform);
}

async function fetchJson<T>(url: string, referer?: string, userAgent = USER_AGENT): Promise<T> {
  const headers: Record<string, string> = { "User-Agent": userAgent };
  if (referer) headers.Referer = referer;
  const res = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(15000) });
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

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
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
  return extractMeta(html, "og:title") ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
}

function deepGet(data: unknown, keys: Array<string | number>): unknown {
  let current: unknown = data;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    if (typeof key === "number") {
      current = Array.isArray(current) ? current[key] : Object.values(current as Record<string, unknown>).at(key);
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
    return JSON.parse(match[1].replace(/\bundefined\b/g, "null")) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function extractJsonScript(html: string, id: string): Record<string, unknown> | undefined {
  const match = html.match(
    new RegExp(`<script id="${id}" type="application/json">([^<]+)</script>`, "i"),
  );
  if (!match?.[1]) return undefined;
  try {
    const text = id === "RENDER_DATA" ? decodeURIComponent(match[1]) : match[1];
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function firstUrl(value: unknown): string | undefined {
  if (typeof value === "string" && value.startsWith("http")) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = firstUrl(item);
      if (url) return url;
    }
  }
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    for (const key of ["url", "url_list", "urlList", "download_addr", "downloadAddr", "play_addr", "playAddr"]) {
      const url = firstUrl(rec[key]);
      if (url) return url;
    }
  }
  return undefined;
}

function findMediaUrls(obj: unknown, hints: string[], out: string[] = [], depth = 0): string[] {
  if (depth > 14 || obj == null) return out;
  if (typeof obj === "string") {
    if (/^https?:\/\/.+/i.test(obj) && hints.some((h) => obj.includes(h))) {
      if (/\.(mp4|m4a|mp3|m3u8)(\?|$)/i.test(obj) || obj.includes("/stream/") || obj.includes("videoplayback")) {
        if (!out.includes(obj)) out.push(obj);
      }
    }
    return out;
  }
  if (Array.isArray(obj)) {
    for (const item of obj.slice(0, 40)) findMediaUrls(item, hints, out, depth + 1);
    return out;
  }
  if (typeof obj === "object") {
    for (const value of Object.values(obj as Record<string, unknown>).slice(0, 60)) {
      findMediaUrls(value, hints, out, depth + 1);
    }
  }
  return out;
}

function buildResult(
  base: Omit<MediaExtractResult, "downloads"> & { downloads?: MediaDownloadItem[] },
): MediaExtractResult {
  return { ...base, downloads: base.downloads ?? [] };
}

function extractBvid(url: string): string | null {
  return url.match(/BV[a-zA-Z0-9]+/)?.[0] ?? null;
}

async function extractBilibili(url: string): Promise<MediaExtractResult> {
  let target = url;
  if (!extractBvid(url)) {
    const resolved = await fetchHtml(url);
    target = resolved.finalUrl;
  }
  const bvid = extractBvid(target);
  if (!bvid) throw new Error("无法识别 Bilibili 视频链接");

  const info = await fetchJson<{ code?: number; message?: string; data?: Record<string, unknown> }>(
    `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
    "https://www.bilibili.com",
  );
  if (info.code !== 0) throw new Error(info.message ?? "Bilibili API 错误");

  const data = info.data ?? {};
  const owner = asRecord(data.owner);
  const cid = Number(data.cid);
  const play = await fetchJson<{
    data?: {
      dash?: {
        video?: { baseUrl?: string; base_url?: string }[];
        audio?: { baseUrl?: string; base_url?: string }[];
      };
    };
  }>(
    `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&fnval=4048&qn=80`,
    "https://www.bilibili.com",
  );

  const downloads: MediaDownloadItem[] = [];
  const video = play.data?.dash?.video?.[0];
  const audio = play.data?.dash?.audio?.[0];
  const videoUrl = video?.baseUrl ?? video?.base_url;
  const audioUrl = audio?.baseUrl ?? audio?.base_url;
  if (videoUrl) {
    downloads.push({
      url: videoUrl,
      label: "无水印视频",
      ext: "mp4",
      kind: "video",
      noWatermark: true,
      referer: "https://www.bilibili.com",
    });
  }
  if (audioUrl) {
    downloads.push({
      url: audioUrl,
      label: "音频",
      ext: audioUrl.includes(".m4a") ? "m4a" : "mp3",
      kind: "audio",
      referer: "https://www.bilibili.com",
    });
  }

  return buildResult({
    url,
    resolvedUrl: `https://www.bilibili.com/video/${bvid}`,
    platform: "bilibili",
    title: String(data.title ?? "Bilibili 视频"),
    description: String(data.desc ?? ""),
    author: owner?.name ? String(owner.name) : undefined,
    coverUrl: data.pic ? String(data.pic) : undefined,
    durationSec: Number(data.duration ?? 0) || undefined,
    mediaType: "video",
    siteName: "哔哩哔哩",
    downloads,
  });
}

function extractXhsNote(state: Record<string, unknown>): Record<string, unknown> | undefined {
  return (
    asRecord(deepGet(state, ["noteData", "data", "noteData"])) ??
    asRecord(deepGet(state, ["note", "noteDetailMap", -1, "note"]))
  );
}

async function extractXiaohongshu(url: string): Promise<MediaExtractResult> {
  const { html, finalUrl } = await fetchHtml(url, MOBILE_USER_AGENT);
  const state = extractInitialState(html);
  const note = state ? extractXhsNote(state) : undefined;
  const downloads: MediaDownloadItem[] = [];

  if (note) {
    const imageList = note.imageList;
    if (Array.isArray(imageList)) {
      imageList.forEach((item, index) => {
        const img = asRecord(item);
        const imgUrl = img?.urlDefault ?? img?.url;
        if (typeof imgUrl === "string" && imgUrl) {
          downloads.push({
            url: imgUrl,
            label: imageList.length > 1 ? `图片 ${index + 1}` : "封面",
            ext: "jpg",
            kind: "image",
            noWatermark: true,
          });
        }
      });
    }

    const stream = asRecord(asRecord(asRecord(note.video)?.media)?.stream);
    if (stream) {
      for (const codec of ["h264", "h265", "h266", "av1"]) {
        const entries = stream[codec];
        if (!Array.isArray(entries) || !entries.length) continue;
        const videoUrl = asRecord(entries[0])?.masterUrl;
        if (typeof videoUrl === "string" && videoUrl) {
          downloads.unshift({
            url: videoUrl,
            label: "无水印视频",
            ext: "mp4",
            kind: "video",
            noWatermark: true,
          });
          break;
        }
      }
    }

    const user = asRecord(note.user);
    const noteType = String(note.type ?? "");
    const mediaType: MediaContentType =
      downloads.some((d) => d.kind === "video")
        ? "video"
        : downloads.length > 1
          ? "carousel"
          : noteType === "normal"
            ? "image"
            : "article";

    return buildResult({
      url,
      resolvedUrl: finalUrl,
      platform: "xiaohongshu",
      title: String(note.title ?? note.desc ?? "小红书作品").trim(),
      description: String(note.desc ?? "").trim(),
      author: user?.nickname ? String(user.nickname) : user?.nickName ? String(user.nickName) : undefined,
      coverUrl: downloads.find((d) => d.kind === "image")?.url,
      mediaType,
      siteName: "小红书",
      downloads,
    });
  }

  throw new Error("无法解析小红书作品");
}

async function extractDouyin(url: string): Promise<MediaExtractResult> {
  const { html, finalUrl } = await fetchHtml(url, MOBILE_USER_AGENT);
  const data = extractJsonScript(html, "RENDER_DATA");
  const downloads: MediaDownloadItem[] = [];

  if (data) {
    const detail =
      asRecord(deepGet(data, ["app", "videoDetail"])) ??
      asRecord(findAwemeDetail(data));
    if (detail) {
      const video = asRecord(detail.video);
      const downloadUrl =
        firstUrl(video?.download_addr) ??
        firstUrl(video?.downloadAddr) ??
        firstUrl(asRecord(video?.downloadAddr)?.url_list) ??
        firstUrl(asRecord(video?.download_addr)?.url_list);
      const playUrl = firstUrl(video?.play_addr) ?? firstUrl(video?.playAddr) ?? firstUrl(asRecord(video?.playAddr)?.url_list);
      if (downloadUrl) {
        downloads.push({
          url: downloadUrl,
          label: "无水印视频",
          ext: "mp4",
          kind: "video",
          noWatermark: true,
        });
      } else if (playUrl) {
        downloads.push({ url: playUrl, label: "视频", ext: "mp4", kind: "video" });
      }

      const author = asRecord(detail.author);
      return buildResult({
        url,
        resolvedUrl: finalUrl,
        platform: "douyin",
        title: String(detail.desc ?? detail.title ?? "抖音作品"),
        description: String(detail.desc ?? ""),
        author: typeof author?.nickname === "string" ? author.nickname : undefined,
        coverUrl: typeof video?.cover === "string" ? video.cover : undefined,
        mediaType: "video",
        siteName: "抖音",
        downloads,
      });
    }
  }

  const cdnUrls = findMediaUrls(html, ["douyin", "douyinvod", "bytecdn", "snssdk"]);
  if (cdnUrls.length) {
    downloads.push({
      url: cdnUrls[0],
      label: "无水印视频",
      ext: "mp4",
      kind: "video",
      noWatermark: true,
    });
  }

  if (downloads.length) {
    return buildResult({
      url,
      resolvedUrl: finalUrl,
      platform: "douyin",
      title: extractTitle(html) ?? "抖音作品",
      mediaType: "video",
      siteName: "抖音",
      downloads,
    });
  }

  throw new Error("无法解析抖音链接");
}

function findAwemeDetail(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findAwemeDetail(item);
      if (found) return found;
    }
    return undefined;
  }
  const rec = obj as Record<string, unknown>;
  if (rec.aweme_detail || rec.awemeDetail) return rec.aweme_detail ?? rec.awemeDetail;
  for (const value of Object.values(rec)) {
    const found = findAwemeDetail(value);
    if (found) return found;
  }
  return undefined;
}

async function extractYoutube(url: string): Promise<MediaExtractResult> {
  const videoId =
    url.match(/[?&]v=([^&]+)/)?.[1] ??
    url.match(/youtu\.be\/([^?&]+)/)?.[1] ??
    url.match(/shorts\/([^?&]+)/)?.[1];
  if (!videoId) throw new Error("无法识别 YouTube 视频 ID");

  const body = {
    context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } },
    videoId,
  };
  const res = await fetch(
    "https://www.youtube.com/youtubei/v1/player?key=AIzaSyA8eiZmM1FaDVNAWyXlXo8kbyWpXwUbh1Y",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": MOBILE_USER_AGENT },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!res.ok) throw new Error(`YouTube API HTTP ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  const details = asRecord(data.videoDetails);
  const streaming = asRecord(data.streamingData);
  const downloads: MediaDownloadItem[] = [];

  for (const bucket of ["formats", "adaptiveFormats"]) {
    const list = streaming?.[bucket];
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const fmt = asRecord(item);
      const mediaUrl = fmt?.url;
      const mime = String(fmt?.mimeType ?? "");
      if (typeof mediaUrl !== "string" || !mediaUrl.startsWith("http")) continue;
      if (mime.includes("video")) {
        downloads.push({
          url: mediaUrl,
          label: `视频 ${fmt?.qualityLabel ?? ""}`.trim() || "视频",
          ext: "mp4",
          kind: "video",
          noWatermark: true,
        });
      } else if (mime.includes("audio")) {
        downloads.push({
          url: mediaUrl,
          label: "音频",
          ext: "m4a",
          kind: "audio",
        });
      }
    }
  }

  const bestVideo = downloads.find((d) => d.kind === "video");
  const unique = downloads.filter(
    (item, index, arr) => arr.findIndex((x) => x.url === item.url) === index,
  );

  return buildResult({
    url,
    resolvedUrl: `https://www.youtube.com/watch?v=${videoId}`,
    platform: "youtube",
    title: String(details?.title ?? "YouTube 视频"),
    author: String(asRecord(details?.author)?.name ?? ""),
    description: String(details?.shortDescription ?? ""),
    coverUrl: typeof details?.thumbnail === "object" ? firstUrl(details?.thumbnail) : undefined,
    durationSec: Number(details?.lengthSeconds ?? 0) || undefined,
    mediaType: bestVideo ? "video" : "article",
    siteName: "YouTube",
    downloads: unique.slice(0, 6),
  });
}

async function extractTiktok(url: string): Promise<MediaExtractResult> {
  const { html, finalUrl } = await fetchHtml(url, MOBILE_USER_AGENT);
  const downloads: MediaDownloadItem[] = [];

  const universal = html.match(
    new RegExp(
      '<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">([^<]+)</script>',
    ),
  );
  if (universal?.[1]) {
    try {
      const data = JSON.parse(universal[1]) as Record<string, unknown>;
      const urls = findMediaUrls(data, ["tiktokcdn", "tiktokv.com", "muscdn"]);
      for (const mediaUrl of urls.slice(0, 3)) {
        downloads.push({
          url: mediaUrl,
          label: downloads.length ? `视频 ${downloads.length + 1}` : "无水印视频",
          ext: mediaUrl.includes(".m3u8") ? "m3u8" : "mp4",
          kind: "video",
          noWatermark: true,
        });
      }
      const item = asRecord(deepGet(data, ["__DEFAULT_SCOPE__", "webapp.video-detail", "itemInfo", "itemStruct"]));
      if (item) {
        const author = asRecord(item.author);
        return buildResult({
          url,
          resolvedUrl: finalUrl,
          platform: "tiktok",
          title: String(item.desc ?? "TikTok 视频"),
          author: typeof author?.nickname === "string" ? author.nickname : undefined,
          coverUrl: String(asRecord(item.video)?.cover ?? ""),
          mediaType: "video",
          siteName: "TikTok",
          downloads,
        });
      }
    } catch {
      /* fall through */
    }
  }

  const pageUrls = findMediaUrls(html, ["tiktokcdn", "tiktokv.com", "muscdn"]);
  for (const mediaUrl of pageUrls.slice(0, 2)) {
    downloads.push({
      url: mediaUrl,
      label: "无水印视频",
      ext: "mp4",
      kind: "video",
      noWatermark: true,
    });
  }

  if (downloads.length) {
    return buildResult({
      url,
      resolvedUrl: finalUrl,
      platform: "tiktok",
      title: extractTitle(html) ?? "TikTok 视频",
      mediaType: "video",
      siteName: "TikTok",
      downloads,
    });
  }

  throw new Error("无法解析 TikTok 链接，请确认链接公开可访问");
}

async function extractInstagram(url: string): Promise<MediaExtractResult> {
  const { html, finalUrl } = await fetchHtml(url, MOBILE_USER_AGENT);
  const downloads: MediaDownloadItem[] = [];
  const title = extractTitle(html) ?? "Instagram 作品";
  const coverUrl = extractMeta(html, "og:image");

  const videoSecure = extractMeta(html, "og:video:secure_url") ?? extractMeta(html, "og:video");
  if (videoSecure) {
    downloads.push({
      url: videoSecure,
      label: "无水印视频",
      ext: "mp4",
      kind: "video",
      noWatermark: true,
    });
  }

  const embeddedUrls = findMediaUrls(html, ["cdninstagram.com", "fbcdn.net"]);
  for (const mediaUrl of embeddedUrls.slice(0, 8)) {
    const kind: MediaKind = /\.mp4|\/o1\/v\//i.test(mediaUrl) ? "video" : "image";
    if (kind === "video" && !downloads.some((d) => d.kind === "video")) {
      downloads.push({
        url: mediaUrl,
        label: "无水印视频",
        ext: "mp4",
        kind: "video",
        noWatermark: true,
      });
    } else if (kind === "image") {
      downloads.push({
        url: mediaUrl,
        label: `图片 ${downloads.filter((d) => d.kind === "image").length + 1}`,
        ext: "jpg",
        kind: "image",
        noWatermark: true,
      });
    }
  }

  if (coverUrl && !downloads.some((d) => d.url === coverUrl)) {
    downloads.push({ url: coverUrl, label: "封面", ext: "jpg", kind: "image" });
  }

  if (!downloads.length) throw new Error("无法解析 Instagram 链接，可能需要登录或链接非公开");

  const mediaType: MediaContentType = downloads.some((d) => d.kind === "video")
    ? "video"
    : downloads.length > 1
      ? "carousel"
      : "image";

  return buildResult({
    url,
    resolvedUrl: finalUrl,
    platform: "instagram",
    title,
    coverUrl,
    mediaType,
    siteName: "Instagram",
    downloads: dedupeDownloads(downloads).slice(0, 12),
  });
}

async function extractGeneric(url: string, platform: string): Promise<MediaExtractResult> {
  const { html, finalUrl } = await fetchHtml(url);
  const downloads: MediaDownloadItem[] = [];
  const video =
    extractMeta(html, "og:video:secure_url") ??
    extractMeta(html, "og:video") ??
    extractMeta(html, "twitter:player:stream");
  const image = extractMeta(html, "og:image");

  if (video) {
    downloads.push({ url: video, label: "视频", ext: "mp4", kind: "video" });
  }
  if (image) {
    downloads.push({ url: image, label: "封面", ext: "jpg", kind: "image" });
  }

  return buildResult({
    url,
    resolvedUrl: finalUrl,
    platform,
    title: extractTitle(html) ?? "未命名页面",
    description:
      extractMeta(html, "og:description") ??
      extractMeta(html, "description") ??
      extractMeta(html, "twitter:description") ??
      "",
    coverUrl: image,
    mediaType: video ? "video" : image ? "image" : "article",
    siteName: extractMeta(html, "og:site_name"),
    downloads,
  });
}

function dedupeDownloads(items: MediaDownloadItem[]): MediaDownloadItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

async function extractViaWorker(url: string): Promise<MediaExtractResult | null> {
  const worker = process.env.MEDIA_EXTRACT_API?.trim();
  if (!worker) return null;
  try {
    const res = await fetch(worker, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as MediaExtractResult;
    if (data?.downloads?.length) return data;
  } catch {
    /* ignore */
  }
  return null;
}

export function pickPrimaryVideo(result: MediaExtractResult): MediaDownloadItem | undefined {
  return (
    result.downloads.find((d) => d.kind === "video" && d.noWatermark) ??
    result.downloads.find((d) => d.kind === "video")
  );
}

export function pickPrimaryAudio(result: MediaExtractResult): MediaDownloadItem | undefined {
  return result.downloads.find((d) => d.kind === "audio");
}

export async function extractMedia(input: string): Promise<MediaExtractResult> {
  const url = extractUrlFromText(input);
  const platform = detectMediaPlatform(url);

  const workerResult = await extractViaWorker(url);
  if (workerResult) return workerResult;

  try {
    switch (platform) {
      case "bilibili":
        return await extractBilibili(url);
      case "xiaohongshu":
        return await extractXiaohongshu(url);
      case "douyin":
      case "kuaishou":
        return await extractDouyin(url);
      case "tiktok":
        return await extractTiktok(url);
      case "youtube":
        return await extractYoutube(url);
      case "instagram":
        return await extractInstagram(url);
      default:
        return await extractGeneric(url, platform);
    }
  } catch (primaryErr) {
    try {
      const generic = await extractGeneric(url, platform);
      if (generic.downloads.length) return generic;
    } catch {
      /* ignore */
    }
    throw primaryErr instanceof Error ? primaryErr : new Error("解析失败");
  }
}

import type { LinkParseResult, MusicSearchResult, SoundAsset } from "../types";
import { searchMusicOnline, resolveMusicAudioUrl, formatResultLabel } from "@everec/shared";
import { DESKTOP_APP_HINT, invoke, isTauriApp } from "./tauri";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchJson<T>(url: string, referer?: string): Promise<T> {
  const headers: Record<string, string> = { "User-Agent": USER_AGENT };
  if (referer) headers.Referer = referer;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

function requireDesktop(): void {
  if (!isTauriApp()) throw new Error(DESKTOP_APP_HINT);
}

export { searchMusicOnline };

export function detectPlatform(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.includes("bilibili.com") || lower.includes("b23.tv")) return "bilibili";
  if (lower.includes("douyin.com") || lower.includes("iesdouyin.com")) return "douyin";
  if (lower.includes("xiaohongshu.com") || lower.includes("xhslink.com")) return "xiaohongshu";
  return null;
}

function extractBvid(url: string): string | null {
  const idx = url.indexOf("BV");
  if (idx === -1) return null;
  const rest = url.slice(idx);
  const match = rest.match(/^BV[a-zA-Z0-9]+/);
  return match ? match[0] : null;
}

async function parseBilibili(url: string): Promise<LinkParseResult> {
  const bvid = extractBvid(url);
  if (!bvid) throw new Error("无法识别 Bilibili 视频链接");

  const info = await fetchJson<{ code?: number; message?: string; data?: Record<string, unknown> }>(
    `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
    "https://www.bilibili.com",
  );
  if (info.code !== 0) throw new Error(info.message ?? "Bilibili API 错误");

  const data = info.data!;
  const cid = Number(data.cid);
  const play = await fetchJson<{ data?: { dash?: { audio?: { baseUrl?: string; base_url?: string }[] } } }>(
    `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&fnval=16&qn=0`,
    "https://www.bilibili.com",
  );
  const audio = play.data?.dash?.audio?.[0];

  return {
    platform: "bilibili",
    title: String(data.title ?? "Bilibili 视频"),
    author: String((data.owner as { name?: string })?.name ?? ""),
    durationSec: Number(data.duration ?? 0),
    coverUrl: data.pic ? String(data.pic) : undefined,
    audioUrl: audio?.baseUrl ?? audio?.base_url,
    originalUrl: url,
  };
}

export async function parseMediaUrl(url: string): Promise<LinkParseResult> {
  const trimmed = url.trim();
  if (!trimmed) throw new Error("请输入链接");
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    throw new Error("请输入有效的 http/https 链接");
  }

  const platform = detectPlatform(trimmed);
  if (platform === "bilibili") {
    try {
      return await parseBilibili(trimmed);
    } catch {
      /* fall through to yt-dlp */
    }
  }
  if (platform === "douyin" || platform === "xiaohongshu" || platform === "bilibili") {
    requireDesktop();
    const hasYtdlp = await invoke<boolean>("check_ytdlp");
    if (!hasYtdlp) throw new Error("解析此平台需要 yt-dlp，请安装: pip install yt-dlp");
    return {
      platform,
      title: "待下载",
      author: "",
      durationSec: 0,
      originalUrl: trimmed,
    };
  }
  throw new Error("暂不支持该平台，目前支持: Bilibili、抖音、小红书");
}

async function importViaHttp(
  url: string,
  name: string,
  tags: string[],
  sourceLabel: string,
  referer?: string,
): Promise<SoundAsset> {
  return invoke<SoundAsset>("import_from_http_url", {
    url,
    name,
    tags,
    sourceLabel,
    referer,
  });
}

export async function saveSearchResultToLibrary(result: MusicSearchResult): Promise<SoundAsset> {
  requireDesktop();
  const displayName = formatResultLabel(result.title, result.artist);
  const tags = ["bgm", "search", result.source];
  const sourceLabel = `search:${result.source}`;

  try {
    const resolved = await resolveMusicAudioUrl(result);
    return importViaHttp(resolved.url, displayName, tags, sourceLabel, resolved.referer);
  } catch (err) {
    if (result.previewUrl) {
      return importViaHttp(result.previewUrl, displayName, tags, sourceLabel);
    }
    throw err;
  }
}

export async function saveLinkToLibrary(link: LinkParseResult): Promise<SoundAsset> {
  requireDesktop();
  const tags = ["bgm", link.platform];
  const sourceLabel = `link:${link.platform}`;

  if (link.platform === "bilibili" && link.audioUrl) {
    return importViaHttp(
      link.audioUrl,
      link.title,
      tags,
      sourceLabel,
      "https://www.bilibili.com",
    );
  }

  return invoke<SoundAsset>("download_media_with_ytdlp", {
    url: link.originalUrl,
    name: link.title !== "待下载" ? link.title : undefined,
    tags,
    sourceLabel,
  });
}

export async function checkYtdlpAvailable(): Promise<boolean> {
  if (!isTauriApp()) return false;
  return invoke<boolean>("check_ytdlp");
}

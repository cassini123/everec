import type { LinkParseResult, MusicSearchResult, SoundAsset } from "../types";
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

async function searchItunes(query: string, limit: number): Promise<MusicSearchResult[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=${limit}&country=CN`;
  const data = await fetchJson<{ results?: Record<string, unknown>[] }>(url);
  const results: MusicSearchResult[] = [];
  for (const item of data.results ?? []) {
    const id = String(item.trackId ?? item.collectionId ?? "");
    if (!id) continue;
    results.push({
      id: `itunes:${id}`,
      title: String(item.trackName ?? item.collectionName ?? "Unknown"),
      artist: String(item.artistName ?? "Unknown"),
      album: String(item.collectionName ?? ""),
      durationMs: Number(item.trackTimeMillis ?? 0),
      previewUrl: item.previewUrl ? String(item.previewUrl) : undefined,
      coverUrl: item.artworkUrl100 ? String(item.artworkUrl100) : undefined,
      source: "itunes",
    });
  }
  return results;
}

async function searchNetease(query: string, limit: number): Promise<MusicSearchResult[]> {
  const url = `https://music.163.com/api/search/get/web?s=${encodeURIComponent(query)}&type=1&limit=${limit}`;
  const data = await fetchJson<{
    result?: { songs?: Record<string, unknown>[] };
  }>(url, "https://music.163.com/");
  const results: MusicSearchResult[] = [];
  for (const song of data.result?.songs ?? []) {
    const id = String(song.id ?? "");
    if (!id) continue;
    const artists = (song.artists as { name?: string }[] | undefined)?.map((a) => a.name ?? "").filter(Boolean) ?? [];
    results.push({
      id: `netease:${id}`,
      title: String(song.name ?? "Unknown"),
      artist: artists.length ? artists.join(", ") : "Unknown",
      album: String((song.album as { name?: string })?.name ?? ""),
      durationMs: Number(song.duration ?? 0),
      coverUrl: (song.album as { picUrl?: string })?.picUrl,
      source: "netease",
    });
  }
  return results;
}

export async function searchMusicOnline(query: string, limit = 20): Promise<MusicSearchResult[]> {
  const q = query.trim();
  if (!q) throw new Error("请输入搜索关键词");
  const perSource = Math.max(5, Math.floor(limit / 2));
  const [netease, itunes] = await Promise.all([
    searchNetease(q, perSource).catch(() => []),
    searchItunes(q, perSource).catch(() => []),
  ]);
  const results = [...netease, ...itunes].slice(0, limit);
  if (!results.length) throw new Error("未找到相关歌曲");
  return results;
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
  const displayName = `${result.title} - ${result.artist}`;
  const tags = ["bgm", "search", result.source];
  const sourceLabel = `search:${result.source}`;

  if (result.source === "itunes" && result.previewUrl) {
    return importViaHttp(result.previewUrl, displayName, tags, sourceLabel);
  }

  if (result.source === "netease") {
    const songId = result.id.replace("netease:", "");
    const url = `https://music.163.com/song/media/outer/url?id=${songId}.mp3`;
    try {
      return await importViaHttp(url, displayName, tags, sourceLabel, "https://music.163.com/");
    } catch {
      return invoke<SoundAsset>("download_media_with_ytdlp", {
        url,
        name: displayName,
        tags,
        sourceLabel,
      });
    }
  }

  throw new Error("该歌曲暂无可用音频");
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

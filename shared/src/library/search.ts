import type { LinkParseResult, MusicSearchResult } from "../types";
import { USER_AGENT } from "../constants";
import {
  cleanArtist,
  cleanSongTitle,
  countKeywordMatches,
  extractQueryKeywords,
  formatResultLabel,
  isRemixOrLive,
  normalizeSongTitle,
  songKey,
  splitQuery,
} from "./parseTitle";

async function fetchJson<T>(url: string, referer?: string): Promise<T> {
  const headers: Record<string, string> = { "User-Agent": USER_AGENT };
  if (referer) headers.Referer = referer;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, { headers });
    if (res.status === 412 && attempt === 0) {
      await new Promise((r) => setTimeout(r, 400));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }
  throw new Error("HTTP 412");
}

function scoreCandidate(
  query: { title: string; artist: string },
  item: MusicSearchResult,
  keywords: string[],
): number {
  let score = countKeywordMatches(item, keywords) * 200;

  const qt = normalizeSongTitle(query.title);
  const qa = query.artist.toLowerCase().replace(/\s/g, "");
  const title = normalizeSongTitle(item.title);
  const artist = item.artist.toLowerCase().replace(/\s/g, "");
  const titleHit = !!(qt && (title === qt || title.includes(qt) || qt.includes(title)));
  const artistHit = !!(qa && artist.includes(qa));

  if (titleHit && artistHit) score += 300;
  else if (titleHit) score += 80;
  else if (artistHit) score += 80;

  if (qa && !artistHit) score -= 120;

  if (item.album) score += 20;
  if (item.previewUrl) score += 10;
  if (item.album && !/live|现场/i.test(item.album)) score += 15;
  if (isRemixOrLive(item.title) && !/live|版|dj|remix/i.test(query.title + query.artist)) score -= 60;
  if (item.album && /live|现场/i.test(item.album) && !/live|现场/i.test(query.title + query.artist)) {
    score -= 50;
  }
  if (/\([^)]*$/.test(item.title) || /（[^）]*$/.test(item.title)) score -= 20;
  if (item.durationMs > 0) score += 5;
  return score;
}

function isRelevantResult(
  item: MusicSearchResult,
  query: { title: string; artist: string },
): boolean {
  const hintTitle = normalizeSongTitle(query.title);
  const hintArtist = query.artist.toLowerCase().replace(/\s/g, "");

  if (!hintTitle && hintArtist) {
    const artist = item.artist.toLowerCase().replace(/\s/g, "");
    return artist.includes(hintArtist);
  }

  if (!hintTitle) return true;

  const itemTitle = normalizeSongTitle(item.title);
  if (itemTitle === hintTitle || itemTitle.includes(hintTitle) || hintTitle.includes(itemTitle)) {
    return true;
  }

  const words = query.title
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9\u4e00-\u9fff]/g, ""))
    .filter((w) => w.length > 1);
  if (words.length >= 2) {
    const blob = normalizeSongTitle(`${item.title}${item.artist}${item.album ?? ""}`);
    return words.every((w) => blob.includes(w));
  }

  return false;
}

function mergeResult(base: MusicSearchResult, other: MusicSearchResult): MusicSearchResult {
  return {
    ...base,
    album: base.album || other.album,
    coverUrl: base.coverUrl || other.coverUrl,
    previewUrl: base.previewUrl || other.previewUrl,
    durationMs: base.durationMs || other.durationMs,
  };
}

function itunesArtworkUrl(raw?: unknown): string | undefined {
  const url = raw ? String(raw) : "";
  if (!url) return undefined;
  return url.replace(/(\d+)x\1bb\.(jpg|png)/i, "600x600bb.$2");
}

async function searchItunes(
  query: string,
  limit: number,
  _hint: { title: string; artist: string },
): Promise<MusicSearchResult[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=${limit}&country=CN`;
  const data = await fetchJson<{ results?: Record<string, unknown>[] }>(url);
  const results: MusicSearchResult[] = [];

  for (const item of data.results ?? []) {
    const kind = String(item.kind ?? item.wrapperType ?? "");
    if (kind && !kind.includes("song") && kind !== "track") continue;

    const id = String(item.trackId ?? "");
    if (!id) continue;

    const title = cleanSongTitle(String(item.trackName ?? "Unknown"));
    const artist = cleanArtist(String(item.artistName ?? "Unknown"));
    const album = String(item.collectionName ?? "").trim();
    if (!album) continue;

    results.push({
      id: `itunes:${id}`,
      title,
      artist,
      album,
      durationMs: Number(item.trackTimeMillis ?? 0),
      previewUrl: item.previewUrl ? String(item.previewUrl) : undefined,
      coverUrl: itunesArtworkUrl(item.artworkUrl100 ?? item.artworkUrl60),
      source: "itunes",
    });
  }
  return results;
}

/** 同一首歌只保留得分最高的一条，并合并专辑等元数据 */
function dedupeOnePerSong(
  items: MusicSearchResult[],
  query: { title: string; artist: string },
  keywords: string[],
): MusicSearchResult[] {
  const best = new Map<string, MusicSearchResult>();

  for (const item of items) {
    const key = songKey(item.title, item.artist, query);
    const prev = best.get(key);
    if (!prev) {
      best.set(key, item);
      continue;
    }
    const merged = mergeResult(
      scoreCandidate(query, item, keywords) >= scoreCandidate(query, prev, keywords) ? item : prev,
      scoreCandidate(query, item, keywords) >= scoreCandidate(query, prev, keywords) ? prev : item,
    );
    best.set(key, merged);
  }

  return [...best.values()].sort(
    (a, b) => scoreCandidate(query, b, keywords) - scoreCandidate(query, a, keywords),
  );
}

export async function searchMusicOnline(query: string, limit = 20): Promise<MusicSearchResult[]> {
  const q = query.trim();
  if (!q) throw new Error("请输入搜索关键词");

  const hint = splitQuery(q);
  const keywords = extractQueryKeywords(q, hint);
  const searchTerm =
    hint.artist && hint.title ? `${hint.artist} ${hint.title}`.trim() : hint.artist || hint.title || q;
  const [broad, focused] = await Promise.all([
    searchItunes(q, limit * 3, hint).catch(() => []),
    searchTerm !== q ? searchItunes(searchTerm, limit * 3, hint).catch(() => [] as MusicSearchResult[]) : Promise.resolve([]),
  ]);
  const itunes = [...focused, ...broad];
  const merged = dedupeOnePerSong(itunes, hint, keywords);
  const relevant = merged.filter((item) => isRelevantResult(item, hint));
  const picked = (relevant.length ? relevant : merged).slice(0, limit);

  if (!picked.length) throw new Error("未找到相关歌曲，请换关键词或上传本地文件");
  return picked;
}

export { formatResultLabel };

export function detectPlatform(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.includes("bilibili.com") || lower.includes("b23.tv")) return "bilibili";
  if (lower.includes("douyin.com") || lower.includes("iesdouyin.com")) return "douyin";
  if (lower.includes("xiaohongshu.com") || lower.includes("xhslink.com")) return "xiaohongshu";
  return null;
}

function extractBvid(url: string): string | null {
  const match = url.match(/BV[a-zA-Z0-9]+/);
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
  const play = await fetchJson<{
    data?: { dash?: { audio?: { baseUrl?: string; base_url?: string }[] } };
  }>(
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
      return {
        platform: "bilibili",
        title: "Bilibili 视频",
        author: "",
        durationSec: 0,
        originalUrl: trimmed,
      };
    }
  }
  if (platform === "douyin" || platform === "xiaohongshu") {
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

export function formatDurationMs(ms: number): string {
  if (!ms) return "--:--";
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDurationSec(sec: number): string {
  if (!sec) return "--:--";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

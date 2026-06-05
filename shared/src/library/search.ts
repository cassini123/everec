import type { LinkParseResult, MusicSearchResult } from "../types";
import { USER_AGENT } from "../constants";
import { enrichSearchResult, isRemixTitle } from "./resolve";

const KUGOU_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";

async function fetchJson<T>(url: string, referer?: string, userAgent = USER_AGENT): Promise<T> {
  const headers: Record<string, string> = { "User-Agent": userAgent };
  if (referer) headers.Referer = referer;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "");
}

function searchQueries(query: string): string[] {
  const trimmed = query.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const queries = [trimmed];
  if (parts.length > 1) queries.push(parts[parts.length - 1]!);
  return [...new Set(queries)];
}

function dedupeById(results: MusicSearchResult[]): MusicSearchResult[] {
  const seen = new Set<string>();
  const out: MusicSearchResult[] = [];
  for (const item of results) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function scoreResult(query: string, result: MusicSearchResult): number {
  const q = query.trim().toLowerCase();
  const title = result.title.toLowerCase();
  const artist = result.artist.toLowerCase();
  let score = 0;

  if (title.includes(q) || q.includes(title)) score += 100;
  for (const part of q.split(/\s+/)) {
    if (part && (title.includes(part) || artist.includes(part))) score += 20;
  }
  if (isRemixTitle(result.title) && !/dj|版|remix|live/i.test(q)) score -= 50;
  if (result.previewUrl) score += 15;

  const sourceBoost = { bilibili: 8, netease: 6, qq: 5, kugou: 4, itunes: 2 };
  score += sourceBoost[result.source as keyof typeof sourceBoost] ?? 0;
  return score;
}

function rankResults(query: string, results: MusicSearchResult[]): MusicSearchResult[] {
  return [...results].sort((a, b) => scoreResult(query, b) - scoreResult(query, a));
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
  const match = url.slice(idx).match(/^BV[a-zA-Z0-9]+/);
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
  const url = `https://music.163.com/api/cloudsearch/pc?s=${encodeURIComponent(query)}&type=1&offset=0&limit=${limit}`;
  const data = await fetchJson<{ result?: { songs?: Record<string, unknown>[] } }>(
    url,
    "https://music.163.com/",
  );
  const results: MusicSearchResult[] = [];
  for (const song of data.result?.songs ?? []) {
    const id = String(song.id ?? "");
    if (!id) continue;
    const artists =
      (song.ar as { name?: string }[] | undefined)?.map((a) => a.name ?? "").filter(Boolean) ?? [];
    const album = song.al as { name?: string; picUrl?: string } | undefined;
    results.push({
      id: `netease:${id}`,
      title: String(song.name ?? "Unknown"),
      artist: artists.length ? artists.join(", ") : "Unknown",
      album: album?.name ?? "",
      durationMs: Number(song.dt ?? 0),
      coverUrl: album?.picUrl ? String(album.picUrl) : undefined,
      source: "netease",
    });
  }
  return results;
}

async function searchQQOnce(query: string, limit: number): Promise<MusicSearchResult[]> {
  const url = `https://c6.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?format=json&key=${encodeURIComponent(query)}`;
  const data = await fetchJson<{
    data?: { song?: { itemlist?: Record<string, unknown>[] } };
  }>(url, "https://y.qq.com/");
  const results: MusicSearchResult[] = [];
  for (const item of data.data?.song?.itemlist ?? []) {
    const id = String(item.id ?? "");
    const mid = String(item.mid ?? "");
    if (!id) continue;
    results.push({
      id: mid ? `qq:${id}:${mid}` : `qq:${id}`,
      title: String(item.name ?? "Unknown"),
      artist: String(item.singer ?? "Unknown"),
      album: "",
      durationMs: 0,
      source: "qq",
    });
    if (results.length >= limit) break;
  }
  return results;
}

async function searchQQ(query: string, limit: number): Promise<MusicSearchResult[]> {
  const merged: MusicSearchResult[] = [];
  for (const q of searchQueries(query)) {
    merged.push(...(await searchQQOnce(q, limit)));
    if (merged.length >= limit) break;
  }
  return dedupeById(merged).slice(0, limit);
}

async function searchKugouOnce(query: string, limit: number): Promise<MusicSearchResult[]> {
  const url = `http://mobilecdn.kugou.com/api/v3/search/song?format=json&keyword=${encodeURIComponent(query)}&page=1&pagesize=${limit}&showtype=1`;
  const data = await fetchJson<{ data?: { info?: Record<string, unknown>[] } }>(
    url,
    "https://www.kugou.com/",
    KUGOU_USER_AGENT,
  );
  const results: MusicSearchResult[] = [];
  for (const song of data.data?.info ?? []) {
    const hash = String(song.hash ?? "");
    if (!hash) continue;
    const albumId = String(song.album_id ?? "");
    results.push({
      id: albumId ? `kugou:${hash}:${albumId}` : `kugou:${hash}`,
      title: String(song.songname ?? "Unknown"),
      artist: String(song.singername ?? "Unknown"),
      album: String(song.album_name ?? ""),
      durationMs: Number(song.duration ?? 0) * 1000,
      source: "kugou",
    });
  }
  return results;
}

async function searchKugou(query: string, limit: number): Promise<MusicSearchResult[]> {
  const merged: MusicSearchResult[] = [];
  for (const q of searchQueries(query)) {
    merged.push(...(await searchKugouOnce(q, limit)));
    if (merged.length >= limit) break;
  }
  return dedupeById(merged).slice(0, limit);
}

async function searchBilibili(query: string, limit: number): Promise<MusicSearchResult[]> {
  const results: MusicSearchResult[] = [];
  const seen = new Set<string>();

  for (const keyword of searchQueries(query)) {
    const url = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(keyword)}&page=1`;
    const data = await fetchJson<{ data?: { result?: Record<string, unknown>[] } }>(
      url,
      "https://search.bilibili.com",
    );

    for (const item of data.data?.result ?? []) {
      const bvid = String(item.bvid ?? "");
      if (!bvid || seen.has(bvid)) continue;
      seen.add(bvid);

      const title = stripHtml(String(item.title ?? ""));
      const author = String(item.author ?? "");
      const durationText = String(item.duration ?? "0:0");
      const [m, s] = durationText.split(":").map(Number);
      const durationMs = ((m || 0) * 60 + (s || 0)) * 1000;
      const pic = item.pic ? String(item.pic) : undefined;

      results.push({
        id: `bilibili:${bvid}`,
        title,
        artist: author,
        album: "Bilibili",
        durationMs,
        coverUrl: pic?.startsWith("//") ? `https:${pic}` : pic,
        source: "bilibili",
      });
      if (results.length >= limit) return results;
    }
  }

  return results;
}

export async function searchMusicOnline(query: string, limit = 20): Promise<MusicSearchResult[]> {
  const q = query.trim();
  if (!q) throw new Error("请输入搜索关键词");

  const perSource = Math.max(8, limit);
  const [netease, qq, kugou, itunes, bilibili] = await Promise.all([
    searchNetease(q, perSource).catch(() => []),
    searchQQ(q, perSource).catch(() => []),
    searchKugou(q, perSource).catch(() => []),
    searchItunes(q, perSource).catch(() => []),
    searchBilibili(q, perSource).catch(() => []),
  ]);

  const merged = rankResults(
    q,
    dedupeById([...netease, ...qq, ...kugou, ...bilibili, ...itunes]),
  ).slice(0, Math.max(limit, 24));

  const enriched = await Promise.all(
    merged.slice(0, 8).map((item) => enrichSearchResult(item, bilibili).catch(() => item)),
  );
  const rest = merged.slice(8);
  const results = [...enriched, ...rest];
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
  if (platform === "douyin" || platform === "xiaohongshu" || platform === "bilibili") {
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

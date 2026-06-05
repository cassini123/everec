import type { MusicSearchResult } from "../types";
import { USER_AGENT } from "../constants";

const BILI_REFERER = "https://www.bilibili.com";

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "");
}

function extractBvid(url: string): string | null {
  const match = url.match(/BV[a-zA-Z0-9]+/);
  return match ? match[0] : null;
}

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

export function isRemixTitle(title: string): boolean {
  const t = title.toLowerCase();
  return (
    /\bdj\b/i.test(title) ||
    /remix/i.test(title) ||
    /\(.*版\)/.test(title) ||
    /（.*版）/.test(title) ||
    /live/i.test(t)
  );
}

export async function getBilibiliAudioUrl(bvid: string): Promise<string | null> {
  const info = await fetchJson<{ code?: number; data?: { cid?: number } }>(
    `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
    BILI_REFERER,
  );
  if (info.code !== 0 || !info.data?.cid) return null;

  const play = await fetchJson<{
    data?: { dash?: { audio?: { baseUrl?: string; base_url?: string }[] } };
  }>(
    `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${info.data.cid}&fnval=16&qn=0`,
    BILI_REFERER,
  );
  const audio = play.data?.dash?.audio?.[0];
  return audio?.baseUrl ?? audio?.base_url ?? null;
}

export async function findBilibiliAudio(
  title: string,
  artist: string,
): Promise<{ bvid: string; audioUrl: string; videoTitle: string; coverUrl?: string } | null> {
  const queries = [`${artist} ${title}`.trim(), title.trim()].filter(Boolean);
  const seen = new Set<string>();

  for (const keyword of queries) {
    const url = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(keyword)}&page=1`;
    const data = await fetchJson<{
      data?: { result?: Record<string, unknown>[] };
    }>(url, "https://search.bilibili.com");

    for (const item of data.data?.result ?? []) {
      const bvid = String(item.bvid ?? "");
      if (!bvid || seen.has(bvid)) continue;
      seen.add(bvid);

      const rawTitle = stripHtml(String(item.title ?? ""));
      const author = String(item.author ?? "");
      const titleLower = title.toLowerCase();
      const artistLower = artist.toLowerCase();

      if (!rawTitle.toLowerCase().includes(titleLower.replace(/\s/g, ""))) continue;
      const artistToken = artistLower.split(/[,、/]/)[0]!.trim().replace(/\s/g, "");
      if (artistToken && artistToken !== "unknown") {
        const inTitle = rawTitle.toLowerCase().replace(/\s/g, "").includes(artistToken);
        const inAuthor = author.toLowerCase().replace(/\s/g, "").includes(artistToken);
        if (!inTitle && !inAuthor) continue;
      }

      const audioUrl = await getBilibiliAudioUrl(bvid);
      if (!audioUrl) continue;

      const pic = item.pic ? String(item.pic) : undefined;
      return {
        bvid,
        audioUrl,
        videoTitle: rawTitle,
        coverUrl: pic?.startsWith("//") ? `https:${pic}` : pic,
      };
    }
  }

  return null;
}

export async function resolveMusicAudioUrl(result: MusicSearchResult): Promise<{
  url: string;
  referer?: string;
  ext: string;
}> {
  if (result.source === "itunes" && result.previewUrl) {
    return { url: result.previewUrl, ext: result.previewUrl.includes(".m4a") ? "m4a" : "mp3" };
  }

  if (result.source === "bilibili") {
    const bvid = result.id.replace("bilibili:", "");
    const audioUrl = result.previewUrl ?? (await getBilibiliAudioUrl(bvid));
    if (!audioUrl) throw new Error("无法解析 Bilibili 音频");
    return { url: audioUrl, referer: BILI_REFERER, ext: "m4a" };
  }

  const bvid = result.playBvid;
  if (bvid) {
    const audioUrl = await getBilibiliAudioUrl(bvid);
    if (audioUrl) return { url: audioUrl, referer: BILI_REFERER, ext: "m4a" };
  }

  if (result.previewUrl) {
    return { url: result.previewUrl, referer: BILI_REFERER, ext: "m4a" };
  }

  const bili = await findBilibiliAudio(result.title, result.artist);
  if (bili) {
    return { url: bili.audioUrl, referer: BILI_REFERER, ext: "m4a" };
  }

  throw new Error("暂时无法解析该歌曲的播放地址，请换一条结果或上传本地文件");
}

export async function enrichSearchResult(
  result: MusicSearchResult,
  bilibiliPool: MusicSearchResult[] = [],
): Promise<MusicSearchResult> {
  if (result.previewUrl || result.source === "itunes") return result;

  if (result.source === "bilibili") {
    const bvid = result.id.replace("bilibili:", "");
    const audioUrl = await getBilibiliAudioUrl(bvid);
    return audioUrl ? { ...result, previewUrl: audioUrl, playBvid: bvid } : result;
  }

  for (const candidate of bilibiliPool) {
    if (candidate.source !== "bilibili") continue;
    const titleMatch = candidate.title.toLowerCase().includes(result.title.toLowerCase());
    const artistToken = result.artist.split(/[,、/]/)[0]?.trim().toLowerCase() ?? "";
    const artistMatch =
      !artistToken ||
      candidate.title.toLowerCase().includes(artistToken) ||
      candidate.artist.toLowerCase().includes(artistToken);
    if (!titleMatch || !artistMatch) continue;
    const bvid = candidate.id.replace("bilibili:", "");
    const audioUrl = await getBilibiliAudioUrl(bvid);
    if (audioUrl) {
      return {
        ...result,
        previewUrl: audioUrl,
        playBvid: bvid,
        coverUrl: result.coverUrl ?? candidate.coverUrl,
      };
    }
  }

  const bili = await findBilibiliAudio(result.title, result.artist);
  if (!bili) return result;
  return {
    ...result,
    previewUrl: bili.audioUrl,
    playBvid: bili.bvid,
    coverUrl: result.coverUrl ?? bili.coverUrl,
  };
}

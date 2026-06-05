import type { MusicSearchResult } from "../types";
import { USER_AGENT } from "../constants";

const BILI_REFERER = "https://www.bilibili.com";

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

import { isRemixOrLive } from "./parseTitle";

export { isRemixOrLive as isRemixTitle };

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

export async function findBilibiliAudioByQuery(
  title: string,
  artist: string,
): Promise<{ bvid: string; audioUrl: string; coverUrl?: string } | null> {
  const queries = [`${artist} ${title}`.trim(), title.trim()].filter(Boolean);
  const seen = new Set<string>();

  for (const keyword of queries) {
    const url = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(keyword)}&page=1`;
    const data = await fetchJson<{ data?: { result?: Record<string, unknown>[] } }>(
      url,
      "https://search.bilibili.com",
    );

    for (const item of data.data?.result ?? []) {
      const bvid = String(item.bvid ?? "");
      if (!bvid || seen.has(bvid)) continue;
      seen.add(bvid);

      const rawTitle = String(item.title ?? "").replace(/<[^>]+>/g, "");
      const titleLower = title.toLowerCase();
      if (!rawTitle.toLowerCase().includes(titleLower.replace(/\s/g, ""))) continue;

      const audioUrl = await getBilibiliAudioUrl(bvid);
      if (!audioUrl) continue;

      const pic = item.pic ? String(item.pic) : undefined;
      return {
        bvid,
        audioUrl,
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

  const bvid =
    result.playBvid ??
    (result.id.startsWith("internet:") ? result.id.replace("internet:", "") : null) ??
    (result.id.startsWith("bilibili:") ? result.id.replace("bilibili:", "") : null);

  if (bvid) {
    const audioUrl = result.previewUrl ?? (await getBilibiliAudioUrl(bvid));
    if (audioUrl) return { url: audioUrl, referer: BILI_REFERER, ext: "m4a" };
  }

  const bili = await findBilibiliAudioByQuery(result.title, result.artist);
  if (bili) return { url: bili.audioUrl, referer: BILI_REFERER, ext: "m4a" };

  throw new Error("暂时无法解析该歌曲，请换一条结果或上传本地文件");
}

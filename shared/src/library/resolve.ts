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

/** 链接解析用：从 Bilibili BV 号提取音频直链 */
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

export async function resolveMusicAudioUrl(result: MusicSearchResult): Promise<{
  url: string;
  referer?: string;
  ext: string;
}> {
  if (result.previewUrl) {
    return {
      url: result.previewUrl,
      ext: result.previewUrl.includes(".m4a") ? "m4a" : "mp3",
    };
  }

  const bvid = result.playBvid ?? (result.id.startsWith("bilibili:") ? result.id.slice("bilibili:".length) : "");
  if (result.source === "bilibili" && bvid) {
    const url = await getBilibiliAudioUrl(bvid);
    if (url) {
      return {
        url,
        referer: BILI_REFERER,
        ext: url.includes(".mp3") ? "mp3" : "m4a",
      };
    }
  }

  throw new Error("暂时无法解析该歌曲，请换一条结果或上传本地文件");
}

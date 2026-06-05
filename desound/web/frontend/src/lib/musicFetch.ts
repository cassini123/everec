import { api } from "./api";
import type { LinkParseResult, MusicSearchResult, SoundAsset } from "@everec/shared";

// Web 端必须通过后端 API 搜索，浏览器直连音乐平台会被 CORS 拦截
export const searchMusicOnline = (q: string, limit = 20) => api.searchMusicOnline(q, limit);

export const parseMediaUrl = (url: string) => api.parseMediaUrl(url);

export async function saveSearchResultToLibrary(result: MusicSearchResult): Promise<SoundAsset> {
  return api.saveSearchResult(result);
}

export async function saveLinkToLibrary(
  link: LinkParseResult & { downloadUrl?: string; referer?: string; ext?: string },
): Promise<SoundAsset> {
  return api.saveLinkResult(link);
}

export async function checkYtdlpAvailable(): Promise<boolean> {
  return true;
}

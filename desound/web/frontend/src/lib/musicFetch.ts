import { api } from "./api";
import type { LinkParseResult, MusicSearchResult, SoundAsset } from "@everec/shared";
import { parseMediaUrl, searchMusicOnline } from "@everec/shared";

export { searchMusicOnline, parseMediaUrl };

export async function saveSearchResultToLibrary(result: MusicSearchResult): Promise<SoundAsset> {
  return api.saveSearchResult(result);
}

export async function saveLinkToLibrary(link: LinkParseResult): Promise<SoundAsset> {
  return api.saveLinkResult(link);
}

export async function checkYtdlpAvailable(): Promise<boolean> {
  return true;
}

import { USER_AGENT } from "../constants";
import type { SfxSearchResult } from "../types";

export type { SfxSearchResult };

const CN_QUERY_MAP: Record<string, string> = {
  树木莎莎: "tree leaves rustling wind",
  树木: "tree wind forest",
  莎莎: "rustling leaves",
  点赞: "like button click social",
  点击: "ui click button",
  按钮: "button click ui",
  雨: "rain ambience",
  下雨: "rain ambience",
  雷声: "thunder",
  打雷: "thunder storm",
  脚步: "footsteps walking",
  走路: "footsteps walking",
  开门: "door open creak",
  关门: "door close slam",
  爆炸: "explosion impact",
  鸟叫: "bird chirp nature",
  鸟鸣: "bird chirp nature",
  海浪: "ocean waves sea",
  风声: "wind ambience",
  火焰: "fire crackle",
  燃烧: "fire crackle",
  人群: "crowd ambience",
  汽车: "car engine vehicle",
  刹车: "car brake skid",
  键盘: "keyboard typing",
  玻璃: "glass break",
  金属: "metal hit clang",
  水滴: "water drop",
  狗叫: "dog bark",
  猫叫: "cat meow",
  _whoosh: "whoosh swoosh",
};

const CURATED_SFX: SfxSearchResult[] = [
  {
    id: "mixkit:like",
    title: "点赞 · 清脆提示",
    previewUrl: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
    source: "mixkit",
  },
  {
    id: "mixkit:click",
    title: "点击 · UI 按钮",
    previewUrl: "https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3",
    source: "mixkit",
  },
  {
    id: "mixkit:wind-leaves",
    title: "树木莎莎 · 风吹树叶",
    previewUrl: "https://assets.mixkit.co/active_storage/sfx/1209/1209-preview.mp3",
    source: "mixkit",
  },
  {
    id: "mixkit:forest",
    title: "森林 · 环境风声",
    previewUrl: "https://assets.mixkit.co/active_storage/sfx/1210/1210-preview.mp3",
    source: "mixkit",
  },
  {
    id: "mixkit:notification",
    title: "通知 · 短促提示音",
    previewUrl: "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3",
    source: "mixkit",
  },
];

const SEARCH_TIMEOUT_MS = 10_000;
const OPENVERSE_API = "https://api.openverse.org/v1/audio/";
const ARCHIVE_SEARCH_API = "https://archive.org/advancedsearch.php";
const ARCHIVE_METADATA_API = "https://archive.org/metadata";

function expandQuery(query: string): string {
  const q = query.trim();
  if (!q) return "";
  for (const [cn, en] of Object.entries(CN_QUERY_MAP)) {
    if (q.includes(cn)) return `${q} ${en}`;
  }
  return q;
}

function scoreSfx(query: string, item: SfxSearchResult): number {
  const q = query.toLowerCase().replace(/\s/g, "");
  const blob = `${item.title}${item.id}`.toLowerCase().replace(/\s/g, "");
  let score = 0;
  for (const token of query.split(/\s+/)) {
    const t = token.trim().toLowerCase();
    if (t.length > 1 && blob.includes(t.replace(/\s/g, ""))) score += 10;
  }
  if (blob.includes(q)) score += 50;
  for (const cn of Object.keys(CN_QUERY_MAP)) {
    if (query.includes(cn) && item.title.includes(cn.split("").slice(0, 2).join(""))) score += 20;
  }
  return score;
}

function sourcePriority(source: string): number {
  if (source.startsWith("openverse")) return 300;
  if (source.startsWith("archive")) return 250;
  if (source.startsWith("wikimedia")) return 200;
  return 50;
}

function combinedScore(query: string, item: SfxSearchResult): number {
  return Math.max(scoreSfx(query, item), scoreSfx(expandQuery(query), item)) + sourcePriority(item.source);
}

function cleanTitle(title: string | undefined, fallback = "Sound effect"): string {
  return (title ?? fallback)
    .replace(/^File:/, "")
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isHttpUrl(url: string | undefined): url is string {
  return !!url && /^https?:\/\//i.test(url);
}

function inferFileType(url: string, explicit?: string): string | undefined {
  const fileType = explicit?.toLowerCase().replace(/^\./, "");
  if (fileType && /^[a-z0-9]+$/.test(fileType)) return fileType;
  const path = url.split("?")[0].split("#")[0];
  const match = path.match(/\.([a-z0-9]{2,5})$/i);
  return match?.[1]?.toLowerCase();
}

function toDurationMs(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 10_000 ? Math.round(value) : Math.round(value * 1000);
  }
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const numeric = Number(trimmed);
  if (Number.isFinite(numeric)) return numeric > 10_000 ? Math.round(numeric) : Math.round(numeric * 1000);
  const parts = trimmed.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return undefined;
  const seconds = parts.reduce((total, part) => total * 60 + part, 0);
  return Math.round(seconds * 1000);
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function searchOpenverse(query: string, limit: number): Promise<SfxSearchResult[]> {
  const url =
    `${OPENVERSE_API}?` +
    new URLSearchParams({
      q: expandQuery(query),
      page_size: String(Math.min(Math.max(limit, 1), 50)),
      mature: "false",
    });
  const data = await fetchJson<{
    results?: {
      id?: string;
      title?: string;
      url?: string;
      creator?: string;
      license?: string;
      license_url?: string;
      provider?: string;
      source?: string;
      filetype?: string;
      duration?: number | string;
      foreign_landing_url?: string;
    }[];
  }>(url);

  return (data.results ?? [])
    .filter((item) => isHttpUrl(item.url))
    .map((item) => {
      const provider = item.provider || item.source || "audio";
      const license = item.license ? `CC ${item.license.toUpperCase()}` : undefined;
      return {
        id: `openverse:${provider}:${item.id ?? encodeURIComponent(item.url!)}`,
        title: cleanTitle(item.title),
        previewUrl: item.url!,
        source: `openverse:${provider}`,
        sourceLabel: `Openverse · ${provider}`,
        sourceUrl: item.foreign_landing_url,
        creator: item.creator,
        license,
        fileType: inferFileType(item.url!, item.filetype),
        durationMs: toDurationMs(item.duration),
      };
    });
}

function archiveSearchQuery(query: string): string {
  const term = expandQuery(query).replace(/[\\"]/g, " ").trim();
  if (!term) return "mediatype:audio";
  return `(title:(${term}) OR description:(${term}) OR subject:(${term})) AND mediatype:audio`;
}

function encodeArchivePath(pathname: string): string {
  return pathname.split("/").map(encodeURIComponent).join("/");
}

function pickArchiveAudio(files: ArchiveMetadataFile[] | undefined): ArchiveMetadataFile | undefined {
  const audioFormats = ["VBR MP3", "MP3", "Ogg Vorbis", "WAVE", "FLAC", "M4A"];
  return files
    ?.filter((file) => file.name && audioFormats.some((format) => file.format?.toLowerCase().includes(format.toLowerCase())))
    .sort((a, b) => {
      const aMp3 = a.name?.toLowerCase().endsWith(".mp3") ? 1 : 0;
      const bMp3 = b.name?.toLowerCase().endsWith(".mp3") ? 1 : 0;
      return bMp3 - aMp3;
    })[0];
}

interface ArchiveSearchDoc {
  identifier?: string;
  title?: string;
  creator?: string | string[];
}

interface ArchiveMetadataFile {
  name?: string;
  format?: string;
  length?: string;
}

async function searchInternetArchive(query: string, limit: number): Promise<SfxSearchResult[]> {
  const params = new URLSearchParams({
    q: archiveSearchQuery(query),
    rows: String(Math.min(Math.max(limit, 1), 8)),
    output: "json",
  });
  for (const field of ["identifier", "title", "creator"]) params.append("fl[]", field);
  const url = `${ARCHIVE_SEARCH_API}?${params.toString()}`;
  const data = await fetchJson<{ response?: { docs?: ArchiveSearchDoc[] } }>(url);
  const docs = (data.response?.docs ?? []).filter((doc) => doc.identifier);
  const results = await Promise.all(
    docs.map(async (doc): Promise<SfxSearchResult | null> => {
      const identifier = doc.identifier!;
      const metadata = await fetchJson<{
        files?: ArchiveMetadataFile[];
        metadata?: { title?: string; creator?: string | string[] };
      }>(`${ARCHIVE_METADATA_API}/${encodeURIComponent(identifier)}`);
      const file = pickArchiveAudio(metadata.files);
      if (!file?.name) return null;
      const previewUrl = `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeArchivePath(file.name)}`;
      const creator = metadata.metadata?.creator ?? doc.creator;
      return {
        id: `archive:${identifier}:${file.name}`,
        title: cleanTitle(metadata.metadata?.title ?? doc.title ?? file.name),
        previewUrl,
        source: "archive",
        sourceLabel: "Internet Archive",
        sourceUrl: `https://archive.org/details/${encodeURIComponent(identifier)}`,
        creator: Array.isArray(creator) ? creator.join(", ") : creator,
        license: "Archive.org",
        fileType: inferFileType(previewUrl),
        durationMs: toDurationMs(file.length),
      };
    }),
  );
  return results.filter((item): item is SfxSearchResult => !!item);
}

async function searchWikimedia(query: string, limit: number): Promise<SfxSearchResult[]> {
  const searchTerm = expandQuery(query);
  const url =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: `filetype:audio ${searchTerm}`,
      gsrnamespace: "6",
      prop: "imageinfo",
      iiprop: "url|mime|size|extmetadata",
      gsrlimit: String(limit),
      format: "json",
      origin: "*",
    });

  const data = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          imageinfo?: {
            url?: string;
            mime?: string;
            descriptionurl?: string;
            extmetadata?: {
              Artist?: { value?: string };
              LicenseShortName?: { value?: string };
            };
          }[];
        }
      >;
    };
  }>(url);

  const results: SfxSearchResult[] = [];
  for (const page of Object.values(data.query?.pages ?? {})) {
    const info = page.imageinfo?.[0];
    const fileUrl = info?.url;
    if (!fileUrl || !info.mime?.startsWith("audio")) continue;
    results.push({
      id: `wikimedia:${encodeURIComponent(page.title ?? fileUrl)}`,
      title: cleanTitle(page.title),
      previewUrl: fileUrl,
      source: "wikimedia",
      sourceLabel: "Wikimedia Commons",
      sourceUrl: info.descriptionurl,
      creator: info.extmetadata?.Artist?.value?.replace(/<[^>]+>/g, ""),
      license: info.extmetadata?.LicenseShortName?.value?.replace(/<[^>]+>/g, ""),
      fileType: inferFileType(fileUrl, info.mime.split("/")[1]),
    });
  }
  return results;
}

export async function searchSfxOnline(query: string, limit = 12): Promise<SfxSearchResult[]> {
  const q = query.trim();
  if (!q) throw new Error("请输入音效关键词");

  const curated = CURATED_SFX.filter((item) => scoreSfx(q, item) > 0 || q.length <= 4)
    .sort((a, b) => scoreSfx(q, b) - scoreSfx(q, a));

  const [openverse, archive, wikimedia] = await Promise.all([
    searchOpenverse(q, limit).catch(() => []),
    searchInternetArchive(q, Math.ceil(limit / 2)).catch(() => []),
    searchWikimedia(q, limit).catch(() => []),
  ]);
  const merged = [...openverse, ...archive, ...wikimedia, ...curated];
  const seen = new Set<string>();
  const unique: SfxSearchResult[] = [];

  for (const item of merged.sort((a, b) => combinedScore(q, b) - combinedScore(q, a))) {
    const key = item.previewUrl.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
    if (unique.length >= limit) break;
  }

  if (!unique.length) throw new Error("未找到相关音效，请换关键词");
  return unique;
}

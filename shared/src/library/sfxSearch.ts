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
  雷声: "thunder",
  脚步: "footsteps walking",
  开门: "door open creak",
  爆炸: "explosion impact",
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
      iiprop: "url|mime|size",
      gsrlimit: String(limit),
      format: "json",
      origin: "*",
    });

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    query?: { pages?: Record<string, { title?: string; imageinfo?: { url?: string; mime?: string }[] }> };
  };

  const results: SfxSearchResult[] = [];
  for (const page of Object.values(data.query?.pages ?? {})) {
    const info = page.imageinfo?.[0];
    const fileUrl = info?.url;
    if (!fileUrl || !info.mime?.startsWith("audio")) continue;
    const title = (page.title ?? "Sound").replace(/^File:/, "").replace(/\.[^.]+$/, "");
    results.push({
      id: `wikimedia:${encodeURIComponent(title)}`,
      title,
      previewUrl: fileUrl,
      source: "wikimedia",
    });
  }
  return results;
}

export async function searchSfxOnline(query: string, limit = 12): Promise<SfxSearchResult[]> {
  const q = query.trim();
  if (!q) throw new Error("请输入音效关键词");

  const curated = CURATED_SFX.filter((item) => scoreSfx(q, item) > 0 || q.length <= 4)
    .sort((a, b) => scoreSfx(q, b) - scoreSfx(q, a));

  const remote = await searchWikimedia(q, limit).catch(() => []);
  const merged = [...curated, ...remote];
  const seen = new Set<string>();
  const unique: SfxSearchResult[] = [];

  for (const item of merged.sort((a, b) => scoreSfx(q, b) - scoreSfx(q, a))) {
    if (seen.has(item.previewUrl)) continue;
    seen.add(item.previewUrl);
    unique.push(item);
    if (unique.length >= limit) break;
  }

  if (!unique.length) throw new Error("未找到相关音效，请换关键词");
  return unique;
}

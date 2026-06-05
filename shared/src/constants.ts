import type { LibraryCategory } from "./types";

export const LIBRARY_CATEGORIES: LibraryCategory[] = ["all", "imported", "foley", "music"];

export const CATEGORY_LABELS: Record<LibraryCategory, string> = {
  all: "全部",
  imported: "导入",
  foley: "拟音",
  music: "音乐",
};

export const PLATFORM_LABELS: Record<string, string> = {
  bilibili: "Bilibili",
  douyin: "抖音",
  xiaohongshu: "小红书",
  itunes: "iTunes",
  netease: "网易云",
};

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

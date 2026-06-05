import type { EverecAppId, EverecProject } from "../types";

const DEMO_PROJECTS: EverecProject[] = [
  {
    id: "demo-knowgo-1",
    title: "夏日短片 · 风格探索",
    appId: "knowgo",
    updatedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    status: "active",
  },
  {
    id: "demo-simcut-1",
    title: "品牌宣传片 v2",
    appId: "simcut",
    updatedAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
    status: "active",
  },
  {
    id: "demo-desound-1",
    title: "城市氛围音效包",
    appId: "desound",
    updatedAt: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(),
    status: "draft",
  },
];

const STORAGE_KEY = "everec-hub-recent";

export function loadRecentProjects(): EverecProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as EverecProject[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return DEMO_PROJECTS;
}

export function saveRecentProject(project: EverecProject): void {
  const existing = loadRecentProjects().filter((p) => p.id !== project.id);
  const updated = [project, ...existing].slice(0, 12);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

export const APP_LABELS: Record<EverecAppId, string> = {
  knowgo: "Knowgo",
  simcut: "Simcut",
  desound: "desound",
  inspibrary: "Inspibrary",
  prerector: "Prerector",
};

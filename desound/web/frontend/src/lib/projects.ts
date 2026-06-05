import type { DesoundProject, DesoundProjectSummary } from "@everec/shared";

const STORAGE_KEY = "desound-projects";
const ACTIVE_KEY = "desound-active-project";

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `ds-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readAll(): DesoundProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DesoundProject[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(projects: DesoundProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function listProjectSummaries(): DesoundProjectSummary[] {
  return readAll()
    .map(({ id, name, soundCount, updatedAt }) => ({ id, name, soundCount, updatedAt }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getProject(id: string): DesoundProject | null {
  return readAll().find((p) => p.id === id) ?? null;
}

export function createProject(name: string): DesoundProject {
  const ts = nowIso();
  const project: DesoundProject = {
    id: newId(),
    name: name.trim() || "未命名项目",
    soundCount: 0,
    tags: [],
    bpm: 120,
    createdAt: ts,
    updatedAt: ts,
  };
  writeAll([project, ...readAll()]);
  return project;
}

export function saveProject(project: DesoundProject): DesoundProject {
  const updated = { ...project, updatedAt: nowIso() };
  writeAll(readAll().map((p) => (p.id === updated.id ? updated : p)));
  return updated;
}

export function deleteProject(id: string) {
  writeAll(readAll().filter((p) => p.id !== id));
  if (getActiveProjectId() === id) {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProjectId(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function ensureDefaultProject(): DesoundProject {
  const existing = readAll();
  if (existing.length > 0) {
    const activeId = getActiveProjectId();
    const active = activeId ? existing.find((p) => p.id === activeId) : null;
    if (active) return active;
    setActiveProjectId(existing[0].id);
    return existing[0];
  }
  const project = createProject("我的音频项目");
  setActiveProjectId(project.id);
  return project;
}

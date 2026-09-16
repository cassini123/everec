const KEY = "everec-hypit-projects";

export interface StoredProject {
  id: string;
  name: string;
  source: string;
  updatedAt: string;
}

export function loadProjects(): StoredProject[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredProject[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProject(project: StoredProject): StoredProject[] {
  const next = [
    project,
    ...loadProjects().filter((p) => p.id !== project.id),
  ].slice(0, 12);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

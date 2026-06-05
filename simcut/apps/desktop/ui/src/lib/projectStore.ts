import type { Clip, Project, ProjectSummary, SubtitleCue, StillFrame } from "../types";

const MANIFEST_KEY = "simcut-projects";

interface Manifest {
  version: number;
  projects: ProjectSummary[];
}

function now() {
  return String(Math.floor(Date.now() / 1000));
}

function projectKey(id: string) {
  return `simcut-project-${id}`;
}

function defaultTracks() {
  return [
    { index: 0, name: "主视频", kind: "video" as const, muted: false, locked: false, clips: [] },
    { index: 1, name: "音频", kind: "audio" as const, muted: false, locked: false, clips: [] },
    { index: 2, name: "字幕", kind: "subtitle" as const, muted: false, locked: false, clips: [] },
  ];
}

function readManifest(): Manifest {
  const raw = localStorage.getItem(MANIFEST_KEY);
  if (!raw) return { version: 1, projects: [] };
  return JSON.parse(raw) as Manifest;
}

function writeManifest(manifest: Manifest) {
  localStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));
}

export function listProjects(): ProjectSummary[] {
  return readManifest().projects;
}

export function createProject(name: string): Project {
  const t = now();
  const project: Project = {
    id: crypto.randomUUID(),
    name,
    fps: 30,
    resolution: [1920, 1080],
    durationMs: 0,
    tracks: defaultTracks(),
    media: [],
    stills: [],
    subtitles: [],
    createdAt: t,
    updatedAt: t,
  };
  saveProject(project);
  const manifest = readManifest();
  manifest.projects.push({
    id: project.id,
    name: project.name,
    durationMs: 0,
    mediaCount: 0,
    updatedAt: t,
  });
  writeManifest(manifest);
  return project;
}

export function loadProject(id: string): Project {
  const raw = localStorage.getItem(projectKey(id));
  if (!raw) throw new Error("项目不存在");
  return JSON.parse(raw) as Project;
}

export function saveProject(project: Project) {
  project.updatedAt = now();
  localStorage.setItem(projectKey(project.id), JSON.stringify(project));
  const manifest = readManifest();
  const summary = manifest.projects.find((p) => p.id === project.id);
  if (summary) {
    summary.name = project.name;
    summary.durationMs = project.durationMs;
    summary.mediaCount = project.media.length;
    summary.updatedAt = project.updatedAt;
    writeManifest(manifest);
  }
}

export function addClip(project: Project, clip: Clip): Project {
  const tracks = project.tracks.map((t) =>
    t.index === clip.trackIndex ? { ...t, clips: [...t.clips, clip] } : t,
  );
  const updated = { ...project, tracks, updatedAt: now() };
  saveProject(updated);
  return updated;
}

export function addSubtitles(project: Project, cues: SubtitleCue[]): Project {
  const updated = {
    ...project,
    subtitles: [...project.subtitles, ...cues],
    updatedAt: now(),
  };
  saveProject(updated);
  return updated;
}

export function addStill(project: Project, still: StillFrame): Project {
  const updated = {
    ...project,
    stills: [...project.stills, still],
    updatedAt: now(),
  };
  saveProject(updated);
  return updated;
}

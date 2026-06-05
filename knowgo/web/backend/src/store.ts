import fs from "node:fs";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import {
  DEFAULT_BRIEF,
  DEFAULT_DOCUMENT,
  DEFAULT_STYLE_GUIDE,
  type InspirationCapture,
  type KnowgoProject,
} from "@everec/shared";
import {
  deleteGraph,
  graphSyncBrief,
  graphSyncCapture,
  graphSyncStyleGuide,
  initGraphForProject,
} from "./graphStore";

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "everec-knowgo")
  : path.join(process.cwd(), "data", "knowgo");

const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const MEDIA_DIR = path.join(DATA_DIR, "media");

function ensureDirs() {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, "[]", "utf-8");
  }
}

function readProjects(): KnowgoProject[] {
  ensureDirs();
  return JSON.parse(fs.readFileSync(PROJECTS_FILE, "utf-8")) as KnowgoProject[];
}

function writeProjects(projects: KnowgoProject[]) {
  ensureDirs();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
}

export function listProjects(): KnowgoProject[] {
  return readProjects().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getProject(id: string): KnowgoProject | undefined {
  return readProjects().find((p) => p.id === id);
}

export function createProject(title = "未命名项目"): KnowgoProject {
  const now = new Date().toISOString();
  const project: KnowgoProject = {
    id: uuidv4(),
    title,
    brief: { ...DEFAULT_BRIEF, title },
    captures: [],
    document: { ...DEFAULT_DOCUMENT, updatedAt: now },
    styleGuide: { ...DEFAULT_STYLE_GUIDE },
    createdAt: now,
    updatedAt: now,
  };
  const projects = readProjects();
  projects.push(project);
  writeProjects(projects);
  initGraphForProject(project.id, title);
  return project;
}

export function updateProject(
  id: string,
  patch: Partial<Omit<KnowgoProject, "id" | "createdAt">>,
): KnowgoProject | undefined {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx < 0) return undefined;
  projects[idx] = {
    ...projects[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeProjects(projects);
  const updated = projects[idx];
  if (patch.brief) graphSyncBrief(id, updated.brief);
  if (patch.styleGuide) graphSyncStyleGuide(id, updated.styleGuide);
  return updated;
}

export function deleteProject(id: string): boolean {
  const projects = readProjects();
  const next = projects.filter((p) => p.id !== id);
  if (next.length === projects.length) return false;
  writeProjects(next);
  deleteGraph(id);
  return true;
}

export function addCapture(
  projectId: string,
  capture: Omit<InspirationCapture, "id" | "createdAt">,
): InspirationCapture | undefined {
  const project = getProject(projectId);
  if (!project) return undefined;
  const item: InspirationCapture = {
    ...capture,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  project.captures.unshift(item);
  updateProject(projectId, { captures: project.captures });
  graphSyncCapture(projectId, item);
  return item;
}

export function saveMediaBuffer(
  buffer: Buffer,
  ext: string,
): { fileName: string; filePath: string } {
  ensureDirs();
  const fileName = `${uuidv4()}.${ext}`;
  const filePath = path.join(MEDIA_DIR, fileName);
  fs.writeFileSync(filePath, buffer);
  return { fileName, filePath };
}

export function getMediaPath(fileName: string): string | undefined {
  ensureDirs();
  const fp = path.join(MEDIA_DIR, fileName);
  return fs.existsSync(fp) ? fp : undefined;
}

export function mediaDir(): string {
  ensureDirs();
  return MEDIA_DIR;
}

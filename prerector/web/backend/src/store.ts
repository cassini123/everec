import { v4 as uuid } from "uuid";
import fs from "node:fs";
import path from "node:path";
import type {
  DashboardStats,
  DecomposeRequest,
  DecomposeResult,
  PrerectorProject,
  PrerectorTask,
  Reminder,
  SyncSession,
  TaskStatus,
  Team,
  TeamMember,
} from "@everec/shared";
import { decomposeProject, rebalanceAssignments } from "./taskEngine";
import { advanceSyncSession, createSyncSession } from "./syncEngine";

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "everec-prerector")
  : path.join(process.cwd(), "data", "prerector");

const STORE_FILE = path.join(DATA_DIR, "store.json");

interface StoreData {
  projects: PrerectorProject[];
  tasks: PrerectorTask[];
  teams: Team[];
  syncSessions: SyncSession[];
  reminders: Reminder[];
}

function emptyStore(): StoreData {
  return { projects: [], tasks: [], teams: [], syncSessions: [], reminders: [] };
}

function migrateStore(data: StoreData): StoreData {
  return {
    ...data,
    projects: data.projects.map((p) => ({
      ...p,
      projectType: p.projectType ?? "video",
      scope: p.scope ?? p.videoDurationMin ?? 5,
      scopeUnit: p.scopeUnit ?? "min",
    })),
  };
}

function load(): StoreData {
  try {
    if (fs.existsSync(STORE_FILE)) {
      return migrateStore(JSON.parse(fs.readFileSync(STORE_FILE, "utf-8")) as StoreData);
    }
  } catch {
    /* fresh store */
  }
  return seedDemo();
}

function save(data: StoreData) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
}

function seedDemo(): StoreData {
  const now = new Date().toISOString();
  const team: Team = {
    id: uuid(),
    name: "品牌短片组",
    createdAt: now,
    members: [
      { id: uuid(), name: "张明", role: "director", color: "#ff6b2c" },
      { id: uuid(), name: "李悦", role: "editor", color: "#4da3ff" },
      { id: uuid(), name: "王浩", role: "colorist", color: "#a78bfa" },
      { id: uuid(), name: "陈音", role: "sound", color: "#3dd68c" },
    ],
  };

  const result = decomposeProject(
    {
      brief: "30 秒品牌宣传片 · A24 风格 · 4K 交付",
      projectType: "video",
      scope: 0.5,
      teamId: team.id,
    },
    team,
  );

  const sync = createSyncSession({
    projectId: result.project.id,
    name: "代理优先同步",
    strategy: "proxy_first",
  });

  const reminders: Reminder[] = result.tasks.slice(0, 3).map((t) => ({
    id: uuid(),
    projectId: result.project.id,
    taskId: t.id,
    title: `截止提醒 · ${t.title}`,
    message: `任务「${t.title}」即将到期，预计 ${t.estimatedHours}h`,
    dueAt: t.dueAt ?? new Date(Date.now() + 86400000).toISOString(),
    notified: false,
    createdAt: now,
  }));

  const data: StoreData = {
    projects: [result.project],
    tasks: result.tasks,
    teams: [team],
    syncSessions: [sync],
    reminders,
  };
  save(data);
  return data;
}

let cache = load();

function persist() {
  save(cache);
}

function getTeam(id?: string): Team | undefined {
  if (!id) return undefined;
  return cache.teams.find((t) => t.id === id);
}

export function getDashboard(): DashboardStats {
  const now = Date.now();
  const week = now + 7 * 86400000;
  return {
    totalTasks: cache.tasks.length,
    doneTasks: cache.tasks.filter((t) => t.status === "done").length,
    inProgressTasks: cache.tasks.filter((t) => t.status === "in_progress").length,
    totalEstimatedHours: cache.tasks.reduce((s, t) => s + t.estimatedHours, 0),
    upcomingReminders: cache.reminders
      .filter((r) => !r.notified && new Date(r.dueAt).getTime() <= week)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 5),
    activeSyncSessions: cache.syncSessions.filter((s) =>
      s.files.some((f) => f.status !== "done"),
    ).length,
  };
}

export function listProjects() {
  return cache.projects;
}

export function listTasks(projectId?: string) {
  return projectId
    ? cache.tasks.filter((t) => t.projectId === projectId)
    : cache.tasks;
}

export function updateTaskStatus(id: string, status: TaskStatus) {
  const idx = cache.tasks.findIndex((t) => t.id === id);
  if (idx < 0) throw new Error("task not found");
  cache.tasks[idx] = { ...cache.tasks[idx], status };
  persist();
  return cache.tasks[idx];
}

export function assignTask(id: string, assigneeId: string) {
  const idx = cache.tasks.findIndex((t) => t.id === id);
  if (idx < 0) throw new Error("task not found");
  cache.tasks[idx] = { ...cache.tasks[idx], assigneeId };
  persist();
  return cache.tasks[idx];
}

export function decompose(req: DecomposeRequest): DecomposeResult {
  const team = getTeam(req.teamId);
  const result = decomposeProject(req, team);
  cache.projects.push(result.project);
  cache.tasks.push(...result.tasks);

  for (const t of result.tasks.slice(0, 2)) {
    cache.reminders.push({
      id: uuid(),
      projectId: result.project.id,
      taskId: t.id,
      title: `新任务 · ${t.title}`,
      message: `难度 ${t.difficulty}/5 · 预估 ${t.estimatedHours}h`,
      dueAt: t.dueAt ?? new Date(Date.now() + 86400000).toISOString(),
      notified: false,
      createdAt: new Date().toISOString(),
    });
  }

  persist();
  return result;
}

export function listTeams() {
  return cache.teams;
}

export function createTeam(name: string, members: Omit<TeamMember, "id">[]) {
  const team: Team = {
    id: uuid(),
    name,
    members: members.map((m) => ({ ...m, id: uuid() })),
    createdAt: new Date().toISOString(),
  };
  cache.teams.push(team);
  persist();
  return team;
}

export function rebalanceTeamTasks(teamId: string) {
  const team = getTeam(teamId);
  if (!team) throw new Error("team not found");
  const projectIds = new Set(
    cache.projects.filter((p) => p.teamId === teamId).map((p) => p.id),
  );
  cache.tasks = cache.tasks.map((t) => {
    if (!projectIds.has(t.projectId)) return t;
    return t;
  });
  const tasks = cache.tasks.filter((t) => projectIds.has(t.projectId));
  const rebalanced = rebalanceAssignments(tasks, team);
  cache.tasks = cache.tasks.map((t) => {
    const updated = rebalanced.find((r) => r.id === t.id);
    return updated ?? t;
  });
  persist();
  return rebalanced;
}

export function listSyncSessions(projectId?: string) {
  return projectId
    ? cache.syncSessions.filter((s) => s.projectId === projectId)
    : cache.syncSessions;
}

export function startSync(input: {
  projectId: string;
  name: string;
  strategy?: SyncSession["strategy"];
  fileNames?: string[];
}) {
  const session = createSyncSession(input);
  cache.syncSessions.push(session);
  persist();
  return session;
}

export function tickSync(sessionId: string) {
  const idx = cache.syncSessions.findIndex((s) => s.id === sessionId);
  if (idx < 0) throw new Error("session not found");
  cache.syncSessions[idx] = advanceSyncSession(cache.syncSessions[idx]);
  persist();
  return cache.syncSessions[idx];
}

export function listReminders(projectId?: string) {
  const list = projectId
    ? cache.reminders.filter((r) => r.projectId === projectId)
    : cache.reminders;
  return list.sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
  );
}

export function createReminder(input: {
  projectId: string;
  taskId?: string;
  title: string;
  message: string;
  dueAt: string;
}) {
  const reminder: Reminder = {
    id: uuid(),
    ...input,
    notified: false,
    createdAt: new Date().toISOString(),
  };
  cache.reminders.push(reminder);
  persist();
  return reminder;
}

export function dismissReminder(id: string) {
  const idx = cache.reminders.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("reminder not found");
  cache.reminders[idx] = { ...cache.reminders[idx], notified: true };
  persist();
  return cache.reminders[idx];
}

export function getDueReminders() {
  const now = Date.now();
  return cache.reminders.filter(
    (r) => !r.notified && new Date(r.dueAt).getTime() <= now,
  );
}

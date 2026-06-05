import type {
  AssessTaskRequest,
  AssessTaskResult,
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
export {
  PROJECT_TYPE_LABELS,
  SCOPE_LABELS,
  DIFFICULTY_LABELS,
} from "@everec/shared";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data as T;
}

export type SyncSessionWithStats = SyncSession & {
  stats: { total: number; done: number; bytesTotal: number; bytesDone: number; percent: number };
};

export const api = {
  getDashboard: () => req<DashboardStats>("/dashboard"),
  listProjects: () => req<PrerectorProject[]>("/projects"),
  listTasks: (projectId?: string) =>
    req<PrerectorTask[]>(`/tasks${projectId ? `?projectId=${projectId}` : ""}`),
  updateTaskStatus: (id: string, status: TaskStatus) =>
    req<PrerectorTask>(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  assignTask: (id: string, assigneeId: string) =>
    req<PrerectorTask>(`/tasks/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeId }),
    }),
  decompose: (body: DecomposeRequest) =>
    req<DecomposeResult>("/tasks/decompose", { method: "POST", body: JSON.stringify(body) }),
  assessTask: (body: AssessTaskRequest) =>
    req<AssessTaskResult>("/tasks/assess", { method: "POST", body: JSON.stringify(body) }),
  listTeams: () => req<Team[]>("/teams"),
  createTeam: (name: string, members: Omit<TeamMember, "id">[]) =>
    req<Team>("/teams", { method: "POST", body: JSON.stringify({ name, members }) }),
  rebalanceTeam: (teamId: string) =>
    req<PrerectorTask[]>(`/teams/${teamId}/rebalance`, { method: "POST" }),
  listSync: (projectId?: string) =>
    req<SyncSessionWithStats[]>(`/sync${projectId ? `?projectId=${projectId}` : ""}`),
  startSync: (body: {
    projectId: string;
    name: string;
    strategy?: "proxy_first" | "timeline_first" | "full";
    fileNames?: string[];
  }) => req<SyncSessionWithStats>("/sync", { method: "POST", body: JSON.stringify(body) }),
  tickSync: (sessionId: string) =>
    req<SyncSessionWithStats>(`/sync/${sessionId}/tick`, { method: "POST" }),
  listReminders: (projectId?: string) =>
    req<Reminder[]>(`/reminders${projectId ? `?projectId=${projectId}` : ""}`),
  createReminder: (body: {
    projectId: string;
    taskId?: string;
    title: string;
    message: string;
    dueAt: string;
  }) => req<Reminder>("/reminders", { method: "POST", body: JSON.stringify(body) }),
  dismissReminder: (id: string) =>
    req<Reminder>(`/reminders/${id}/dismiss`, { method: "POST" }),
  getDueReminders: () => req<Reminder[]>("/reminders/due"),
};

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function formatDue(iso: string): string {
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  if (diff < 0) return "已到期";
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h 后`;
  return `${Math.floor(hours / 24)}d 后`;
}

export const ROLE_LABELS: Record<string, string> = {
  director: "导演",
  editor: "剪辑",
  colorist: "调色",
  sound: "声音",
  producer: "制片",
  other: "成员",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "待办",
  in_progress: "进行中",
  review: "审片中",
  done: "完成",
};

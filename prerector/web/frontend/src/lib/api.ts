import type {
  AssessTaskRequest,
  AssessTaskResult,
  ChatMessage,
  DashboardStats,
  DecomposeRequest,
  DecomposeResult,
  FriendRequest,
  PrerectorProject,
  PrerectorTask,
  Reminder,
  SyncSession,
  TaskStatus,
  Team,
  TeamMember,
  User,
} from "@everec/shared";
export {
  PROJECT_TYPE_LABELS,
  SCOPE_LABELS,
  DIFFICULTY_LABELS,
} from "@everec/shared";

const USER_KEY = "prerector_user_id";

export function getStoredUserId(): string {
  return localStorage.getItem(USER_KEY) ?? "user-me";
}

export function setStoredUserId(id: string) {
  localStorage.setItem(USER_KEY, id);
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": getStoredUserId(),
      ...init?.headers,
    },
    ...init,
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    const preview = text.slice(0, 80).replace(/\s+/g, " ");
    throw new Error(
      res.ok
        ? `API returned non-JSON (${preview})`
        : `API error ${res.status}: ${preview || res.statusText}`,
    );
  }
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? res.statusText);
  }
  return data as T;
}

export type SyncSessionWithStats = SyncSession & {
  stats: { total: number; done: number; bytesTotal: number; bytesDone: number; percent: number };
};

export type FriendRequestWithUser = FriendRequest & { fromUser: User };

export const api = {
  getMe: () => req<User>("/users/me"),
  searchUsers: (q: string) => req<User[]>(`/users/search?q=${encodeURIComponent(q)}`),
  listFriends: () => req<User[]>("/friends"),
  listFriendRequests: () => req<FriendRequestWithUser[]>("/friends/requests"),
  sendFriendRequest: (body: { userId?: string; handle?: string; message?: string }) =>
    req<FriendRequest>("/friends/request", { method: "POST", body: JSON.stringify(body) }),
  acceptFriendRequest: (id: string) =>
    req<FriendRequest>(`/friends/requests/${id}/accept`, { method: "POST" }),
  rejectFriendRequest: (id: string) =>
    req<FriendRequest>(`/friends/requests/${id}/reject`, { method: "POST" }),
  listChatMessages: (teamId: string) => req<ChatMessage[]>(`/chat/${teamId}/messages`),
  sendChatMessage: (teamId: string, content: string) =>
    req<ChatMessage>(`/chat/${teamId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  markChatRead: (teamId: string) =>
    req<{ ok: boolean }>(`/chat/${teamId}/read`, { method: "POST" }),
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
  createTeam: (body: {
    name: string;
    members?: Omit<TeamMember, "id">[];
    friendUserIds?: string[];
    kind?: "production" | "homework";
  }) => req<Team>("/teams", { method: "POST", body: JSON.stringify(body) }),
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

export function formatChatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
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

export const TEAM_KIND_LABELS = {
  production: "制作组",
  homework: "小组作业",
};

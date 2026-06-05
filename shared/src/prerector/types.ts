export type PrerectorWorkspace =
  | "dashboard"
  | "tasks"
  | "teams"
  | "sync"
  | "reminders";

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskDifficulty = 1 | 2 | 3 | 4 | 5;
export type MemberRole = "director" | "editor" | "colorist" | "sound" | "producer" | "other";

export interface TeamMember {
  id: string;
  name: string;
  role: MemberRole;
  color: string;
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  createdAt: string;
}

export interface PrerectorTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  phase: string;
  status: TaskStatus;
  difficulty: TaskDifficulty;
  estimatedHours: number;
  assigneeId?: string;
  parentId?: string;
  dueAt?: string;
  createdAt: string;
}

export interface PrerectorProject {
  id: string;
  name: string;
  brief: string;
  videoDurationMin: number;
  teamId?: string;
  createdAt: string;
}

export type SyncPriority = "proxy" | "timeline" | "raw";
export type SyncStatus = "pending" | "syncing" | "done" | "failed";

export interface SyncFile {
  id: string;
  sessionId: string;
  name: string;
  sizeBytes: number;
  priority: SyncPriority;
  status: SyncStatus;
  progress: number;
  isProxy: boolean;
  mimeType: string;
}

export interface SyncSession {
  id: string;
  projectId: string;
  name: string;
  strategy: "proxy_first" | "timeline_first" | "full";
  files: SyncFile[];
  createdAt: string;
}

export interface Reminder {
  id: string;
  projectId: string;
  taskId?: string;
  title: string;
  message: string;
  dueAt: string;
  notified: boolean;
  createdAt: string;
}

export interface DecomposeRequest {
  brief: string;
  videoDurationMin?: number;
  teamId?: string;
}

export interface DecomposeResult {
  project: PrerectorProject;
  tasks: PrerectorTask[];
}

export interface DashboardStats {
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  totalEstimatedHours: number;
  upcomingReminders: Reminder[];
  activeSyncSessions: number;
}

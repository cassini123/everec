export type PrerectorWorkspace =
  | "dashboard"
  | "tasks"
  | "teams"
  | "friends"
  | "chat"
  | "sync"
  | "reminders";

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskDifficulty = 1 | 2 | 3 | 4 | 5;
export type MemberRole = "director" | "editor" | "colorist" | "sound" | "producer" | "other";

export type ProjectType =
  | "auto"
  | "video"
  | "audio"
  | "design"
  | "software"
  | "campaign"
  | "homework"
  | "general";

export interface User {
  id: string;
  name: string;
  handle: string;
  avatarColor: string;
  bio?: string;
  createdAt: string;
}

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  message?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  teamId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: MemberRole;
  color: string;
  userId?: string;
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  kind?: "production" | "homework";
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
  projectType: Exclude<ProjectType, "auto">;
  scope: number;
  scopeUnit: string;
  teamId?: string;
  createdAt: string;
  /** @deprecated use scope */
  videoDurationMin?: number;
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
  projectType?: ProjectType;
  scope?: number;
  /** 自定义任务列表，每行一项，支持 `- 任务` 或 `任务 | 描述` */
  taskInput?: string;
  teamId?: string;
  /** @deprecated use scope */
  videoDurationMin?: number;
}

export interface DecomposeResult {
  project: PrerectorProject;
  tasks: PrerectorTask[];
}

export interface AssessTaskRequest {
  title: string;
  description?: string;
  brief?: string;
  projectType?: ProjectType;
  scope?: number;
}

export interface AssessTaskResult {
  difficulty: TaskDifficulty;
  estimatedHours: number;
  difficultyLabel: string;
}

export interface DashboardStats {
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  totalEstimatedHours: number;
  upcomingReminders: Reminder[];
  activeSyncSessions: number;
  friendCount: number;
  pendingFriendRequests: number;
  unreadChatCount: number;
}

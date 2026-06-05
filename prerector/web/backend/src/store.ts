import { v4 as uuid } from "uuid";
import fs from "node:fs";
import path from "node:path";
import type {
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
import { decomposeProject, rebalanceAssignments } from "./taskEngine";
import { advanceSyncSession, createSyncSession } from "./syncEngine";

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "everec-prerector")
  : path.join(process.cwd(), "data", "prerector");

const STORE_FILE = path.join(DATA_DIR, "store.json");

interface StoreData {
  users: User[];
  friendRequests: FriendRequest[];
  chatMessages: ChatMessage[];
  chatReadAt: Record<string, Record<string, string>>;
  projects: PrerectorProject[];
  tasks: PrerectorTask[];
  teams: Team[];
  syncSessions: SyncSession[];
  reminders: Reminder[];
}

function migrateStore(data: Partial<StoreData>): StoreData {
  return {
    users: data.users ?? [],
    friendRequests: data.friendRequests ?? [],
    chatMessages: data.chatMessages ?? [],
    chatReadAt: data.chatReadAt ?? {},
    projects: (data.projects ?? []).map((p) => ({
      ...p,
      projectType: p.projectType ?? "video",
      scope: p.scope ?? p.videoDurationMin ?? 5,
      scopeUnit: p.scopeUnit ?? "min",
    })),
    tasks: data.tasks ?? [],
    teams: data.teams ?? [],
    syncSessions: data.syncSessions ?? [],
    reminders: data.reminders ?? [],
  };
}

function load(): StoreData {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = migrateStore(JSON.parse(fs.readFileSync(STORE_FILE, "utf-8")));
      if (data.users.length === 0) return seedDemo();
      return data;
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
  const users: User[] = [
    { id: "user-me", name: "你", handle: "me", avatarColor: "#7c6cff", bio: "Prerector 协作者", createdAt: now },
    { id: uuid(), name: "张明", handle: "zhangming", avatarColor: "#ff6b2c", bio: "导演 / 制片", createdAt: now },
    { id: uuid(), name: "李悦", handle: "liyue", avatarColor: "#4da3ff", bio: "剪辑师", createdAt: now },
    { id: uuid(), name: "王浩", handle: "wanghao", avatarColor: "#a78bfa", bio: "调色师", createdAt: now },
    { id: uuid(), name: "陈音", handle: "chenyin", avatarColor: "#3dd68c", bio: "声音设计", createdAt: now },
    { id: uuid(), name: "刘畅", handle: "liuchang", avatarColor: "#ff9f43", bio: "CS 大三 · 小组作业常客", createdAt: now },
  ];
  const [me, zhang, li, wang, chen, liu] = users;

  const productionTeam: Team = {
    id: uuid(),
    name: "品牌短片组",
    kind: "production",
    createdAt: now,
    members: [
      { id: uuid(), name: zhang.name, role: "director", color: zhang.avatarColor, userId: zhang.id },
      { id: uuid(), name: li.name, role: "editor", color: li.avatarColor, userId: li.id },
      { id: uuid(), name: wang.name, role: "colorist", color: wang.avatarColor, userId: wang.id },
      { id: uuid(), name: chen.name, role: "sound", color: chen.avatarColor, userId: chen.id },
    ],
  };

  const homeworkTeam: Team = {
    id: uuid(),
    name: "第 5 组 · 数据结构大作业",
    kind: "homework",
    createdAt: now,
    members: [
      { id: uuid(), name: me.name, role: "producer", color: me.avatarColor, userId: me.id },
      { id: uuid(), name: liu.name, role: "other", color: liu.avatarColor, userId: liu.id },
      { id: uuid(), name: li.name, role: "other", color: li.avatarColor, userId: li.id },
    ],
  };

  const videoProject = decomposeProject(
    { brief: "30 秒品牌宣传片 · A24 风格 · 4K 交付", projectType: "video", scope: 0.5, teamId: productionTeam.id },
    productionTeam,
  );
  const homeworkProject = decomposeProject(
    { brief: "数据结构课程大作业 · 实现红黑树可视化 · 小组提交", projectType: "homework", scope: 10, teamId: homeworkTeam.id },
    homeworkTeam,
  );

  const friendRequests: FriendRequest[] = [
    { id: uuid(), fromUserId: zhang.id, toUserId: me.id, status: "accepted", createdAt: now },
    { id: uuid(), fromUserId: li.id, toUserId: me.id, status: "accepted", createdAt: now },
    { id: uuid(), fromUserId: liu.id, toUserId: me.id, status: "accepted", createdAt: now },
    { id: uuid(), fromUserId: wang.id, toUserId: me.id, status: "pending", message: "一起做个项目？", createdAt: now },
  ];

  const chatMessages: ChatMessage[] = [
    { id: uuid(), teamId: homeworkTeam.id, senderId: liu.id, senderName: liu.name, content: "大家今晚 8 点腾讯会议对一下分工？", createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: uuid(), teamId: homeworkTeam.id, senderId: me.id, senderName: me.name, content: "好，我负责可视化部分", createdAt: new Date(Date.now() - 3000000).toISOString() },
    { id: uuid(), teamId: homeworkTeam.id, senderId: li.id, senderName: li.name, content: "我写实验报告第 2、3 章", createdAt: new Date(Date.now() - 2400000).toISOString() },
    { id: uuid(), teamId: productionTeam.id, senderId: zhang.id, senderName: zhang.name, content: "粗剪版本发群了，大家看一下节奏", createdAt: new Date(Date.now() - 7200000).toISOString() },
  ];

  const sync = createSyncSession({ projectId: videoProject.project.id, name: "代理优先同步", strategy: "proxy_first" });

  const reminders: Reminder[] = [...videoProject.tasks.slice(0, 2), ...homeworkProject.tasks.slice(0, 1)].map((t) => ({
    id: uuid(),
    projectId: t.projectId,
    taskId: t.id,
    title: `截止提醒 · ${t.title}`,
    message: `任务「${t.title}」即将到期，预计 ${t.estimatedHours}h`,
    dueAt: t.dueAt ?? new Date(Date.now() + 86400000).toISOString(),
    notified: false,
    createdAt: now,
  }));

  const data: StoreData = {
    users,
    friendRequests,
    chatMessages,
    chatReadAt: {},
    projects: [videoProject.project, homeworkProject.project],
    tasks: [...videoProject.tasks, ...homeworkProject.tasks],
    teams: [productionTeam, homeworkTeam],
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

export function resolveUserId(header?: string | null): string {
  if (header && cache.users.some((u) => u.id === header)) return header;
  return cache.users[0]?.id ?? "user-me";
}

function getUser(id: string): User | undefined {
  return cache.users.find((u) => u.id === id);
}

function getTeam(id?: string): Team | undefined {
  if (!id) return undefined;
  return cache.teams.find((t) => t.id === id);
}

function areFriends(a: string, b: string): boolean {
  return cache.friendRequests.some(
    (r) =>
      r.status === "accepted" &&
      ((r.fromUserId === a && r.toUserId === b) || (r.fromUserId === b && r.toUserId === a)),
  );
}

function hasPendingRequest(a: string, b: string): boolean {
  return cache.friendRequests.some(
    (r) =>
      r.status === "pending" &&
      ((r.fromUserId === a && r.toUserId === b) || (r.fromUserId === b && r.toUserId === a)),
  );
}

export function getMe(userId: string) {
  const user = getUser(userId);
  if (!user) throw new Error("user not found");
  return user;
}

export function searchUsers(query: string, userId: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return cache.users.filter(
    (u) =>
      u.id !== userId &&
      !areFriends(userId, u.id) &&
      (u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q)),
  );
}

export function listFriends(userId: string) {
  return cache.friendRequests
    .filter(
      (r) =>
        r.status === "accepted" &&
        (r.fromUserId === userId || r.toUserId === userId),
    )
    .map((r) => {
      const friendId = r.fromUserId === userId ? r.toUserId : r.fromUserId;
      return getUser(friendId)!;
    })
    .filter(Boolean);
}

export function listFriendRequests(userId: string) {
  return cache.friendRequests
    .filter((r) => r.status === "pending" && r.toUserId === userId)
    .map((r) => ({
      ...r,
      fromUser: getUser(r.fromUserId)!,
    }))
    .filter((r) => r.fromUser);
}

export function sendFriendRequest(fromUserId: string, target: { userId?: string; handle?: string; message?: string }) {
  const toUser =
    (target.userId ? getUser(target.userId) : undefined) ??
    cache.users.find((u) => u.handle === target.handle?.replace(/^@/, ""));
  if (!toUser) throw new Error("用户不存在");
  if (toUser.id === fromUserId) throw new Error("不能添加自己为好友");
  if (areFriends(fromUserId, toUser.id)) throw new Error("已经是好友");
  if (hasPendingRequest(fromUserId, toUser.id)) throw new Error("已发送好友请求");

  const req: FriendRequest = {
    id: uuid(),
    fromUserId,
    toUserId: toUser.id,
    status: "pending",
    message: target.message,
    createdAt: new Date().toISOString(),
  };
  cache.friendRequests.push(req);
  persist();
  return req;
}

export function acceptFriendRequest(requestId: string, userId: string) {
  const idx = cache.friendRequests.findIndex((r) => r.id === requestId);
  if (idx < 0) throw new Error("请求不存在");
  const req = cache.friendRequests[idx];
  if (req.toUserId !== userId) throw new Error("无权操作");
  cache.friendRequests[idx] = { ...req, status: "accepted" };
  persist();
  return cache.friendRequests[idx];
}

export function rejectFriendRequest(requestId: string, userId: string) {
  const idx = cache.friendRequests.findIndex((r) => r.id === requestId);
  if (idx < 0) throw new Error("请求不存在");
  const req = cache.friendRequests[idx];
  if (req.toUserId !== userId) throw new Error("无权操作");
  cache.friendRequests[idx] = { ...req, status: "rejected" };
  persist();
  return cache.friendRequests[idx];
}

export function listChatMessages(teamId: string, userId: string) {
  const team = getTeam(teamId);
  if (!team) throw new Error("小组不存在");
  const isMember = team.members.some((m) => m.userId === userId);
  if (!isMember) throw new Error("你不是该小组成员");

  return cache.chatMessages
    .filter((m) => m.teamId === teamId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function sendChatMessage(teamId: string, userId: string, content: string) {
  const team = getTeam(teamId);
  if (!team) throw new Error("小组不存在");
  const member = team.members.find((m) => m.userId === userId);
  if (!member) throw new Error("你不是该小组成员");
  if (!content.trim()) throw new Error("消息不能为空");

  const msg: ChatMessage = {
    id: uuid(),
    teamId,
    senderId: userId,
    senderName: member.name,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
  cache.chatMessages.push(msg);
  persist();
  return msg;
}

export function markChatRead(teamId: string, userId: string) {
  if (!cache.chatReadAt[userId]) cache.chatReadAt[userId] = {};
  cache.chatReadAt[userId][teamId] = new Date().toISOString();
  persist();
  return { ok: true };
}

function countUnread(userId: string): number {
  let count = 0;
  for (const team of cache.teams) {
    if (!team.members.some((m) => m.userId === userId)) continue;
    const lastRead = cache.chatReadAt[userId]?.[team.id];
    const lastReadTime = lastRead ? new Date(lastRead).getTime() : 0;
    count += cache.chatMessages.filter(
      (m) => m.teamId === team.id && m.senderId !== userId && new Date(m.createdAt).getTime() > lastReadTime,
    ).length;
  }
  return count;
}

export function getDashboard(userId: string): DashboardStats {
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
    activeSyncSessions: cache.syncSessions.filter((s) => s.files.some((f) => f.status !== "done")).length,
    friendCount: listFriends(userId).length,
    pendingFriendRequests: cache.friendRequests.filter((r) => r.status === "pending" && r.toUserId === userId).length,
    unreadChatCount: countUnread(userId),
  };
}

export function listProjects() {
  return cache.projects;
}

export function listTasks(projectId?: string) {
  return projectId ? cache.tasks.filter((t) => t.projectId === projectId) : cache.tasks;
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

export function listTeams(userId?: string) {
  if (!userId) return cache.teams;
  return cache.teams.filter((t) => t.members.some((m) => m.userId === userId));
}

export function createTeam(input: {
  name: string;
  members?: Omit<TeamMember, "id">[];
  friendUserIds?: string[];
  kind?: Team["kind"];
  ownerUserId?: string;
}) {
  const kind = input.kind ?? "production";
  const memberMap = new Map<string, TeamMember>();

  for (const fid of input.friendUserIds ?? []) {
    const user = getUser(fid);
    if (!user) continue;
    memberMap.set(user.id, {
      id: uuid(),
      name: user.name,
      role: "other",
      color: user.avatarColor,
      userId: user.id,
    });
  }

  if (input.ownerUserId) {
    const owner = getUser(input.ownerUserId);
    if (owner && !memberMap.has(owner.id)) {
      memberMap.set(owner.id, {
        id: uuid(),
        name: owner.name,
        role: "producer",
        color: owner.avatarColor,
        userId: owner.id,
      });
    }
  }

  for (const m of input.members ?? []) {
    if (!m.name.trim()) continue;
    memberMap.set(m.name, { ...m, id: uuid(), name: m.name.trim() });
  }

  const team: Team = {
    id: uuid(),
    name: input.name,
    kind,
    members: [...memberMap.values()],
    createdAt: new Date().toISOString(),
  };
  cache.teams.push(team);

  cache.chatMessages.push({
    id: uuid(),
    teamId: team.id,
    senderId: "system",
    senderName: "系统",
    content: `小组「${team.name}」已创建，开始协作吧`,
    createdAt: new Date().toISOString(),
  });

  persist();
  return team;
}

export function rebalanceTeamTasks(teamId: string) {
  const team = getTeam(teamId);
  if (!team) throw new Error("team not found");
  const projectIds = new Set(cache.projects.filter((p) => p.teamId === teamId).map((p) => p.id));
  const tasks = cache.tasks.filter((t) => projectIds.has(t.projectId));
  const rebalanced = rebalanceAssignments(tasks, team);
  cache.tasks = cache.tasks.map((t) => rebalanced.find((r) => r.id === t.id) ?? t);
  persist();
  return rebalanced;
}

export function listSyncSessions(projectId?: string) {
  return projectId ? cache.syncSessions.filter((s) => s.projectId === projectId) : cache.syncSessions;
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
  const list = projectId ? cache.reminders.filter((r) => r.projectId === projectId) : cache.reminders;
  return list.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
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
  return cache.reminders.filter((r) => !r.notified && new Date(r.dueAt).getTime() <= now);
}

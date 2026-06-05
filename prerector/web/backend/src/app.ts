import { Hono } from "hono";
import { cors } from "hono/cors";
import type {
  AssessTaskRequest,
  DecomposeRequest,
  TaskStatus,
  TeamMember,
} from "@everec/shared";
import { DIFFICULTY_LABELS } from "@everec/shared";
import {
  acceptFriendRequest,
  assignTask,
  createReminder,
  createTeam,
  decompose,
  dismissReminder,
  getDashboard,
  getDueReminders,
  getMe,
  listChatMessages,
  listFriendRequests,
  listFriends,
  listProjects,
  listReminders,
  listSyncSessions,
  listTasks,
  listTeams,
  markChatRead,
  rebalanceTeamTasks,
  rejectFriendRequest,
  resolveUserId,
  searchUsers,
  sendChatMessage,
  sendFriendRequest,
  startSync,
  tickSync,
  updateTaskStatus,
} from "./store";
import { syncStats } from "./syncEngine";
import { assessCustomTask } from "./taskAssessment";
import { detectProjectType } from "./taskTemplates";
import { SCOPE_LABELS } from "@everec/shared";

const app = new Hono<{ Variables: { userId: string } }>().basePath("/api/prerector");

app.use("*", cors());
app.use("*", async (c, next) => {
  c.set("userId", resolveUserId(c.req.header("X-User-Id")));
  await next();
});

app.onError((err, c) => {
  console.error("[prerector api]", err);
  return c.json({ error: err.message || "服务器内部错误" }, 500);
});

app.get("/health", (c) =>
  c.json({ ok: true, platform: "prerector", module: "collaboration" }),
);

app.get("/users/me", (c) => c.json(getMe(c.get("userId"))));

app.get("/users/search", (c) => {
  const q = c.req.query("q") ?? "";
  return c.json(searchUsers(q, c.get("userId")));
});

app.get("/friends", (c) => c.json(listFriends(c.get("userId"))));

app.get("/friends/requests", (c) => c.json(listFriendRequests(c.get("userId"))));

app.post("/friends/request", async (c) => {
  const body = await c.req.json<{ userId?: string; handle?: string; message?: string }>();
  try {
    return c.json(sendFriendRequest(c.get("userId"), body));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

app.post("/friends/requests/:id/accept", (c) => {
  try {
    return c.json(acceptFriendRequest(c.req.param("id"), c.get("userId")));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

app.post("/friends/requests/:id/reject", (c) => {
  try {
    return c.json(rejectFriendRequest(c.req.param("id"), c.get("userId")));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

app.get("/chat/:teamId/messages", (c) => {
  try {
    return c.json(listChatMessages(c.req.param("teamId"), c.get("userId")));
  } catch (err) {
    return c.json({ error: String(err) }, 403);
  }
});

app.post("/chat/:teamId/messages", async (c) => {
  const { content } = await c.req.json<{ content: string }>();
  try {
    return c.json(sendChatMessage(c.req.param("teamId"), c.get("userId"), content));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});

app.post("/chat/:teamId/read", (c) => {
  markChatRead(c.req.param("teamId"), c.get("userId"));
  return c.json({ ok: true });
});

app.get("/dashboard", (c) => c.json(getDashboard(c.get("userId"))));

app.get("/projects", (c) => c.json(listProjects()));

app.get("/tasks", (c) => {
  const projectId = c.req.query("projectId");
  return c.json(listTasks(projectId));
});

app.patch("/tasks/:id/status", async (c) => {
  const { status } = await c.req.json<{ status: TaskStatus }>();
  return c.json(updateTaskStatus(c.req.param("id"), status));
});

app.patch("/tasks/:id/assign", async (c) => {
  const { assigneeId } = await c.req.json<{ assigneeId: string }>();
  return c.json(assignTask(c.req.param("id"), assigneeId));
});

app.post("/tasks/decompose", async (c) => {
  const body = await c.req.json<DecomposeRequest>();
  if (!body.brief?.trim() && !body.taskInput?.trim()) {
    return c.json({ error: "请提供项目 Brief 或任务列表" }, 400);
  }
  return c.json(decompose({ ...body, brief: body.brief?.trim() || "自定义项目" }));
});

app.post("/tasks/assess", async (c) => {
  const body = await c.req.json<AssessTaskRequest>();
  if (!body.title?.trim()) {
    return c.json({ error: "请提供任务标题" }, 400);
  }
  const projectType = detectProjectType(body.brief ?? body.title, body.projectType);
  const scope = body.scope ?? SCOPE_LABELS[projectType].default;
  const { difficulty, estimatedHours } = assessCustomTask(
    {
      title: body.title.trim(),
      description: body.description?.trim() || body.title.trim(),
      phase: "执行",
    },
    body.brief ?? "",
    projectType,
    scope,
  );
  return c.json({
    difficulty,
    estimatedHours,
    difficultyLabel: DIFFICULTY_LABELS[difficulty],
  });
});

app.get("/teams", (c) => c.json(listTeams(c.get("userId"))));

app.post("/teams", async (c) => {
  const body = await c.req.json<{
    name: string;
    members?: Omit<TeamMember, "id">[];
    friendUserIds?: string[];
    kind?: "production" | "homework";
  }>();
  if (!body.name?.trim()) return c.json({ error: "请提供小组名称" }, 400);
  return c.json(
    createTeam({
      name: body.name,
      members: body.members,
      friendUserIds: body.friendUserIds,
      kind: body.kind,
      ownerUserId: c.get("userId"),
    }),
  );
});

app.post("/teams/:id/rebalance", (c) => {
  try {
    return c.json(rebalanceTeamTasks(c.req.param("id")));
  } catch (err) {
    return c.json({ error: String(err) }, 404);
  }
});

app.get("/sync", (c) => {
  const projectId = c.req.query("projectId");
  const sessions = listSyncSessions(projectId);
  return c.json(sessions.map((s) => ({ ...s, stats: syncStats(s) })));
});

app.post("/sync", async (c) => {
  const body = await c.req.json<{
    projectId: string;
    name: string;
    strategy?: "proxy_first" | "timeline_first" | "full";
    fileNames?: string[];
  }>();
  if (!body.projectId || !body.name) {
    return c.json({ error: "缺少 projectId 或 name" }, 400);
  }
  const session = startSync(body);
  return c.json({ ...session, stats: syncStats(session) });
});

app.post("/sync/:id/tick", (c) => {
  try {
    const session = tickSync(c.req.param("id"));
    return c.json({ ...session, stats: syncStats(session) });
  } catch (err) {
    return c.json({ error: String(err) }, 404);
  }
});

app.get("/reminders", (c) => {
  const projectId = c.req.query("projectId");
  return c.json(listReminders(projectId));
});

app.get("/reminders/due", (c) => c.json(getDueReminders()));

app.post("/reminders", async (c) => {
  const body = await c.req.json<{
    projectId: string;
    taskId?: string;
    title: string;
    message: string;
    dueAt: string;
  }>();
  if (!body.title || !body.dueAt) {
    return c.json({ error: "缺少 title 或 dueAt" }, 400);
  }
  return c.json(createReminder(body));
});

app.post("/reminders/:id/dismiss", (c) => {
  try {
    return c.json(dismissReminder(c.req.param("id")));
  } catch (err) {
    return c.json({ error: String(err) }, 404);
  }
});

export default app;

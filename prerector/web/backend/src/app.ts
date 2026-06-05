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
  assignTask,
  createReminder,
  createTeam,
  decompose,
  dismissReminder,
  getDashboard,
  getDueReminders,
  listProjects,
  listReminders,
  listSyncSessions,
  listTasks,
  listTeams,
  rebalanceTeamTasks,
  startSync,
  tickSync,
  updateTaskStatus,
} from "./store";
import { syncStats } from "./syncEngine";
import { assessCustomTask } from "./taskAssessment";
import { detectProjectType } from "./taskTemplates";
import { SCOPE_LABELS } from "@everec/shared";

const app = new Hono().basePath("/api");

app.use("*", cors());

app.onError((err, c) => {
  console.error("[prerector api]", err);
  return c.json({ error: err.message || "服务器内部错误" }, 500);
});

app.get("/health", (c) =>
  c.json({ ok: true, platform: "prerector", module: "collaboration" }),
);

app.get("/dashboard", (c) => c.json(getDashboard()));

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

app.get("/teams", (c) => c.json(listTeams()));

app.post("/teams", async (c) => {
  const { name, members } = await c.req.json<{
    name: string;
    members: Omit<TeamMember, "id">[];
  }>();
  if (!name?.trim()) return c.json({ error: "请提供小组名称" }, 400);
  return c.json(createTeam(name, members ?? []));
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
  return c.json(
    sessions.map((s) => ({ ...s, stats: syncStats(s) })),
  );
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

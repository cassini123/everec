import { Hono } from "hono";
import { cors } from "hono/cors";
import fs from "node:fs";
import path from "node:path";
import { parseWebUrl, analyzeImageLocal, computeGraphLayout } from "@everec/shared";
import { analyzeImage, analyzeVideo, buildStyleGuide } from "./analyze";
import {
  exportGraphJson,
  graphRebuildFromProject,
  graphSyncImageAnalysis,
  graphSyncVideoAnalysis,
  graphSyncStyleGuide,
  loadGraph,
  queryGraph,
} from "./graphStore";
import {
  addCapture,
  createProject,
  deleteProject,
  getMediaPath,
  getProject,
  listProjects,
  saveMediaBuffer,
  updateProject,
} from "./store";

const app = new Hono().basePath("/api/knowgo");

app.use("*", cors());

app.onError((err, c) => {
  console.error("[knowgo api error]", err);
  return c.json({ error: err.message || "服务器内部错误" }, 500);
});

app.get("/health", (c) =>
  c.json({ ok: true, product: "knowgo", platform: "web" }),
);

app.get("/projects", (c) => c.json(listProjects()));

app.post("/projects", async (c) => {
  const { title } = await c.req.json<{ title?: string }>().catch(() => ({ title: undefined }));
  return c.json(createProject(title));
});

app.get("/projects/:id", (c) => {
  const project = getProject(c.req.param("id"));
  if (!project) return c.json({ error: "not found" }, 404);
  return c.json(project);
});

app.patch("/projects/:id", async (c) => {
  const patch = await c.req.json();
  const updated = updateProject(c.req.param("id"), patch);
  if (!updated) return c.json({ error: "not found" }, 404);
  return c.json(updated);
});

app.delete("/projects/:id", (c) => {
  const ok = deleteProject(c.req.param("id"));
  if (!ok) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});

app.get("/projects/:id/graph", (c) => {
  const project = getProject(c.req.param("id"));
  if (!project) return c.json({ error: "not found" }, 404);
  const graph = loadGraph(c.req.param("id"));
  const layout = computeGraphLayout(graph);
  return c.json({ graph, layout });
});

app.get("/projects/:id/graph/query", (c) => {
  const project = getProject(c.req.param("id"));
  if (!project) return c.json({ error: "not found" }, 404);
  const type = c.req.query("type") as import("@everec/shared").GraphNodeType | undefined;
  const refId = c.req.query("refId");
  return c.json(queryGraph(c.req.param("id"), { type, refId }));
});

app.post("/projects/:id/graph/rebuild", (c) => {
  const project = getProject(c.req.param("id"));
  if (!project) return c.json({ error: "not found" }, 404);
  const graph = graphRebuildFromProject(project);
  return c.json({ graph, layout: computeGraphLayout(graph) });
});

app.get("/projects/:id/graph/export", (c) => {
  const project = getProject(c.req.param("id"));
  if (!project) return c.json({ error: "not found" }, 404);
  c.header("Content-Type", "application/json");
  c.header("Content-Disposition", `attachment; filename="knowgo-graph-${project.id}.json"`);
  return c.body(exportGraphJson(project.id));
});

app.post("/parse-url", async (c) => {
  const { url } = await c.req.json<{ url: string }>();
  if (!url?.trim()) return c.json({ error: "请提供 URL" }, 400);
  const result = await parseWebUrl(url.trim());
  return c.json(result);
});

app.post("/projects/:id/captures/url", async (c) => {
  const { url } = await c.req.json<{ url: string }>();
  if (!url?.trim()) return c.json({ error: "请提供 URL" }, 400);
  const parsed = await parseWebUrl(url.trim());
  const capture = addCapture(c.req.param("id"), {
    type: "url",
    sourceUrl: parsed.url,
    previewUrl: parsed.imageUrl,
    title: parsed.title,
    description: parsed.description,
    platform: parsed.platform,
  });
  if (!capture) return c.json({ error: "project not found" }, 404);
  return c.json(capture);
});

app.post("/projects/:id/captures/upload", async (c) => {
  const projectId = c.req.param("id");
  const body = await c.req.parseBody();
  const file = body.file;
  if (!file || typeof file === "string") {
    return c.json({ error: "请上传文件" }, 400);
  }
  const f = file as File;
  const original = f.name ?? "upload";
  const ext = path.extname(original).slice(1).toLowerCase() || "bin";
  const buffer = Buffer.from(await f.arrayBuffer());
  const { fileName } = saveMediaBuffer(buffer, ext);
  const isVideo = ["mp4", "webm", "mov", "mkv"].includes(ext);
  const capture = addCapture(projectId, {
    type: isVideo ? "video" : "image",
    fileName,
    previewUrl: `/api/knowgo/media/${fileName}`,
    title: path.basename(original, path.extname(original)),
    description: isVideo ? "上传的视频素材" : "上传的图片素材",
  });
  if (!capture) return c.json({ error: "project not found" }, 404);
  return c.json(capture);
});

app.get("/media/:fileName", (c) => {
  const fp = getMediaPath(c.req.param("fileName"));
  if (!fp) return c.json({ error: "not found" }, 404);
  const ext = path.extname(fp).slice(1).toLowerCase();
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
  };
  const data = fs.readFileSync(fp);
  c.header("Content-Type", mimeMap[ext] ?? "application/octet-stream");
  c.header("Cache-Control", "public, max-age=3600");
  return c.body(data);
});

app.post("/analyze/image", async (c) => {
  const body = await c.req.parseBody();
  const captureId = String(body.captureId ?? "");
  const projectId = String(body.projectId ?? "");
  const hint = String(body.hint ?? "");
  const apiKey = body.apiKey ? String(body.apiKey) : undefined;
  const file = body.file;

  if (!captureId) return c.json({ error: "缺少 captureId" }, 400);

  let result;

  if (file && typeof file !== "string") {
    const f = file as File;
    const buffer = Buffer.from(await f.arrayBuffer());
    const ext = path.extname(f.name ?? "").slice(1).toLowerCase();
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : "image/jpeg";
    result = await analyzeImage(captureId, buffer, mime, hint, apiKey);
  } else {
    const fileName = String(body.fileName ?? "");
    if (fileName) {
      const fp = getMediaPath(fileName);
      if (!fp) return c.json({ error: "文件不存在" }, 400);
      const ext = path.extname(fp).slice(1).toLowerCase();
      const mime =
        ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      const buffer = fs.readFileSync(fp);
      result = await analyzeImage(captureId, buffer, mime, hint, apiKey);
    } else {
      result = analyzeImageLocal(captureId, hint);
    }
  }

  if (projectId) {
    graphSyncImageAnalysis(projectId, captureId, result);
  }
  return c.json(result);
});

app.post("/analyze/video", async (c) => {
  const { captureId, projectId, durationSec, hint, apiKey } = await c.req.json<{
    captureId: string;
    projectId?: string;
    durationSec?: number;
    hint?: string;
    apiKey?: string;
  }>();
  if (!captureId) return c.json({ error: "缺少 captureId" }, 400);
  const result = await analyzeVideo(
    captureId,
    durationSec ?? 60,
    hint ?? "",
    apiKey,
  );
  if (projectId) {
    graphSyncVideoAnalysis(projectId, captureId, result);
  }
  return c.json(result);
});

app.post("/analyze/style", async (c) => {
  const { hint, keywords, projectId } = await c.req.json<{
    hint?: string;
    keywords?: string[];
    projectId?: string;
  }>();
  const guide = buildStyleGuide(hint ?? "", keywords ?? []);
  if (projectId) {
    graphSyncStyleGuide(projectId, guide);
  }
  return c.json(guide);
});

export default app;

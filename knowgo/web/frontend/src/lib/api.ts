import type {
  ImageAnalysis,
  InspirationCapture,
  KnowgoProject,
  ProjectBrief,
  StyleGuide,
  UrlParseResult,
  VideoAnalysis,
  InspirationDocument,
} from "../types";

const BASE = "/api/knowgo";

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data as T;
}

export const api = {
  health: () => json<{ ok: boolean }>(`${BASE}/health`),

  listProjects: () => json<KnowgoProject[]>(`${BASE}/projects`),

  createProject: (title?: string) =>
    json<KnowgoProject>(`${BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }),

  getProject: (id: string) => json<KnowgoProject>(`${BASE}/projects/${id}`),

  updateProject: (id: string, patch: Partial<KnowgoProject>) =>
    json<KnowgoProject>(`${BASE}/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),

  parseUrl: (url: string) =>
    json<UrlParseResult>(`${BASE}/parse-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }),

  addUrlCapture: (projectId: string, url: string) =>
    json<InspirationCapture>(`${BASE}/projects/${projectId}/captures/url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }),

  uploadCapture: (projectId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return json<InspirationCapture>(`${BASE}/projects/${projectId}/captures/upload`, {
      method: "POST",
      body: fd,
    });
  },

  analyzeImage: (captureId: string, fileName: string, hint: string, apiKey?: string) => {
    const fd = new FormData();
    fd.append("captureId", captureId);
    fd.append("fileName", fileName);
    fd.append("hint", hint);
    if (apiKey) fd.append("apiKey", apiKey);
    return json<ImageAnalysis>(`${BASE}/analyze/image`, { method: "POST", body: fd });
  },

  analyzeVideo: (
    captureId: string,
    durationSec: number,
    hint: string,
    apiKey?: string,
  ) =>
    json<VideoAnalysis>(`${BASE}/analyze/video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ captureId, durationSec, hint, apiKey }),
    }),

  analyzeStyle: (hint: string, keywords: string[]) =>
    json<StyleGuide>(`${BASE}/analyze/style`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hint, keywords }),
    }),
};

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem("knowgo_openai_key") ?? "";
  } catch {
    return "";
  }
}

export function setStoredApiKey(key: string) {
  try {
    localStorage.setItem("knowgo_openai_key", key);
  } catch {
    /* ignore */
  }
}

export async function saveBrief(projectId: string, brief: ProjectBrief) {
  return api.updateProject(projectId, { brief, title: brief.title || "未命名项目" });
}

export async function saveDocument(projectId: string, document: InspirationDocument) {
  return api.updateProject(projectId, {
    document: { ...document, updatedAt: new Date().toISOString() },
  });
}

export async function saveStyleGuide(projectId: string, styleGuide: StyleGuide) {
  return api.updateProject(projectId, { styleGuide });
}

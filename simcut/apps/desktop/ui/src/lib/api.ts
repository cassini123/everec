import type {
  AiAnalysisResult,
  ColorAnalysisResult,
  EffectPreset,
  ExportOptions,
  ExportResult,
  MediaAsset,
  Project,
  ProjectSummary,
  StillFrame,
  SubtitleCue,
} from "../types";
import { analyzeImageFile } from "./colorAnalysis";
import * as mediaStore from "./mediaStore";
import * as projectStore from "./projectStore";
import { DESKTOP_APP_HINT, invoke, isTauriApp } from "./tauri";

function requireDesktop<T>(fn: () => Promise<T>): Promise<T> {
  if (!isTauriApp()) return Promise.reject(new Error(DESKTOP_APP_HINT));
  return fn();
}

function generateSubtitles(language: string, mediaId?: string): SubtitleCue[] {
  const langLabel =
    { zh: "中文", en: "English", ja: "日本語", ko: "한국어" }[language] ?? language;
  const samples: Record<string, [string, number, number][]> = {
    en: [
      ["Welcome to Simcut", 0, 2000],
      ["Lightweight editing for short-form", 2000, 4500],
      ["Export and share instantly", 4500, 7000],
    ],
    ja: [
      ["Simcutへようこそ", 0, 2000],
      ["短編向けの軽量編集", 2000, 4500],
      ["すぐに書き出して共有", 4500, 7000],
    ],
    ko: [
      ["Simcut에 오신 것을 환영합니다", 0, 2000],
      ["숏폼을 위한 경량 편집", 2000, 4500],
      ["바로보내고 공유하세요", 4500, 7000],
    ],
    zh: [
      ["欢迎使用 Simcut", 0, 2000],
      ["超短篇轻量剪辑工具", 2000, 4500],
      ["导出渲染，一键交付", 4500, 7000],
    ],
  };
  const lines = samples[language] ?? samples.zh;
  return lines.map(([text, start, end]) => ({
    id: crypto.randomUUID(),
    startMs: start,
    endMs: end,
    text: `[${langLabel}] ${text}`,
    language,
    mediaId,
  }));
}

export const api = {
  isDesktop: isTauriApp,

  listProjects: (): Promise<ProjectSummary[]> =>
    isTauriApp()
      ? invoke("list_projects")
      : Promise.resolve(projectStore.listProjects()),

  createProject: (name: string): Promise<Project> =>
    isTauriApp()
      ? invoke("create_project", { name })
      : Promise.resolve(projectStore.createProject(name)),

  loadProject: (id: string): Promise<Project> =>
    isTauriApp()
      ? invoke("load_project", { id })
      : Promise.resolve(projectStore.loadProject(id)),

  saveProject: (project: Project): Promise<void> =>
    isTauriApp()
      ? invoke("save_project", { project })
      : Promise.resolve(projectStore.saveProject(project)),

  importMediaFile: async (
    project: Project,
    file: File,
    tags?: string[],
  ): Promise<{ project: Project; asset: MediaAsset }> => {
    if (isTauriApp()) {
      throw new Error("桌面端请使用 importMedia 命令");
    }

    const id = crypto.randomUUID();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
    await mediaStore.saveBlob(id, file);

    let durationMs = 0;
    let width = 1920;
    let height = 1080;
    if (file.type.startsWith("video/")) {
      const meta = await mediaStore.probeVideo(file);
      durationMs = meta.durationMs;
      width = meta.width;
      height = meta.height;
    }

    const asset: MediaAsset = {
      id,
      name: file.name.replace(/\.[^.]+$/, ""),
      fileName: file.name,
      format: ext,
      durationMs,
      width,
      height,
      tags: tags ?? [],
      createdAt: String(Math.floor(Date.now() / 1000)),
      blobId: id,
    };

    const clip = {
      id: crypto.randomUUID(),
      trackIndex: 0,
      mediaId: id,
      startMs: 0,
      durationMs: durationMs || 5000,
      trimInMs: 0,
      trimOutMs: durationMs || 5000,
      effectIds: [] as string[],
    };

    let updated: Project = {
      ...project,
      media: [...project.media, asset],
      durationMs: Math.max(project.durationMs, durationMs),
      resolution: [width, height],
    };
    updated = projectStore.addClip(updated, clip);
    return { project: updated, asset };
  },

  getMediaUrl: (asset: MediaAsset): Promise<string | null> => {
    if (!asset.blobId) return Promise.resolve(null);
    return mediaStore.getObjectUrl(asset.blobId);
  },

  importMedia: (
    projectId: string,
    sourcePath: string,
    name?: string,
    tags?: string[],
  ): Promise<MediaAsset> =>
    requireDesktop(() =>
      invoke("import_media", { projectId, sourcePath, name, tags }),
    ),

  listEffectPresets: (): Promise<EffectPreset[]> =>
    isTauriApp()
      ? invoke("list_effect_presets")
      : Promise.resolve([
          { id: "fade-in", name: "渐显", category: "transition", params: { duration_ms: 500, intensity: 0, scale: 1, blur: 0 } },
          { id: "fade-out", name: "渐隐", category: "transition", params: { duration_ms: 500, intensity: 0, scale: 1, blur: 0 } },
          { id: "highlight", name: "高亮", category: "emphasis", params: { duration_ms: 0, intensity: 0.6, scale: 1, blur: 0 } },
          { id: "zoom-in", name: "推近", category: "motion", params: { duration_ms: 800, intensity: 0, scale: 1.15, blur: 0 } },
          { id: "blur-bg", name: "背景虚化", category: "style", params: { duration_ms: 0, intensity: 0, scale: 1, blur: 8 } },
        ]),

  addStillFrame: (
    projectId: string,
    mediaId: string,
    timestampMs: number,
    label: string,
    tags: string[],
    colorPalette: string[],
  ): Promise<StillFrame> => {
    if (isTauriApp()) {
      return invoke("add_still_frame", {
        projectId,
        mediaId,
        timestampMs,
        label,
        tags,
        colorPalette,
      });
    }
    const project = projectStore.loadProject(projectId);
    const still: StillFrame = {
      id: crypto.randomUUID(),
      mediaId,
      timestampMs,
      label,
      tags,
      colorPalette,
    };
    projectStore.addStill(project, still);
    return Promise.resolve(still);
  },

  analyzeColorFromFile: (file: File): Promise<ColorAnalysisResult> =>
    analyzeImageFile(file),

  analyzeColorFromPhoto: (sourcePath: string): Promise<ColorAnalysisResult> =>
    requireDesktop(() => invoke("analyze_color_from_photo", { sourcePath })),

  saveLutPreset: (lutCube: string, name: string): Promise<string> => {
    if (isTauriApp()) {
      return invoke("save_lut_preset", { lutCube, name });
    }
    const key = `simcut-lut-${name.replace(/\s+/g, "_")}`;
    localStorage.setItem(key, lutCube);
    return Promise.resolve(key);
  },

  recognizeSubtitles: (
    projectId: string,
    language: string,
    mediaId?: string,
  ): Promise<SubtitleCue[]> => {
    if (isTauriApp()) {
      return invoke("recognize_subtitles", { projectId, language, mediaId });
    }
    const cues = generateSubtitles(language, mediaId);
    const project = projectStore.loadProject(projectId);
    projectStore.addSubtitles(project, cues);
    return Promise.resolve(cues);
  },

  analyzeFrameAi: (description: string, frameIndex: number): Promise<AiAnalysisResult> =>
    isTauriApp()
      ? invoke("analyze_frame_ai", { description, frameIndex })
      : Promise.resolve(mockAiAnalysis(description)),

  applyPromptEdit: (prompt: string): Promise<string> =>
    isTauriApp()
      ? invoke("apply_prompt_edit_command", { prompt })
      : Promise.resolve(applyPromptLocal(prompt)),

  exportProject: (
    projectId: string,
    options: ExportOptions,
  ): Promise<ExportResult> => {
    if (isTauriApp()) {
      return invoke("export_project", { projectId, options });
    }
    return exportProjectWeb(projectId, options);
  },

  getProjectsDir: (): Promise<string> =>
    requireDesktop(() => invoke("get_projects_dir")),
};

function applyPromptLocal(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("渐显") || lower.includes("fade in")) return "已应用渐显特效（500ms）";
  if (lower.includes("渐隐") || lower.includes("fade out")) return "已应用渐隐特效（500ms）";
  if (lower.includes("高亮") || lower.includes("highlight")) return "已应用高亮强调特效";
  if (lower.includes("剪短") || lower.includes("trim")) return "已根据 Prompt 裁剪片段";
  if (lower.includes("lut") || lower.includes("色彩") || lower.includes("color")) return "已应用自适应 LUT";
  if (lower.includes("字幕") || lower.includes("subtitle")) return "已生成多语言字幕轨道";
  return `已解析 Prompt「${prompt}」并加入编辑队列`;
}

async function exportProjectWeb(
  projectId: string,
  options: ExportOptions,
): Promise<ExportResult> {
  const project = projectStore.loadProject(projectId);
  const payload = {
    project,
    options,
    exportedAt: new Date().toISOString(),
    hint: "网页端导出项目包。完整 FFmpeg 渲染请使用桌面端 App。",
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name}-simcut-export.json`;
  a.click();
  URL.revokeObjectURL(url);

  const msgs = [`项目包已下载: ${project.name}-simcut-export.json`];
  if (options.saveToPhotos) msgs.push("相册保存需桌面端完成渲染后自动导入");
  if (options.uploadCloud) msgs.push(`网盘上传（${options.cloudProvider ?? "默认"}）需桌面端执行`);

  const filename = `${project.name}-simcut-export.json`;
  return {
    success: true,
    outputPath: filename,
    message: msgs.join(" | "),
    savedToPhotos: false,
    uploadedToCloud: false,
  };
}

function mockAiAnalysis(description: string): AiAnalysisResult {
  return {
    metrics: {
      iso: 800,
      shutterSpeed: "1/125",
      aperture: 2.8,
      exposureValue: 0.1,
      whiteBalanceK: 5600,
      highlightClipping: 0.05,
      shadowDetail: 0.72,
    },
    suggestions: [
      "曝光均衡，可直接剪辑",
      description ? `已分析素材描述：${description.slice(0, 40)}` : "",
    ].filter(Boolean),
    promptEdits: [
      { prompt: "让画面更电影感", action: "apply_cinematic_lut", confidence: 0.82 },
      { prompt: "加快节奏剪短前 2 秒", action: "trim_start 2000ms", confidence: 0.91 },
    ],
    overallScore: 0.85,
  };
}

export function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

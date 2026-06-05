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
import { DESKTOP_APP_HINT, invoke, isTauriApp } from "./tauri";

function requireDesktop<T>(fn: () => Promise<T>): Promise<T> {
  if (!isTauriApp()) return Promise.reject(new Error(DESKTOP_APP_HINT));
  return fn();
}

export const api = {
  isDesktop: isTauriApp,

  listProjects: (): Promise<ProjectSummary[]> =>
    isTauriApp() ? invoke("list_projects") : Promise.resolve([]),

  createProject: (name: string): Promise<Project> =>
    requireDesktop(() => invoke("create_project", { name })),

  loadProject: (id: string): Promise<Project> =>
    isTauriApp() ? invoke("load_project", { id }) : Promise.reject(new Error("NO_PROJECT")),

  saveProject: (project: Project): Promise<void> =>
    requireDesktop(() => invoke("save_project", { project })),

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
          { id: "fade-in", name: "渐显", category: "transition", params: { duration_ms: 500, intensity: 0 } },
          { id: "fade-out", name: "渐隐", category: "transition", params: { duration_ms: 500, intensity: 0 } },
          { id: "highlight", name: "高亮", category: "emphasis", params: { duration_ms: 0, intensity: 0.6 } },
        ]),

  addStillFrame: (
    projectId: string,
    mediaId: string,
    timestampMs: number,
    label: string,
    tags: string[],
    colorPalette: string[],
  ): Promise<StillFrame> =>
    requireDesktop(() =>
      invoke("add_still_frame", {
        projectId,
        mediaId,
        timestampMs,
        label,
        tags,
        colorPalette,
      }),
    ),

  analyzeColorFromPhoto: (sourcePath: string): Promise<ColorAnalysisResult> =>
    requireDesktop(() => invoke("analyze_color_from_photo", { sourcePath })),

  saveLutPreset: (lutCube: string, name: string): Promise<string> =>
    requireDesktop(() => invoke("save_lut_preset", { lutCube, name })),

  recognizeSubtitles: (
    projectId: string,
    language: string,
    mediaId?: string,
  ): Promise<SubtitleCue[]> =>
    requireDesktop(() =>
      invoke("recognize_subtitles", { projectId, language, mediaId }),
    ),

  analyzeFrameAi: (description: string, frameIndex: number): Promise<AiAnalysisResult> =>
    isTauriApp()
      ? invoke("analyze_frame_ai", { description, frameIndex })
      : Promise.resolve(mockAiAnalysis(description)),

  applyPromptEdit: (prompt: string): Promise<string> =>
    isTauriApp()
      ? invoke("apply_prompt_edit_command", { prompt })
      : Promise.resolve(`[预览] 已解析 Prompt「${prompt}」`),

  exportProject: (
    projectId: string,
    options: ExportOptions,
  ): Promise<ExportResult> =>
    requireDesktop(() => invoke("export_project", { projectId, options })),

  getProjectsDir: (): Promise<string> =>
    requireDesktop(() => invoke("get_projects_dir")),
};

function mockAiAnalysis(description: string) {
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

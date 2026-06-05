import type { EverecApp, PipelineStep } from "../types";

const isDev = import.meta.env.DEV;

export const EVEREC_APPS: EverecApp[] = [
  {
    id: "knowgo",
    name: "Knowgo",
    tagline: "视觉灵感认知",
    description: "采集灵感、解析风格、构建 Project Graph — 创作的第二大脑",
    icon: "brain",
    gradient: "from-teal-500/20 via-cyan-500/10 to-blue-600/20",
    glowColor: "#2dd4bf",
    status: "ready",
    devUrl: "http://localhost:1421",
    pipelineStep: 1,
    features: ["Brief 策划", "灵感采集", "AI 分析", "Project Graph"],
  },
  {
    id: "simcut",
    name: "Simcut",
    tagline: "轻量视频剪辑",
    description: "Prompt 可控剪辑、色彩风格、静帧导出 — CapCut 的审美升级版",
    icon: "film",
    gradient: "from-orange-500/20 via-rose-500/10 to-purple-600/20",
    glowColor: "#fb923c",
    status: "ready",
    devUrl: "http://localhost:1422",
    pipelineStep: 2,
    features: ["时间轴剪辑", "色彩/LUT", "字幕设计", "AI 分析"],
  },
  {
    id: "desound",
    name: "desound",
    tagline: "音频 / 音效创作",
    description: "音效库、拟音、作曲与 AI 声音设计 — 为画面注入听觉语言",
    icon: "music",
    gradient: "from-violet-500/20 via-purple-500/10 to-indigo-600/20",
    glowColor: "#a78bfa",
    status: "ready",
    devUrl: "http://localhost:1420",
    pipelineStep: 3,
    features: ["音效库", "拟音设计", "作曲", "AI 声音设计"],
  },
  {
    id: "inspibrary",
    name: "Inspibrary",
    tagline: "灵感库",
    description: "桌面面板 + iOS Companion — 随时采集、语义搜索、一键创建项目",
    icon: "sparkles",
    gradient: "from-pink-500/20 via-fuchsia-500/10 to-violet-600/20",
    glowColor: "#f472b6",
    status: "coming_soon",
    devUrl: "#",
    pipelineStep: 0,
    features: ["AI 标签", "语义搜索", "iOS 同步", "一键创建"],
  },
  {
    id: "prerector",
    name: "Prerector",
    tagline: "协作制片",
    description: "审片协作、任务分配、版本管理 — Project Graph 导出与团队共享",
    icon: "users",
    gradient: "from-sky-500/20 via-blue-500/10 to-indigo-600/20",
    glowColor: "#60a5fa",
    status: "coming_soon",
    devUrl: "#",
    pipelineStep: 4,
    features: ["审片协作", "任务分配", "Graph 导出", "团队共享"],
  },
];

export const PIPELINE: PipelineStep[] = [
  {
    step: 1,
    label: "灵感采集",
    appId: "knowgo",
    description: "Brief → 参考 → 风格解析",
  },
  {
    step: 2,
    label: "Prompt 剪辑",
    appId: "simcut",
    description: "时间轴 → 色彩 → 导出",
  },
  {
    step: 3,
    label: "声音设计",
    appId: "desound",
    description: "音效 → 拟音 → 混音",
  },
  {
    step: 4,
    label: "协作交付",
    appId: "prerector",
    description: "审片 → 协作 → Graph 归档",
  },
];

export function getAppUrl(app: EverecApp): string {
  if (app.status === "coming_soon") return "#";
  return isDev ? app.devUrl : app.prodUrl ?? app.devUrl;
}

export function getAppById(id: string): EverecApp | undefined {
  return EVEREC_APPS.find((a) => a.id === id);
}

export function launchApp(app: EverecApp): void {
  const url = getAppUrl(app);
  if (url === "#") return;
  window.open(url, "_blank", "noopener,noreferrer");
}

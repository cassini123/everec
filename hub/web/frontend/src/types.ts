export type HubWorkspace = "home" | "apps" | "projects" | "brain" | "settings";

export type EverecAppId = "simcut" | "desound" | "knowgo" | "inspibrary";

export type AppStatus = "ready" | "beta" | "coming_soon";

export interface EverecApp {
  id: EverecAppId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  gradient: string;
  glowColor: string;
  status: AppStatus;
  devUrl: string;
  prodUrl?: string;
  pipelineStep?: number;
  features: string[];
}

export interface EverecProject {
  id: string;
  title: string;
  appId: EverecAppId;
  updatedAt: string;
  thumbnail?: string;
  status?: "active" | "draft" | "archived";
}

export interface PipelineStep {
  step: number;
  label: string;
  appId: EverecAppId;
  description: string;
}

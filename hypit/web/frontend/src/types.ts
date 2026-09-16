export type FormatKind = "ranking" | "podcast" | "interview";
export type Aspect = "9:16" | "16:9" | "1:1";

export interface RankItem {
  tier: string;
  label: string;
}

export interface Workflow {
  id: string;
  title: string;
  kind: FormatKind;
  format: Aspect;
  duration: number;
  hook: string;
  host: string;
  hostB?: string;
  product?: string;
  language: string;
  music: string;
  narration: string[];
  ranks: RankItem[];
  reveals: string[];
  broll: string[];
}

export interface CloneVariant {
  id: string;
  name: string;
  blurb: string;
  patch: Partial<Workflow> & { ranks?: RankItem[] };
}

export interface TemplatePack {
  id: string;
  name: string;
  kind: FormatKind;
  tag: string;
  cost: string;
  description: string;
  source: string;
  variants: CloneVariant[];
}

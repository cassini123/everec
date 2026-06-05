/** Project Graph node types — aligned with Everec PRD §5.4 */
export type GraphNodeType =
  | "Project"
  | "Brief"
  | "Asset"
  | "Analysis"
  | "Shot"
  | "StyleTag"
  | "Mood"
  | "ColorPalette"
  | "Font"
  | "VfxPreset"
  | "ReferenceFilm"
  | "Implementation"
  | "DocumentSection";

export type GraphEdgeType =
  | "belongs_to"
  | "constrains"
  | "derived_from"
  | "evidences"
  | "similar_to"
  | "implements"
  | "uses"
  | "shot_of"
  | "has_section"
  | "references";

export interface GraphNode {
  id: string;
  projectId: string;
  type: GraphNodeType;
  label: string;
  props: Record<string, unknown>;
  refId?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface GraphEdge {
  id: string;
  projectId: string;
  from: string;
  to: string;
  type: GraphEdgeType;
  props?: Record<string, unknown>;
  createdAt: string;
}

export interface ProjectGraph {
  projectId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  updatedAt: string;
}

export interface GraphQueryResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Layout hint for UI visualization */
export interface GraphLayoutNode extends GraphNode {
  x: number;
  y: number;
}

export const GRAPH_NODE_COLORS: Record<GraphNodeType, string> = {
  Project: "#2dd4bf",
  Brief: "#60a5fa",
  Asset: "#a78bfa",
  Analysis: "#c084fc",
  Shot: "#f472b6",
  StyleTag: "#fb923c",
  Mood: "#fbbf24",
  ColorPalette: "#34d399",
  Font: "#38bdf8",
  VfxPreset: "#e879f9",
  ReferenceFilm: "#f87171",
  Implementation: "#fb7185",
  DocumentSection: "#94a3b8",
};

export const GRAPH_EDGE_LABELS: Record<GraphEdgeType, string> = {
  belongs_to: "属于",
  constrains: "约束",
  derived_from: "来源于",
  evidences: "证据",
  similar_to: "相似",
  implements: "实现",
  uses: "使用",
  shot_of: "镜头",
  has_section: "章节",
  references: "引用",
};

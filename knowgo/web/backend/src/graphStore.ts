import fs from "node:fs";
import path from "node:path";
import type {
  GraphNodeType,
  ImageAnalysis,
  InspirationCapture,
  KnowgoProject,
  ProjectBrief,
  ProjectGraph,
  StyleGuide,
  VideoAnalysis,
} from "@everec/shared";
import {
  initProjectGraph,
  syncBriefToGraph,
  syncCaptureToGraph,
  syncImageAnalysisToGraph,
  syncStyleGuideToGraph,
  syncVideoAnalysisToGraph,
} from "@everec/shared";

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "everec-knowgo")
  : path.join(process.cwd(), "data", "knowgo");

const GRAPHS_DIR = path.join(DATA_DIR, "graphs");

function ensureGraphsDir() {
  fs.mkdirSync(GRAPHS_DIR, { recursive: true });
}

function graphPath(projectId: string): string {
  return path.join(GRAPHS_DIR, `${projectId}.json`);
}

export function loadGraph(projectId: string): ProjectGraph {
  ensureGraphsDir();
  const fp = graphPath(projectId);
  if (fs.existsSync(fp)) {
    return JSON.parse(fs.readFileSync(fp, "utf-8")) as ProjectGraph;
  }
  const graph = initProjectGraph(projectId, "未命名项目");
  saveGraph(graph);
  return graph;
}

export function saveGraph(graph: ProjectGraph): void {
  ensureGraphsDir();
  const updated = { ...graph, updatedAt: new Date().toISOString() };
  fs.writeFileSync(graphPath(graph.projectId), JSON.stringify(updated, null, 2), "utf-8");
}

export function deleteGraph(projectId: string): void {
  ensureGraphsDir();
  const fp = graphPath(projectId);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

export function queryGraph(
  projectId: string,
  opts: { type?: GraphNodeType; refId?: string },
): ProjectGraph {
  const graph = loadGraph(projectId);
  if (!opts.type && !opts.refId) return graph;

  const nodes = graph.nodes.filter((n) => {
    if (opts.type && n.type !== opts.type) return false;
    if (opts.refId && n.refId !== opts.refId) return false;
    return true;
  });
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter((e) => nodeIds.has(e.from) || nodeIds.has(e.to));

  return { projectId, nodes, edges, updatedAt: graph.updatedAt };
}

export function initGraphForProject(projectId: string, title: string): ProjectGraph {
  const graph = initProjectGraph(projectId, title);
  saveGraph(graph);
  return graph;
}

export function graphSyncBrief(projectId: string, brief: ProjectBrief): ProjectGraph {
  const graph = syncBriefToGraph(loadGraph(projectId), projectId, brief);
  saveGraph(graph);
  return graph;
}

export function graphSyncCapture(projectId: string, capture: InspirationCapture): ProjectGraph {
  const graph = syncCaptureToGraph(loadGraph(projectId), projectId, capture);
  saveGraph(graph);
  return graph;
}

export function graphSyncImageAnalysis(
  projectId: string,
  captureId: string,
  analysis: ImageAnalysis,
): ProjectGraph {
  const graph = syncImageAnalysisToGraph(loadGraph(projectId), projectId, captureId, analysis);
  saveGraph(graph);
  return graph;
}

export function graphSyncVideoAnalysis(
  projectId: string,
  captureId: string,
  analysis: VideoAnalysis,
): ProjectGraph {
  const graph = syncVideoAnalysisToGraph(loadGraph(projectId), projectId, captureId, analysis);
  saveGraph(graph);
  return graph;
}

export function graphSyncStyleGuide(projectId: string, style: StyleGuide): ProjectGraph {
  const graph = syncStyleGuideToGraph(loadGraph(projectId), projectId, style);
  saveGraph(graph);
  return graph;
}

/** Rebuild entire graph from current project snapshot */
export function graphRebuildFromProject(project: KnowgoProject): ProjectGraph {
  let graph = initProjectGraph(project.id, project.title);
  graph = syncBriefToGraph(graph, project.id, project.brief);
  for (const capture of [...project.captures].reverse()) {
    graph = syncCaptureToGraph(graph, project.id, capture);
  }
  graph = syncStyleGuideToGraph(graph, project.id, project.styleGuide);
  saveGraph(graph);
  return graph;
}

export function exportGraphJson(projectId: string): string {
  return JSON.stringify(loadGraph(projectId), null, 2);
}

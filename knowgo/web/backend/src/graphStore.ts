import fs from "node:fs";
import path from "node:path";
import type {
  GraphNodeType,
  ImageAnalysis,
  InspirationCapture,
  InspirationDocument,
  KnowgoProject,
  ProjectBrief,
  ProjectGraph,
  StyleGuide,
  VideoAnalysis,
} from "@everec/shared";
import {
  buildDocumentFromGraph,
  collectKeywordsFromGraph,
  initProjectGraph,
  linkStyleDatasetToGraph,
  syncBriefToGraph,
  syncCaptureToGraph,
  syncImageAnalysisToGraph,
  syncStyleGuideToGraph,
  syncVideoAnalysisToGraph,
} from "@everec/shared";
import {
  graphStoreBackend,
  migrateJsonGraphToSqlite,
  sqliteDeleteGraph,
  sqliteLoadGraph,
  sqliteSaveGraph,
} from "./graphDb";

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "everec-knowgo")
  : path.join(process.cwd(), "data", "knowgo");

const GRAPHS_DIR = path.join(DATA_DIR, "graphs");

function ensureGraphsDir() {
  fs.mkdirSync(GRAPHS_DIR, { recursive: true });
}

function jsonGraphPath(projectId: string): string {
  return path.join(GRAPHS_DIR, `${projectId}.json`);
}

function loadGraphJson(projectId: string): ProjectGraph | null {
  ensureGraphsDir();
  const fp = jsonGraphPath(projectId);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, "utf-8")) as ProjectGraph;
}

function saveGraphJson(graph: ProjectGraph): void {
  ensureGraphsDir();
  const updated = { ...graph, updatedAt: new Date().toISOString() };
  fs.writeFileSync(jsonGraphPath(graph.projectId), JSON.stringify(updated, null, 2), "utf-8");
}

function persistGraph(graph: ProjectGraph): void {
  if (graphStoreBackend() === "sqlite") {
    sqliteSaveGraph(graph);
  } else {
    saveGraphJson(graph);
  }
}

function withDatasetLink(
  graph: ProjectGraph,
  projectId: string,
  extra: string[] = [],
): ProjectGraph {
  const keywords = [...collectKeywordsFromGraph(graph), ...extra];
  return linkStyleDatasetToGraph(graph, projectId, keywords);
}

export function loadGraph(projectId: string): ProjectGraph {
  if (graphStoreBackend() === "sqlite") {
    let graph = sqliteLoadGraph(projectId);
    if (!graph) {
      graph = migrateJsonGraphToSqlite(projectId);
    }
    if (graph) return graph;
  } else {
    const json = loadGraphJson(projectId);
    if (json) return json;
  }

  const graph = initProjectGraph(projectId, "未命名项目");
  persistGraph(graph);
  return graph;
}

export function saveGraph(graph: ProjectGraph): void {
  persistGraph(graph);
}

export function deleteGraph(projectId: string): void {
  if (graphStoreBackend() === "sqlite") {
    sqliteDeleteGraph(projectId);
  }
  const fp = jsonGraphPath(projectId);
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
  persistGraph(graph);
  return graph;
}

export function graphSyncBrief(projectId: string, brief: ProjectBrief): ProjectGraph {
  let graph = syncBriefToGraph(loadGraph(projectId), projectId, brief);
  graph = withDatasetLink(graph, projectId, [brief.tone, brief.references]);
  persistGraph(graph);
  return graph;
}

export function graphSyncCapture(projectId: string, capture: InspirationCapture): ProjectGraph {
  let graph = syncCaptureToGraph(loadGraph(projectId), projectId, capture);
  graph = withDatasetLink(graph, projectId, [capture.title, capture.platform ?? ""]);
  persistGraph(graph);
  return graph;
}

export function graphSyncImageAnalysis(
  projectId: string,
  captureId: string,
  analysis: ImageAnalysis,
): ProjectGraph {
  let graph = syncImageAnalysisToGraph(loadGraph(projectId), projectId, captureId, analysis);
  graph = withDatasetLink(graph, projectId, [
    analysis.artStyle,
    analysis.mood,
    ...analysis.techniques,
  ]);
  persistGraph(graph);
  return graph;
}

export function graphSyncVideoAnalysis(
  projectId: string,
  captureId: string,
  analysis: VideoAnalysis,
): ProjectGraph {
  let graph = syncVideoAnalysisToGraph(loadGraph(projectId), projectId, captureId, analysis);
  graph = withDatasetLink(graph, projectId, [
    analysis.filmStyle,
    analysis.colorGrading,
    ...analysis.overallKeywords,
  ]);
  persistGraph(graph);
  return graph;
}

export function graphSyncStyleGuide(projectId: string, style: StyleGuide): ProjectGraph {
  let graph = syncStyleGuideToGraph(loadGraph(projectId), projectId, style);
  graph = withDatasetLink(graph, projectId, [...style.keywords, ...style.moodTags]);
  persistGraph(graph);
  return graph;
}

export function graphRebuildFromProject(project: KnowgoProject): ProjectGraph {
  let graph = initProjectGraph(project.id, project.title);
  graph = syncBriefToGraph(graph, project.id, project.brief);
  for (const capture of [...project.captures].reverse()) {
    graph = syncCaptureToGraph(graph, project.id, capture);
  }
  graph = syncStyleGuideToGraph(graph, project.id, project.styleGuide);
  graph = withDatasetLink(graph, project.id);
  persistGraph(graph);
  return graph;
}

export function exportGraphJson(projectId: string): string {
  return JSON.stringify(loadGraph(projectId), null, 2);
}

export function buildProjectDocumentFromGraph(project: KnowgoProject): InspirationDocument {
  const graph = loadGraph(project.id);
  return buildDocumentFromGraph(graph, project);
}

export function getGraphStoreInfo() {
  return { backend: graphStoreBackend(), dataDir: DATA_DIR };
}

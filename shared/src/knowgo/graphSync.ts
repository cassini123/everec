import { v4 as uuidv4 } from "uuid";
import type {
  GraphEdge,
  GraphEdgeType,
  GraphNode,
  GraphNodeType,
  ProjectGraph,
} from "./graph";
import type {
  ImageAnalysis,
  InspirationCapture,
  ProjectBrief,
  StyleGuide,
  VideoAnalysis,
} from "./types";

export function createNode(
  projectId: string,
  type: GraphNodeType,
  label: string,
  props: Record<string, unknown> = {},
  refId?: string,
): GraphNode {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    projectId,
    type,
    label,
    props,
    refId,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

export function createEdge(
  projectId: string,
  from: string,
  to: string,
  type: GraphEdgeType,
  props?: Record<string, unknown>,
): GraphEdge {
  return {
    id: uuidv4(),
    projectId,
    from,
    to,
    type,
    props,
    createdAt: new Date().toISOString(),
  };
}

/** Upsert node by refId + type within project graph */
export function upsertNode(
  graph: ProjectGraph,
  node: GraphNode,
): { graph: ProjectGraph; node: GraphNode } {
  const idx = graph.nodes.findIndex(
    (n) => n.refId === node.refId && n.type === node.type && node.refId != null,
  );
  if (idx >= 0) {
    const updated: GraphNode = {
      ...graph.nodes[idx],
      label: node.label,
      props: node.props,
      updatedAt: new Date().toISOString(),
      version: graph.nodes[idx].version + 1,
    };
    const nodes = [...graph.nodes];
    nodes[idx] = updated;
    return {
      graph: { ...graph, nodes, updatedAt: new Date().toISOString() },
      node: updated,
    };
  }
  return {
    graph: {
      ...graph,
      nodes: [...graph.nodes, node],
      updatedAt: new Date().toISOString(),
    },
    node,
  };
}

export function removeNodesByRef(graph: ProjectGraph, refId: string): ProjectGraph {
  const removeIds = new Set(graph.nodes.filter((n) => n.refId === refId).map((n) => n.id));
  return {
    ...graph,
    nodes: graph.nodes.filter((n) => !removeIds.has(n.id)),
    edges: graph.edges.filter((e) => !removeIds.has(e.from) && !removeIds.has(e.to)),
    updatedAt: new Date().toISOString(),
  };
}

export function removeNodesByRefPrefix(graph: ProjectGraph, prefix: string): ProjectGraph {
  const removeIds = new Set(
    graph.nodes.filter((n) => n.refId?.startsWith(prefix)).map((n) => n.id),
  );
  return {
    ...graph,
    nodes: graph.nodes.filter((n) => !removeIds.has(n.id)),
    edges: graph.edges.filter((e) => !removeIds.has(e.from) && !removeIds.has(e.to)),
    updatedAt: new Date().toISOString(),
  };
}

export function addEdgeIfMissing(graph: ProjectGraph, edge: GraphEdge): ProjectGraph {
  const exists = graph.edges.some(
    (e) => e.from === edge.from && e.to === edge.to && e.type === edge.type,
  );
  if (exists) return graph;
  return {
    ...graph,
    edges: [...graph.edges, edge],
    updatedAt: new Date().toISOString(),
  };
}

export function initProjectGraph(projectId: string, title: string): ProjectGraph {
  const projectNode = createNode(projectId, "Project", title || "未命名项目", {
    title,
  });
  projectNode.refId = projectId;

  return {
    projectId,
    nodes: [projectNode],
    edges: [],
    updatedAt: new Date().toISOString(),
  };
}

export function getProjectRootNode(graph: ProjectGraph): GraphNode | undefined {
  return graph.nodes.find((n) => n.type === "Project");
}

export function syncBriefToGraph(
  graph: ProjectGraph,
  projectId: string,
  brief: ProjectBrief,
): ProjectGraph {
  let g = graph;
  const root = getProjectRootNode(g);
  if (!root) return g;

  if (root.label !== brief.title) {
    g = upsertNode(g, { ...root, label: brief.title || root.label, props: { ...root.props, title: brief.title } }).graph;
  }

  const briefNode = createNode(projectId, "Brief", brief.title || "项目 Brief", { ...brief }, "brief");
  const { graph: g2, node: briefN } = upsertNode(g, briefNode);
  g = g2;
  g = addEdgeIfMissing(g, createEdge(projectId, briefN.id, root.id, "belongs_to"));
  g = addEdgeIfMissing(g, createEdge(projectId, briefN.id, root.id, "constrains"));
  return g;
}

export function syncCaptureToGraph(
  graph: ProjectGraph,
  projectId: string,
  capture: InspirationCapture,
): ProjectGraph {
  let g = graph;
  const root = getProjectRootNode(g);
  if (!root) return g;

  g = removeNodesByRef(g, capture.id);

  const assetNode = createNode(
    projectId,
    "Asset",
    capture.title,
    {
      type: capture.type,
      sourceUrl: capture.sourceUrl,
      fileName: capture.fileName,
      previewUrl: capture.previewUrl,
      platform: capture.platform,
      description: capture.description,
    },
    capture.id,
  );
  g = { ...g, nodes: [...g.nodes, assetNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, assetNode.id, root.id, "belongs_to"));
  return g;
}

export function syncImageAnalysisToGraph(
  graph: ProjectGraph,
  projectId: string,
  captureId: string,
  analysis: ImageAnalysis,
): ProjectGraph {
  let g = graph;
  const asset = g.nodes.find((n) => n.refId === captureId && n.type === "Asset");
  if (!asset) return g;

  const analysisRef = `analysis-image-${captureId}`;
  g = removeNodesByRefPrefix(g, `analysis-image-${captureId}`);
  g = removeNodesByRefPrefix(g, `impl-image-${captureId}`);
  g = removeNodesByRefPrefix(g, `mood-${captureId}`);
  g = removeNodesByRefPrefix(g, `style-${captureId}`);
  g = removeNodesByRefPrefix(g, `palette-${captureId}`);

  const analysisNode = createNode(
    projectId,
    "Analysis",
    `图片分析 · ${analysis.artStyle}`,
    { ...analysis, mediaType: "image" },
    analysisRef,
  );
  g = { ...g, nodes: [...g.nodes, analysisNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, analysisNode.id, asset.id, "derived_from"));

  const implNode = createNode(
    projectId,
    "Implementation",
    analysis.implementation.summary.slice(0, 40),
    analysis.implementation as unknown as Record<string, unknown>,
    `impl-image-${captureId}`,
  );
  g = { ...g, nodes: [...g.nodes, implNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, implNode.id, analysisNode.id, "implements"));

  const moodNode = createNode(projectId, "Mood", analysis.mood, {}, `mood-${captureId}`);
  g = { ...g, nodes: [...g.nodes, moodNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, moodNode.id, analysisNode.id, "evidences"));

  const styleNode = createNode(
    projectId,
    "StyleTag",
    analysis.artStyle,
    { techniques: analysis.techniques },
    `style-${captureId}`,
  );
  g = { ...g, nodes: [...g.nodes, styleNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, styleNode.id, analysisNode.id, "evidences"));

  const paletteNode = createNode(
    projectId,
    "ColorPalette",
    analysis.colorPalette.join(", ").slice(0, 32),
    { colors: analysis.colorPalette },
    `palette-${captureId}`,
  );
  g = { ...g, nodes: [...g.nodes, paletteNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, paletteNode.id, analysisNode.id, "evidences"));

  return g;
}

export function syncVideoAnalysisToGraph(
  graph: ProjectGraph,
  projectId: string,
  captureId: string,
  analysis: VideoAnalysis,
): ProjectGraph {
  let g = graph;
  const asset = g.nodes.find((n) => n.refId === captureId && n.type === "Asset");
  if (!asset) return g;

  const analysisRef = `analysis-video-${captureId}`;
  g = removeNodesByRefPrefix(g, `analysis-video-${captureId}`);
  g = removeNodesByRefPrefix(g, `shot-${captureId}-`);
  g = removeNodesByRefPrefix(g, `vkw-${captureId}-`);

  const analysisNode = createNode(
    projectId,
    "Analysis",
    `视频分析 · ${analysis.filmStyle}`,
    { ...analysis, mediaType: "video" },
    analysisRef,
  );
  g = { ...g, nodes: [...g.nodes, analysisNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, analysisNode.id, asset.id, "derived_from"));

  for (const shot of analysis.shots) {
    const shotRef = `shot-${captureId}-${shot.index}`;
    const shotNode = createNode(projectId, "Shot", `镜头 #${shot.index}`, shot as unknown as Record<string, unknown>, shotRef);
    g = { ...g, nodes: [...g.nodes, shotNode] };
    g = addEdgeIfMissing(g, createEdge(projectId, shotNode.id, asset.id, "shot_of"));
    g = addEdgeIfMissing(g, createEdge(projectId, shotNode.id, analysisNode.id, "derived_from"));
  }

  for (const kw of analysis.overallKeywords) {
    const tagRef = `vkw-${captureId}-${kw}`;
    const tagNode = createNode(projectId, "StyleTag", kw, {}, tagRef);
    g = { ...g, nodes: [...g.nodes, tagNode] };
    g = addEdgeIfMissing(g, createEdge(projectId, tagNode.id, analysisNode.id, "evidences"));
  }

  return g;
}

export function syncStyleGuideToGraph(
  graph: ProjectGraph,
  projectId: string,
  style: StyleGuide,
): ProjectGraph {
  let g = graph;
  const root = getProjectRootNode(g);
  if (!root) return g;

  for (const kw of style.keywords) {
    const ref = `sg-kw-${kw}`;
    const existing = g.nodes.find((n) => n.refId === ref);
    if (!existing) {
      const node = createNode(projectId, "StyleTag", kw, { scope: "project" }, ref);
      g = { ...g, nodes: [...g.nodes, node] };
      g = addEdgeIfMissing(g, createEdge(projectId, node.id, root.id, "belongs_to"));
    }
  }

  for (const mood of style.moodTags) {
    const ref = `sg-mood-${mood}`;
    if (!g.nodes.find((n) => n.refId === ref)) {
      const node = createNode(projectId, "Mood", mood, {}, ref);
      g = { ...g, nodes: [...g.nodes, node] };
      g = addEdgeIfMissing(g, createEdge(projectId, node.id, root.id, "belongs_to"));
    }
  }

  for (const font of style.fonts) {
    const ref = `sg-font-${font.name}`;
    g = removeNodesByRef(g, ref);
    const node = createNode(projectId, "Font", font.name, font as unknown as Record<string, unknown>, ref);
    g = { ...g, nodes: [...g.nodes, node] };
    g = addEdgeIfMissing(g, createEdge(projectId, node.id, root.id, "uses"));
  }

  for (const vfx of style.vfxRecommendations) {
    const ref = `sg-vfx-${vfx.name}`;
    g = removeNodesByRef(g, ref);
    const node = createNode(projectId, "VfxPreset", vfx.name, vfx as unknown as Record<string, unknown>, ref);
    g = { ...g, nodes: [...g.nodes, node] };
    g = addEdgeIfMissing(g, createEdge(projectId, node.id, root.id, "implements"));
  }

  for (const film of style.similarShorts) {
    const ref = `sg-film-${film.id}`;
    g = removeNodesByRef(g, ref);
    const node = createNode(
      projectId,
      "ReferenceFilm",
      film.title,
      film as unknown as Record<string, unknown>,
      ref,
    );
    g = { ...g, nodes: [...g.nodes, node] };
    g = addEdgeIfMissing(g, createEdge(projectId, node.id, root.id, "similar_to", {
      similarity: film.similarity,
    }));
  }

  const paletteRef = "sg-poster-palette";
  g = removeNodesByRef(g, paletteRef);
  const paletteNode = createNode(
    projectId,
    "ColorPalette",
    "海报色板",
    style.posterStyle as unknown as Record<string, unknown>,
    paletteRef,
  );
  g = { ...g, nodes: [...g.nodes, paletteNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, paletteNode.id, root.id, "belongs_to"));

  return g;
}

export function computeGraphLayout(graph: ProjectGraph): import("./graph").GraphLayoutNode[] {
  const layers: GraphNodeType[][] = [
    ["Project"],
    ["Brief"],
    ["Asset"],
    ["Analysis", "DocumentSection"],
    ["Shot", "StyleTag", "Mood", "ColorPalette", "Font", "VfxPreset", "ReferenceFilm", "Implementation"],
  ];

  const layerIndex = new Map<GraphNodeType, number>();
  layers.forEach((types, i) => types.forEach((t) => layerIndex.set(t, i)));

  const byLayer = new Map<number, GraphNode[]>();
  for (const node of graph.nodes) {
    let li = layerIndex.get(node.type) ?? 4;
    if (node.props.fromStyleDataset === true) li = Math.min(li + 1, 4);
    if (!byLayer.has(li)) byLayer.set(li, []);
    byLayer.get(li)!.push(node);
  }

  const result: import("./graph").GraphLayoutNode[] = [];
  const layerGap = 120;
  const nodeGap = 140;

  for (const [li, nodes] of byLayer.entries()) {
    const totalWidth = (nodes.length - 1) * nodeGap;
    nodes.forEach((node, i) => {
      result.push({
        ...node,
        x: i * nodeGap - totalWidth / 2 + 400,
        y: li * layerGap + 60,
      });
    });
  }

  return result;
}

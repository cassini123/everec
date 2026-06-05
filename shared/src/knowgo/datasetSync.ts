import type { ProjectGraph } from "./graph";
import {
  addEdgeIfMissing,
  createEdge,
  createNode,
  getProjectRootNode,
  upsertNode,
} from "./graphSync";
import {
  matchStyleDataset,
  type StyleDatasetCategory,
  type StyleDatasetEntry,
} from "./styleDataset";

const CATEGORY_NODE_TYPE: Record<
  StyleDatasetCategory,
  "ReferenceFilm" | "ColorPalette" | "StyleTag" | "Font" | "VfxPreset" | "Mood"
> = {
  director: "ReferenceFilm",
  film: "ReferenceFilm",
  color_grade: "ColorPalette",
  shot_language: "StyleTag",
  font: "Font",
  vfx: "VfxPreset",
  mood: "Mood",
};

function datasetNodeLabel(entry: StyleDatasetEntry): string {
  return entry.nameZh || entry.name;
}

export function linkStyleDatasetToGraph(
  graph: ProjectGraph,
  projectId: string,
  keywords: string[],
): ProjectGraph {
  let g = graph;
  const root = getProjectRootNode(g);
  if (!root) return g;

  const matches = matchStyleDataset(keywords, 8);
  if (matches.length === 0) return g;

  for (const { entry, score } of matches) {
    const refId = `dataset-${entry.id}`;
    const nodeType = CATEGORY_NODE_TYPE[entry.category];
    const node = createNode(
      projectId,
      nodeType,
      datasetNodeLabel(entry),
      {
        fromStyleDataset: true,
        datasetId: entry.id,
        category: entry.category,
        name: entry.name,
        nameZh: entry.nameZh,
        tags: entry.tags,
        description: entry.description,
        implementation: entry.implementation,
        tools: entry.tools,
        matchScore: score,
      },
      refId,
    );

    const { graph: g2, node: datasetN } = upsertNode(g, node);
    g = g2;
    g = addEdgeIfMissing(
      g,
      createEdge(projectId, root.id, datasetN.id, "similar_to", {
        score,
        source: "style-dataset",
      }),
    );

    for (const tagNode of g.nodes.filter(
      (n) => n.type === "StyleTag" || n.type === "Mood",
    )) {
      const tagLabel = tagNode.label.toLowerCase();
      if (entry.tags.some((t) => tagLabel.includes(t.toLowerCase()) || t.toLowerCase().includes(tagLabel))) {
        g = addEdgeIfMissing(
          g,
          createEdge(projectId, tagNode.id, datasetN.id, "references", {
            source: "style-dataset",
          }),
        );
      }
    }
  }

  return g;
}

export function collectKeywordsFromGraph(graph: ProjectGraph): string[] {
  const kw = new Set<string>();
  for (const node of graph.nodes) {
    kw.add(node.label);
    if (node.type === "StyleTag" || node.type === "Mood") {
      const tags = node.props.tags;
      if (Array.isArray(tags)) tags.forEach((t) => kw.add(String(t)));
    }
    if (node.type === "Analysis") {
      const artStyle = node.props.artStyle;
      const filmStyle = node.props.filmStyle;
      if (artStyle) kw.add(String(artStyle));
      if (filmStyle) kw.add(String(filmStyle));
      const keywords = node.props.overallKeywords;
      if (Array.isArray(keywords)) keywords.forEach((k) => kw.add(String(k)));
    }
  }
  return [...kw].filter(Boolean);
}

import type { InspirationDocument, KnowgoProject } from "./types";
import type { GraphNode, ProjectGraph } from "./graph";

function nodeList(graph: ProjectGraph, type: GraphNode["type"]): GraphNode[] {
  return graph.nodes.filter((n) => n.type === type);
}

/** Build inspiration document by traversing Project Graph */
export function buildDocumentFromGraph(
  graph: ProjectGraph,
  project: KnowgoProject,
): InspirationDocument {
  const briefNodes = nodeList(graph, "Brief");
  const brief = briefNodes[0]?.props as Record<string, string> | undefined;
  const assets = nodeList(graph, "Asset");
  const analyses = nodeList(graph, "Analysis");
  const shots = nodeList(graph, "Shot");
  const styleTags = nodeList(graph, "StyleTag");
  const moods = nodeList(graph, "Mood");
  const palettes = nodeList(graph, "ColorPalette");
  const fonts = nodeList(graph, "Font");
  const vfx = nodeList(graph, "VfxPreset");
  const films = nodeList(graph, "ReferenceFilm");
  const impls = nodeList(graph, "Implementation");
  const datasetNodes = graph.nodes.filter((n) => n.props.fromStyleDataset === true);

  const overviewLines: string[] = [];
  if (brief) {
    if (brief.client) overviewLines.push(`**客户**：${brief.client}`);
    if (brief.objective) overviewLines.push(`**目标**：${brief.objective}`);
    if (brief.audience) overviewLines.push(`**受众**：${brief.audience}`);
    if (brief.tone) overviewLines.push(`**调性**：${brief.tone}`);
    if (brief.deliverables) overviewLines.push(`**交付物**：${brief.deliverables}`);
  }
  if (overviewLines.length === 0 && project.brief.title) {
    overviewLines.push(`**项目**：${project.brief.title}`);
  }

  const inspirationLines = assets.map((a) => {
    const platform = a.props.platform ?? a.props.type ?? "";
    return `- **${a.label}**（${platform}）`;
  });

  const visualLines: string[] = [];
  for (const a of analyses) {
    const mediaType = a.props.mediaType === "video" ? "视频" : "图片";
    visualLines.push(`### ${mediaType}分析 · ${a.label}`);
    if (a.props.artStyle) visualLines.push(`- 艺术风格：${a.props.artStyle}`);
    if (a.props.filmStyle) visualLines.push(`- 短片风格：${a.props.filmStyle}`);
    if (a.props.colorGrading) visualLines.push(`- 调色：${a.props.colorGrading}`);
    if (a.props.mood) visualLines.push(`- 情绪：${a.props.mood}`);
    visualLines.push("");
  }
  if (styleTags.length) {
    visualLines.push(`**风格标签**：${styleTags.map((t) => t.label).join(" · ")}`);
  }
  if (moods.length) {
    visualLines.push(`**情绪**：${moods.map((m) => m.label).join(" · ")}`);
  }
  if (palettes.length) {
    visualLines.push(`**色板**：${palettes.map((p) => p.label).join(" · ")}`);
  }
  if (fonts.length) {
    visualLines.push(`**字体**：${fonts.map((f) => f.label).join(" · ")}`);
  }
  if (films.length) {
    visualLines.push(`**参考片**：${films.map((f) => f.label).join(" · ")}`);
  }

  const implLines: string[] = [];
  for (const impl of impls) {
    implLines.push(`### ${impl.label}`);
    if (impl.props.summary) implLines.push(String(impl.props.summary));
    const tools = impl.props.tools;
    if (Array.isArray(tools) && tools.length) {
      implLines.push(`工具：${tools.join(", ")}`);
    }
    const steps = impl.props.steps;
    if (Array.isArray(steps)) {
      steps.forEach((s, i) => implLines.push(`${i + 1}. ${s}`));
    }
    implLines.push("");
  }
  for (const v of vfx) {
    implLines.push(`### 特效 · ${v.label}`);
    if (v.props.description) implLines.push(String(v.props.description));
    if (v.props.implementation) implLines.push(String(v.props.implementation));
    implLines.push("");
  }
  if (shots.length) {
    implLines.push("### 分镜要点");
    for (const s of shots.slice(0, 12)) {
      implLines.push(
        `- **#${s.props.index ?? "?"}** ${s.props.shotType ?? ""} · ${s.props.description ?? s.label}（${s.props.implementation ?? ""}）`,
      );
    }
  }
  if (datasetNodes.length) {
    implLines.push("### Style Dataset 匹配");
    for (const d of datasetNodes) {
      const score = d.props.matchScore;
      implLines.push(
        `- **${d.label}**${score ? ` (${Math.round(Number(score) * 100)}%)` : ""}：${d.props.description ?? ""}`,
      );
      if (d.props.implementation) implLines.push(`  实现：${d.props.implementation}`);
    }
  }

  const assetRefIds = assets
    .map((a) => a.refId)
    .filter((id): id is string => !!id);

  return {
    title: project.brief.title || project.title || "灵感分析文档",
    sections: [
      {
        id: "overview",
        heading: "项目概述",
        content: overviewLines.join("\n\n"),
        mediaIds: [],
      },
      {
        id: "inspiration",
        heading: "灵感来源",
        content: inspirationLines.join("\n") || "_暂无采集素材_",
        mediaIds: assetRefIds.slice(0, 6),
      },
      {
        id: "visual",
        heading: "视觉语言",
        content: visualLines.join("\n") || "_请先完成灵感分析_",
        mediaIds: [],
      },
      {
        id: "implementation",
        heading: "实现方案",
        content: implLines.join("\n") || "_图谱中暂无实现节点_",
        mediaIds: [],
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

export function workspaceForNodeType(type: GraphNode["type"]): import("./types").KnowgoWorkspace {
  switch (type) {
    case "Brief":
      return "brief";
    case "Asset":
      return "capture";
    case "Analysis":
    case "Shot":
    case "Implementation":
      return "analyze";
    case "StyleTag":
    case "Mood":
    case "ColorPalette":
    case "Font":
    case "VfxPreset":
    case "ReferenceFilm":
      return "style";
    case "DocumentSection":
      return "document";
    default:
      return "graph";
  }
}

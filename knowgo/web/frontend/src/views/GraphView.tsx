import { useCallback, useEffect, useState } from "react";
import {
  Download,
  ExternalLink,
  GitBranch,
  Loader2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  GRAPH_EDGE_LABELS,
  GRAPH_NODE_COLORS,
  workspaceForNodeType,
  type GraphLayoutNode,
  type GraphNode,
  type KnowgoProject,
  type KnowgoWorkspace,
} from "../types";
import { api } from "../lib/api";

interface GraphViewProps {
  project: KnowgoProject;
  onNavigate: (workspace: KnowgoWorkspace, refId?: string) => void;
}

export function GraphView({ project, onNavigate }: GraphViewProps) {
  const [layout, setLayout] = useState<GraphLayoutNode[]>([]);
  const [edges, setEdges] = useState<{ from: GraphLayoutNode; to: GraphLayoutNode; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  const loadGraph = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getGraph(project.id);
      setLayout(data.layout);
      setStats({ nodes: data.graph.nodes.length, edges: data.graph.edges.length });

      const byId = new Map(data.layout.map((n) => [n.id, n]));
      const resolved = data.graph.edges
        .map((e) => {
          const from = byId.get(e.from);
          const to = byId.get(e.to);
          if (!from || !to) return null;
          return { from, to, type: e.type };
        })
        .filter(Boolean) as { from: GraphLayoutNode; to: GraphLayoutNode; type: string }[];
      setEdges(resolved);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const handleRebuild = async () => {
    setLoading(true);
    try {
      const data = await api.rebuildGraph(project.id);
      setLayout(data.layout);
      setStats({ nodes: data.graph.nodes.length, edges: data.graph.edges.length });
    } finally {
      setLoading(false);
    }
  };

  const bounds = layout.reduce(
    (acc, n) => ({
      minX: Math.min(acc.minX, n.x),
      maxX: Math.max(acc.maxX, n.x),
      minY: Math.min(acc.minY, n.y),
      maxY: Math.max(acc.maxY, n.y),
    }),
    { minX: 0, maxX: 800, minY: 0, maxY: 400 },
  );
  const width = Math.max(800, bounds.maxX - bounds.minX + 200);
  const height = Math.max(400, bounds.maxY - bounds.minY + 160);

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-kg-border bg-kg-panel px-6 py-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <GitBranch className="h-5 w-5 text-kg-accent" />
              Project Graph
            </h2>
            <p className="text-xs text-kg-muted">
              项目知识图谱 · {stats.nodes} 节点 · {stats.edges} 边
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="rounded border border-kg-border p-1.5 hover:bg-kg-elevated"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="rounded border border-kg-border p-1.5 hover:bg-kg-elevated"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRebuild}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-kg-border px-3 py-1.5 text-xs hover:bg-kg-elevated disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              重建图谱
            </button>
            <a
              href={api.exportGraph(project.id)}
              download
              className="flex items-center gap-1.5 rounded-lg bg-kg-accent px-3 py-1.5 text-xs font-medium text-kg-bg hover:bg-kg-accent-dim"
            >
              <Download className="h-3.5 w-3.5" />
              导出 JSON
            </a>
          </div>
        </div>

        <div className="relative flex-1 overflow-auto bg-kg-bg">
          {loading && layout.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-kg-accent" />
            </div>
          ) : layout.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-kg-muted">
              <GitBranch className="h-10 w-10 opacity-40" />
              <p>图谱为空，请保存 Brief 或采集灵感后点击「重建图谱」</p>
            </div>
          ) : (
            <svg
              width={width * zoom}
              height={height * zoom}
              viewBox={`${bounds.minX - 80} ${bounds.minY - 40} ${width} ${height}`}
              className="min-w-full"
            >
              {edges.map((e, i) => (
                <g key={i}>
                  <line
                    x1={e.from.x}
                    y1={e.from.y + 20}
                    x2={e.to.x}
                    y2={e.to.y - 8}
                    stroke="#343a46"
                    strokeWidth={1.5}
                    markerEnd="url(#arrow)"
                  />
                  <text
                    x={(e.from.x + e.to.x) / 2}
                    y={(e.from.y + e.to.y) / 2}
                    fill="#8b919e"
                    fontSize={9}
                    textAnchor="middle"
                  >
                    {GRAPH_EDGE_LABELS[e.type as keyof typeof GRAPH_EDGE_LABELS] ?? e.type}
                  </text>
                </g>
              ))}
              <defs>
                <marker
                  id="arrow"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L6,3 L0,6 Z" fill="#343a46" />
                </marker>
              </defs>
              {layout.map((node) => {
                const color = GRAPH_NODE_COLORS[node.type] ?? "#94a3b8";
                const active = selected?.id === node.id;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelected(node)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={-56}
                      y={-12}
                      width={112}
                      height={40}
                      rx={8}
                      fill={active ? "#262a33" : "#1e2128"}
                      stroke={color}
                      strokeWidth={active ? 2 : 1}
                    />
                    <text
                      y={-2}
                      textAnchor="middle"
                      fill={color}
                      fontSize={9}
                      fontWeight={600}
                    >
                      {node.type}
                    </text>
                    <text
                      y={14}
                      textAnchor="middle"
                      fill="#eceef2"
                      fontSize={10}
                    >
                      {node.label.length > 14 ? `${node.label.slice(0, 14)}…` : node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      <aside className="w-72 shrink-0 overflow-auto border-l border-kg-border bg-kg-surface">
        <div className="border-b border-kg-border px-4 py-3 text-xs font-medium uppercase tracking-wider text-kg-muted">
          节点详情
        </div>
        {!selected ? (
          <p className="p-4 text-sm text-kg-muted">点击图谱中的节点查看属性</p>
        ) : (
          <div className="space-y-3 p-4">
            <div>
              <div className="text-[10px] uppercase text-kg-muted">{selected.type}</div>
              <div className="mt-1 font-medium">{selected.label}</div>
            </div>
            {selected.refId && (
              <div className="text-xs text-kg-muted">
                ref: <span className="font-mono">{selected.refId}</span>
              </div>
            )}
            {selected.props.fromStyleDataset === true && (
              <span className="inline-block rounded bg-kg-purple/20 px-2 py-0.5 text-[10px] text-kg-purple">
                Style Dataset
              </span>
            )}
            <div className="text-xs text-kg-muted">v{selected.version}</div>
            {workspaceForNodeType(selected.type) !== "graph" && (
              <button
                type="button"
                onClick={() => {
                  const ws = workspaceForNodeType(selected.type);
                  const refId =
                    selected.type === "Asset" ? selected.refId : undefined;
                  onNavigate(ws, refId);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-kg-accent px-3 py-2 text-xs font-medium text-kg-bg hover:bg-kg-accent-dim"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                跳转到 {workspaceForNodeType(selected.type)}
              </button>
            )}
            <pre className="max-h-64 overflow-auto rounded-lg bg-kg-bg p-3 font-mono text-[10px] leading-relaxed text-kg-muted">
              {JSON.stringify(selected.props, null, 2)}
            </pre>
          </div>
        )}
      </aside>
    </div>
  );
}

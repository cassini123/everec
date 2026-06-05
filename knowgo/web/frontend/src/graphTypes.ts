import type { GraphLayoutNode, ProjectGraph } from "@everec/shared";

export interface GraphResponse {
  graph: ProjectGraph;
  layout: GraphLayoutNode[];
}

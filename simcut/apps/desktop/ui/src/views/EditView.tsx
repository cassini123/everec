import { Timeline } from "../components/timeline/Timeline";
import type { Project } from "../types";

interface Props {
  project: Project;
  positionMs: number;
}

export function EditView({ project, positionMs }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-48 shrink-0 items-center justify-center border-b border-sc-border bg-black">
        <div className="text-center text-sc-muted">
          <div className="text-4xl opacity-20">▶</div>
          <p className="mt-2 text-xs">预览窗口 · 代理预览策略保证流畅</p>
        </div>
      </div>
      <Timeline project={project} positionMs={positionMs} />
    </div>
  );
}

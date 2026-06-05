import { useState } from "react";
import { FolderPlus, Plus } from "lucide-react";
import { api, formatMs } from "../lib/api";
import type { Project, ProjectSummary } from "../types";

interface Props {
  projects: ProjectSummary[];
  onRefresh: () => void;
  onSelect: (project: Project) => void;
}

export function ProjectsView({ projects, onRefresh, onSelect }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const project = await api.createProject(name.trim());
      setName("");
      onRefresh();
      onSelect(project);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleOpen = async (id: string) => {
    try {
      const project = await api.loadProject(id);
      onSelect(project);
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">项目管理</h1>
        <p className="mt-1 text-sm text-sc-muted">
          更清晰的文件管理 — 按项目组织素材、静帧、LUT 与字幕
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="新建超短篇项目…"
          className="flex-1 rounded-lg border border-sc-border bg-sc-panel px-4 py-2 text-sm outline-none focus:border-sc-accent"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button
          type="button"
          disabled={busy}
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-sc-accent px-4 py-2 text-sm font-medium text-white hover:bg-sc-accent-dim disabled:opacity-50"
        >
          <Plus size={16} />
          创建
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-950/40 px-3 py-2 text-xs text-red-300">{error}</p>
      )}

      <div className="grid flex-1 grid-cols-1 gap-3 overflow-auto md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleOpen(p.id)}
            className="flex flex-col rounded-xl border border-sc-border bg-sc-panel p-4 text-left transition-colors hover:border-sc-accent/50"
          >
            <div className="mb-2 flex items-center gap-2">
              <FolderPlus size={18} className="text-sc-accent" />
              <span className="font-medium">{p.name}</span>
            </div>
            <div className="text-xs text-sc-muted">
              {p.mediaCount} 个素材 · {formatMs(p.durationMs)}
            </div>
          </button>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-sc-muted">
            <FolderPlus size={40} className="mb-3 opacity-40" />
            <p className="text-sm">暂无项目，创建你的第一个超短篇剪辑</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { FolderPlus, Plus, Trash2 } from "lucide-react";
import {
  createProject,
  deleteProject,
  getProject,
  setActiveProjectId,
} from "../lib/projects";
import type { DesoundProject, DesoundProjectSummary } from "@everec/shared";

interface ProjectsViewProps {
  projects: DesoundProjectSummary[];
  activeProjectId: string | null;
  onRefresh: () => void;
  onSelect: (project: DesoundProject) => void;
}

export function ProjectsView({
  projects,
  activeProjectId,
  onRefresh,
  onSelect,
}: ProjectsViewProps) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const project = createProject(name.trim());
      setActiveProjectId(project.id);
      setName("");
      onRefresh();
      onSelect(project);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleOpen = (id: string) => {
    const project = getProject(id);
    if (!project) {
      setError("项目不存在或已被删除");
      onRefresh();
      return;
    }
    setActiveProjectId(project.id);
    onSelect(project);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("确定删除此项目？")) return;
    deleteProject(id);
    onRefresh();
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">项目管理</h1>
        <p className="mt-1 text-sm text-ds-muted">
          按项目组织素材、编曲与声音设计 — 各工作区左上角可切换归属项目
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="新建音频项目…"
          className="flex-1 rounded-lg border border-ds-border bg-ds-panel px-4 py-2 text-sm outline-none focus:border-ds-accent"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button
          type="button"
          disabled={busy}
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-ds-accent px-4 py-2 text-sm font-medium text-white hover:bg-ds-accent-dim disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          创建
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-950/40 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      <div className="grid flex-1 grid-cols-1 gap-3 overflow-auto md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <div
            key={p.id}
            className={`flex flex-col rounded-xl border p-4 transition-colors ${
              p.id === activeProjectId
                ? "border-ds-accent/60 bg-ds-accent/5"
                : "border-ds-border bg-ds-panel hover:border-ds-accent/40"
            }`}
          >
            <button
              type="button"
              onClick={() => handleOpen(p.id)}
              className="flex flex-1 flex-col text-left"
            >
              <div className="mb-2 flex items-center gap-2">
                <FolderPlus className="h-[18px] w-[18px] text-ds-accent" />
                <span className="font-medium">{p.name}</span>
              </div>
              <div className="text-xs text-ds-muted">
                {p.soundCount} 个素材 · 更新于{" "}
                {new Date(p.updatedAt).toLocaleDateString("zh-CN")}
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleDelete(p.id)}
              className="mt-3 flex items-center gap-1 self-start text-[11px] text-ds-muted transition hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              删除
            </button>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-ds-muted">
            <FolderPlus className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm">暂无项目，创建你的第一个音频项目</p>
          </div>
        )}
      </div>
    </div>
  );
}

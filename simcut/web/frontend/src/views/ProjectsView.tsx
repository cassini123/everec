import { useState } from "react";
import { Check, FolderPlus, Plus, X } from "lucide-react";
import { api, formatMs } from "../lib/api";
import type { Project, ProjectSummary } from "../types";

interface Props {
  projects: ProjectSummary[];
  onRefresh: () => void;
  onSelect: (project: Project) => void;
}

export function ProjectsView({ projects, onRefresh, onSelect }: Props) {
  const [creating, setCreating] = useState(false);
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
      setCreating(false);
      onRefresh();
      onSelect(project);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    setCreating(false);
    setName("");
    setError("");
  };

  const handleOpen = async (id: string) => {
    try {
      const project = await api.loadProject(id);
      onSelect(project);
    } catch (err) {
      setError(String(err));
    }
  };

  const createCard = (
    <div
      className={`flex flex-col rounded-xl border border-dashed border-sc-border bg-sc-panel transition-colors ${
        projects.length === 0 ? "items-center justify-center px-8 py-20" : "p-4"
      }`}
    >
      {creating ? (
        <div className={`flex flex-col gap-2 ${projects.length === 0 ? "w-full max-w-xs" : ""}`}>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入项目名称…"
            className="rounded-lg border border-sc-border bg-sc-bg px-4 py-2 text-sm outline-none focus:border-sc-accent"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") handleCancel();
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || !name.trim()}
              onClick={handleCreate}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sc-accent px-3 py-2 text-sm font-medium text-white hover:bg-sc-accent-dim disabled:opacity-50"
            >
              <Check size={14} />
              保存
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleCancel}
              className="rounded-lg border border-sc-border px-3 py-2 text-sm text-sc-muted hover:border-sc-accent/40"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className={`flex flex-col items-center justify-center text-sc-muted transition-colors hover:text-sc-accent ${
            projects.length === 0 ? "gap-3" : "min-h-[88px] w-full gap-2"
          }`}
        >
          <div
            className={`flex items-center justify-center rounded-full border border-sc-border bg-sc-bg transition-colors hover:border-sc-accent hover:bg-sc-accent/10 ${
              projects.length === 0 ? "h-16 w-16" : "h-10 w-10"
            }`}
          >
            <Plus size={projects.length === 0 ? 28 : 20} />
          </div>
          {projects.length === 0 && (
            <p className="text-sm">点击创建你的第一个超短篇剪辑</p>
          )}
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">项目管理</h1>
        <p className="mt-1 text-sm text-sc-muted">
          更清晰的文件管理 — 按项目组织素材、静帧、LUT 与字幕
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-950/40 px-3 py-2 text-xs text-red-300">{error}</p>
      )}

      <div
        className={`grid flex-1 gap-3 overflow-auto ${
          projects.length === 0
            ? "place-items-center"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {projects.length === 0 ? (
          createCard
        ) : (
          <>
            {createCard}
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
          </>
        )}
      </div>
    </div>
  );
}

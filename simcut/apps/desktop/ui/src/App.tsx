import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { TransportBar } from "./components/layout/TransportBar";
import { ExportDialog } from "./components/export/ExportDialog";
import { ProjectsView } from "./views/ProjectsView";
import { EditView } from "./views/EditView";
import { SubtitlesView } from "./views/SubtitlesView";
import { ColorView } from "./views/ColorView";
import { StillsView } from "./views/StillsView";
import { EffectsView } from "./views/EffectsView";
import { FontsView } from "./views/FontsView";
import { AiView } from "./views/AiView";
import { api } from "./lib/api";
import { timelineExtentMs } from "./lib/timelineLayout";
import type { Project, ProjectSummary, Workspace } from "./types";

const SEEK_STEP_MS = 500;

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>("projects");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [ready, setReady] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [lutApplied, setLutApplied] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    try {
      setProjects(await api.listProjects());
    } catch {
      /* ignore */
    }
  }, []);

  const updateProject = useCallback(
    async (updated: Project) => {
      setProject(updated);
      await api.saveProject(updated);
      await refreshProjects();
    },
    [refreshProjects],
  );

  useEffect(() => {
    refreshProjects().finally(() => setReady(true));
  }, [refreshProjects]);

  const seekBy = useCallback(
    (deltaMs: number) => {
      if (!project) return;
      setPositionMs((ms) => {
        const max = timelineExtentMs(project.durationMs, ms);
        return Math.max(0, Math.min(max, ms + deltaMs));
      });
    },
    [project],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!project || workspace === "projects") return;
      if (isTypingTarget(e.target)) return;

      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
        return;
      }

      if (e.code === "ArrowLeft") {
        e.preventDefault();
        seekBy(-SEEK_STEP_MS);
        return;
      }

      if (e.code === "ArrowRight") {
        e.preventDefault();
        seekBy(SEEK_STEP_MS);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [project, workspace, seekBy]);

  const handleSelectProject = (p: Project) => {
    setProject(p);
    setWorkspace("edit");
    setPositionMs(0);
    setPlaying(false);
  };

  const handleToggleEffect = (id: string) => {
    setActiveEffects((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  const showTransport = project && workspace !== "projects";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sc-bg">
      <TopBar project={project} />
      <div className="flex min-h-0 flex-1">
        <Sidebar workspace={workspace} onChange={setWorkspace} />
        <main className="flex min-w-0 flex-1 flex-col">
          {!ready ? (
            <div className="flex flex-1 items-center justify-center text-sc-muted">
              正在加载 Simcut…
            </div>
          ) : workspace === "projects" ? (
            <ProjectsView
              projects={projects}
              onRefresh={refreshProjects}
              onSelect={handleSelectProject}
            />
          ) : !project ? (
            <div className="flex flex-1 flex-col items-center justify-center text-sc-muted">
              <p>请先选择或创建一个项目</p>
              <button
                type="button"
                onClick={() => setWorkspace("projects")}
                className="mt-3 rounded-lg bg-sc-accent px-4 py-2 text-sm text-white"
              >
                前往项目
              </button>
            </div>
          ) : workspace === "edit" ? (
            <EditView
              project={project}
              positionMs={positionMs}
              playing={playing}
              onProjectUpdate={updateProject}
              onPositionChange={setPositionMs}
            />
          ) : workspace === "subtitles" ? (
            <SubtitlesView project={project} onUpdate={updateProject} />
          ) : workspace === "color" ? (
            <ColorView
              project={project}
              positionMs={positionMs}
              onApplyLut={setLutApplied}
            />
          ) : workspace === "stills" ? (
            <StillsView
              project={project}
              positionMs={positionMs}
              onUpdate={updateProject}
            />
          ) : workspace === "effects" ? (
            <EffectsView activeEffects={activeEffects} onToggle={handleToggleEffect} />
          ) : workspace === "fonts" ? (
            <FontsView />
          ) : workspace === "ai" ? (
            <AiView projectName={project.name} />
          ) : null}
        </main>
      </div>

      {showTransport && (
        <TransportBar
          playing={playing}
          positionMs={positionMs}
          durationMs={project?.durationMs ?? 0}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onStop={() => {
            setPlaying(false);
            setPositionMs(0);
          }}
          onExport={() => setExportOpen(true)}
        />
      )}

      <ExportDialog
        open={exportOpen}
        projectId={project?.id ?? null}
        onClose={() => setExportOpen(false)}
      />

      {lutApplied && (
        <div className="absolute bottom-16 right-4 rounded-lg bg-sc-accent/20 px-3 py-1.5 text-xs text-sc-accent">
          已应用 LUT: {lutApplied}
        </div>
      )}
    </div>
  );
}

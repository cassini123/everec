import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { BriefView } from "./views/BriefView";
import { CaptureView } from "./views/CaptureView";
import { AnalyzeView } from "./views/AnalyzeView";
import { DocumentView } from "./views/DocumentView";
import { StyleView } from "./views/StyleView";
import { GraphView } from "./views/GraphView";
import { api, getStoredApiKey, setStoredApiKey } from "./lib/api";
import { setGraphNavigation } from "./lib/graphNav";
import type { KnowgoProject, KnowgoWorkspace } from "./types";
import { DEFAULT_BRIEF, DEFAULT_DOCUMENT, DEFAULT_STYLE_GUIDE } from "@everec/shared";

export default function App() {
  const [workspace, setWorkspace] = useState<KnowgoWorkspace>("brief");
  const [project, setProject] = useState<KnowgoProject | null>(null);
  const [apiKey, setApiKeyState] = useState(getStoredApiKey());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    setStoredApiKey(key);
  };

  const initProject = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await api.health();
      const projects = await api.listProjects();
      if (projects.length > 0) {
        setProject(projects[0]);
      } else {
        setProject(await api.createProject("我的灵感项目"));
      }
    } catch (err) {
      // 后端不可用时，使用本地离线项目以保证 UI 可展示
      setError("");
      setProject({
        id: "offline-demo",
        title: "我的灵感项目",
        brief: { ...DEFAULT_BRIEF },
        captures: [],
        document: { ...DEFAULT_DOCUMENT },
        styleGuide: { ...DEFAULT_STYLE_GUIDE },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initProject();
  }, [initProject]);

  const handleNewProject = async () => {
    const p = await api.createProject(`项目 ${new Date().toLocaleDateString("zh-CN")}`);
    setProject(p);
    setWorkspace("brief");
  };

  const handleGraphNavigate = (ws: KnowgoWorkspace, refId?: string) => {
    setGraphNavigation(ws, refId);
    setWorkspace(ws);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-kg-bg text-kg-muted">
        加载 Knowgo…
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-kg-bg">
        <p className="text-red-400">{error || "无法加载项目"}</p>
        <button
          type="button"
          onClick={initProject}
          className="rounded-lg bg-kg-accent px-4 py-2 text-sm text-kg-bg"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-kg-bg">
      <TopBar
        workspace={workspace}
        projectTitle={project.title}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        onNewProject={handleNewProject}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar workspace={workspace} onChange={setWorkspace} />
        <main className="flex min-w-0 flex-1 flex-col">
          {workspace === "brief" && (
            <BriefView project={project} onUpdate={setProject} />
          )}
          {workspace === "capture" && (
            <CaptureView project={project} onUpdate={setProject} />
          )}
          {workspace === "analyze" && (
            <AnalyzeView project={project} apiKey={apiKey} onUpdate={setProject} />
          )}
          {workspace === "document" && (
            <DocumentView project={project} onUpdate={setProject} />
          )}
          {workspace === "style" && (
            <StyleView project={project} onUpdate={setProject} />
          )}
          {workspace === "graph" && (
            <GraphView project={project} onNavigate={handleGraphNavigate} />
          )}
        </main>
      </div>

      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-red-950/90 px-4 py-2 text-xs text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}

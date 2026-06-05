import { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { AppsView } from "./views/AppsView";
import { BrainView } from "./views/BrainView";
import { HomeView } from "./views/HomeView";
import { ProjectsView } from "./views/ProjectsView";
import { SettingsView } from "./views/SettingsView";
import type { HubWorkspace } from "./types";

const TITLES: Record<HubWorkspace, { title: string; subtitle?: string }> = {
  home: { title: "欢迎回来", subtitle: "统筹你的 Creative OS" },
  apps: { title: "应用", subtitle: "Knowgo · Simcut · desound" },
  projects: { title: "项目", subtitle: "跨应用项目管理" },
  brain: { title: "主脑", subtitle: "Project Graph · Style Dataset" },
  settings: { title: "设置", subtitle: "连接与开发配置" },
};

export default function App() {
  const [workspace, setWorkspace] = useState<HubWorkspace>("home");
  const { title, subtitle } = TITLES[workspace];

  return (
    <div className="flex h-full overflow-hidden bg-ev-bg">
      <Sidebar workspace={workspace} onChange={setWorkspace} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex min-h-0 flex-1 flex-col">
          {workspace === "home" && <HomeView />}
          {workspace === "apps" && <AppsView />}
          {workspace === "projects" && <ProjectsView />}
          {workspace === "brain" && <BrainView />}
          {workspace === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

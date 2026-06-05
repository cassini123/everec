import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { DashboardView } from "./views/DashboardView";
import { TasksView } from "./views/TasksView";
import { TeamsView } from "./views/TeamsView";
import { FriendsView } from "./views/FriendsView";
import { ChatView } from "./views/ChatView";
import { SyncView } from "./views/SyncView";
import { RemindersView } from "./views/RemindersView";
import { api, getStoredUserId, setStoredUserId, type FriendRequestWithUser, type SyncSessionWithStats } from "./lib/api";
import type { PrerectorWorkspace } from "./types";
import type {
  DashboardStats,
  PrerectorProject,
  PrerectorTask,
  Reminder,
  Team,
  User,
} from "@everec/shared";

export default function App() {
  const [workspace, setWorkspace] = useState<PrerectorWorkspace>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestWithUser[]>([]);
  const [projects, setProjects] = useState<PrerectorProject[]>([]);
  const [tasks, setTasks] = useState<PrerectorTask[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [syncSessions, setSyncSessions] = useState<SyncSessionWithStats[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      if (!getStoredUserId()) setStoredUserId("user-me");
      const [me, dash, projs, taskList, teamList, syncList, reminderList, friendList, requests] =
        await Promise.all([
          api.getMe(),
          api.getDashboard(),
          api.listProjects(),
          api.listTasks(),
          api.listTeams(),
          api.listSync(),
          api.listReminders(),
          api.listFriends(),
          api.listFriendRequests(),
        ]);
      setCurrentUser(me);
      setStoredUserId(me.id);
      setStats(dash);
      setProjects(projs);
      setTasks(taskList);
      setTeams(teamList);
      setSyncSessions(syncList);
      setReminders(reminderList);
      setFriends(friendList);
      setFriendRequests(requests);
      if (!activeProjectId && projs[0]) setActiveProjectId(projs[0].id);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const due = await api.getDueReminders();
        if (due.length > 0 || workspace === "chat") await refresh();
      } catch {
        /* ignore */
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [refresh, workspace]);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-pr-bg">
      <TopBar workspace={workspace} projectName={activeProject?.name} userName={currentUser?.name} />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          workspace={workspace}
          onChange={setWorkspace}
          badges={{
            friends: friendRequests.length,
            chat: stats?.unreadChatCount ?? 0,
          }}
        />
        <main className="flex min-w-0 flex-1 flex-col">
          {workspace === "dashboard" && (
            <DashboardView stats={stats} projects={projects} loading={loading} />
          )}
          {workspace === "tasks" && (
            <TasksView
              projects={projects}
              tasks={tasks}
              teams={teams}
              activeProjectId={activeProjectId}
              onProjectChange={setActiveProjectId}
              onRefresh={refresh}
            />
          )}
          {workspace === "teams" && (
            <TeamsView teams={teams} friends={friends} onRefresh={refresh} />
          )}
          {workspace === "friends" && (
            <FriendsView friends={friends} requests={friendRequests} onRefresh={refresh} />
          )}
          {workspace === "chat" && <ChatView teams={teams} onRefresh={refresh} />}
          {workspace === "sync" && (
            <SyncView
              projects={projects}
              sessions={syncSessions}
              activeProjectId={activeProjectId}
              onRefresh={refresh}
            />
          )}
          {workspace === "reminders" && (
            <RemindersView projects={projects} reminders={reminders} onRefresh={refresh} />
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

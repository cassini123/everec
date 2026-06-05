import { useState } from "react";
import { Loader2, MessageCircle, RefreshCw, UserPlus, Users } from "lucide-react";
import type { MemberRole, Team, User } from "@everec/shared";
import { ROLE_LABELS, TEAM_KIND_LABELS, api } from "../lib/api";

interface TeamsViewProps {
  teams: Team[];
  friends: User[];
  onRefresh: () => Promise<void>;
}

const ROLE_OPTIONS = Object.keys(ROLE_LABELS) as MemberRole[];
const COLORS = ["#ff6b2c", "#4da3ff", "#a78bfa", "#3dd68c", "#ff9f43", "#ff6b6b"];

type MemberDraft = { name: string; role: MemberRole; color: string };

export function TeamsView({ teams, friends, onRefresh }: TeamsViewProps) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"production" | "homework">("homework");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [members, setMembers] = useState<MemberDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [rebalancing, setRebalancing] = useState<string | null>(null);

  function toggleFriend(id: string) {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }

  async function handleCreate() {
    if (!name.trim()) return;
    const valid = members.filter((m) => m.name.trim());
    if (valid.length === 0 && selectedFriends.length === 0) return;
    setLoading(true);
    try {
      await api.createTeam({
        name,
        kind,
        members: valid.length > 0 ? valid : undefined,
        friendUserIds: selectedFriends,
      });
      setName("");
      setSelectedFriends([]);
      setMembers([]);
      await onRefresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleRebalance(teamId: string) {
    setRebalancing(teamId);
    try {
      await api.rebalanceTeam(teamId);
      await onRefresh();
    } finally {
      setRebalancing(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-pr-text">协作人员小组</h1>
        <p className="mt-1 text-sm text-pr-muted">
          创建制作组或小组作业群，邀请好友加入并开启群聊
        </p>
      </div>

      <div className="mb-8 rounded-lg border border-pr-border bg-pr-panel p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-pr-text">
          <UserPlus className="h-4 w-4 text-pr-green" />
          创建小组
        </h2>
        <div className="mb-3 flex flex-wrap gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="小组名称，例如：第 3 组 · 机器学习大作业"
            className="min-w-[240px] flex-1 rounded-md border border-pr-border bg-pr-elevated px-3 py-2 text-sm text-pr-text"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="rounded border border-pr-border bg-pr-elevated px-3 py-2 text-sm text-pr-text"
          >
            <option value="homework">小组作业</option>
            <option value="production">制作组</option>
          </select>
        </div>

        {friends.length > 0 && (
          <div className="mb-3">
            <div className="mb-2 text-[11px] text-pr-muted">从好友邀请</div>
            <div className="flex flex-wrap gap-2">
              {friends.map((f) => {
                const selected = selectedFriends.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFriend(f.id)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      selected
                        ? "bg-pr-accent text-white"
                        : "border border-pr-border text-pr-muted hover:bg-pr-elevated"
                    }`}
                  >
                    {f.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <details className="mb-3">
          <summary className="cursor-pointer text-[11px] text-pr-muted">手动添加成员（可选）</summary>
          <div className="mt-2 space-y-2">
            {members.map((m, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input
                  value={m.name}
                  onChange={(e) => {
                    const next = [...members];
                    next[i] = { ...next[i], name: e.target.value };
                    setMembers(next);
                  }}
                  placeholder="成员姓名"
                  className="rounded border border-pr-border bg-pr-elevated px-2 py-1 text-sm text-pr-text"
                />
                <select
                  value={m.role}
                  onChange={(e) => {
                    const next = [...members];
                    next[i] = { ...next[i], role: e.target.value as MemberRole };
                    setMembers(next);
                  }}
                  className="rounded border border-pr-border bg-pr-elevated px-2 py-1 text-sm text-pr-text"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setMembers((prev) => [
                  ...prev,
                  { name: "", role: "other", color: COLORS[prev.length % COLORS.length] },
                ])
              }
              className="text-xs text-pr-muted hover:text-pr-text"
            >
              + 添加成员
            </button>
          </div>
        </details>

        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          className="rounded bg-pr-green px-4 py-2 text-sm font-medium text-pr-bg disabled:opacity-50"
        >
          {loading ? "创建中…" : "创建小组"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => (
          <div key={team.id} className="rounded-lg border border-pr-border bg-pr-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 font-medium text-pr-text">
                  <Users className="h-4 w-4 text-pr-accent" />
                  {team.name}
                </h3>
                <span className="text-[11px] text-pr-muted">
                  {TEAM_KIND_LABELS[team.kind ?? "production"]}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[11px] text-pr-muted">
                  <MessageCircle className="h-3 w-3" /> 群聊
                </span>
                <button
                  type="button"
                  onClick={() => handleRebalance(team.id)}
                  disabled={rebalancing === team.id}
                  className="flex items-center gap-1 rounded border border-pr-border px-2 py-1 text-[11px] text-pr-muted hover:bg-pr-elevated"
                >
                  {rebalancing === team.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  重新分配
                </button>
              </div>
            </div>
            <ul className="space-y-2">
              {team.members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-md bg-pr-elevated px-3 py-2"
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${m.color}33`, color: m.color }}
                  >
                    {m.name.slice(0, 1)}
                  </span>
                  <div>
                    <div className="text-sm text-pr-text">{m.name}</div>
                    <div className="text-[11px] text-pr-muted">
                      {ROLE_LABELS[m.role]}
                      {m.userId ? " · 已关联账号" : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

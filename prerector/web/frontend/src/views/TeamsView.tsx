import { useState } from "react";
import { Loader2, RefreshCw, UserPlus, Users } from "lucide-react";
import type { MemberRole, Team } from "@everec/shared";
import { ROLE_LABELS, api } from "../lib/api";

interface TeamsViewProps {
  teams: Team[];
  onRefresh: () => Promise<void>;
}

const ROLE_OPTIONS = Object.keys(ROLE_LABELS) as MemberRole[];

const COLORS = ["#ff6b2c", "#4da3ff", "#a78bfa", "#3dd68c", "#ff9f43", "#ff6b6b"];

type MemberDraft = { name: string; role: MemberRole; color: string };

export function TeamsView({ teams, onRefresh }: TeamsViewProps) {
  const [name, setName] = useState("");
  const [members, setMembers] = useState<MemberDraft[]>([
    { name: "", role: "editor", color: COLORS[0] },
  ]);
  const [loading, setLoading] = useState(false);
  const [rebalancing, setRebalancing] = useState<string | null>(null);

  function addMember() {
    setMembers((prev) => [
      ...prev,
      { name: "", role: "other", color: COLORS[prev.length % COLORS.length] },
    ]);
  }

  async function handleCreate() {
    if (!name.trim()) return;
    const valid = members.filter((m) => m.name.trim());
    if (valid.length === 0) return;
    setLoading(true);
    try {
      await api.createTeam(name, valid);
      setName("");
      setMembers([{ name: "", role: "editor", color: COLORS[0] }]);
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
          按角色自动分配任务，支持一键重新平衡工作量
        </p>
      </div>

      <div className="mb-8 rounded-lg border border-pr-border bg-pr-panel p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-pr-text">
          <UserPlus className="h-4 w-4 text-pr-green" />
          创建小组
        </h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="小组名称"
          className="mb-3 w-full max-w-md rounded-md border border-pr-border bg-pr-elevated px-3 py-2 text-sm text-pr-text"
        />
        <div className="space-y-2">
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
              <input
                type="color"
                value={m.color}
                onChange={(e) => {
                  const next = [...members];
                  next[i] = { ...next[i], color: e.target.value };
                  setMembers(next);
                }}
                className="h-8 w-10 cursor-pointer rounded border border-pr-border"
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={addMember}
            className="rounded border border-pr-border px-3 py-1.5 text-xs text-pr-muted hover:bg-pr-elevated"
          >
            + 添加成员
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="rounded bg-pr-green px-4 py-1.5 text-xs font-medium text-pr-bg disabled:opacity-50"
          >
            {loading ? "创建中…" : "创建小组"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => (
          <div key={team.id} className="rounded-lg border border-pr-border bg-pr-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-medium text-pr-text">
                <Users className="h-4 w-4 text-pr-accent" />
                {team.name}
              </h3>
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
                    <div className="text-[11px] text-pr-muted">{ROLE_LABELS[m.role]}</div>
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

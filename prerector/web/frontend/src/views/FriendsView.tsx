import { useState } from "react";
import { Check, Loader2, Search, UserPlus, Users, X } from "lucide-react";
import type { User } from "@everec/shared";
import { api, type FriendRequestWithUser } from "../lib/api";

interface FriendsViewProps {
  friends: User[];
  requests: FriendRequestWithUser[];
  onRefresh: () => Promise<void>;
}

function Avatar({ user, size = "md" }: { user: Pick<User, "name" | "avatarColor">; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-7 w-7 text-xs" : "h-10 w-10 text-sm";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-medium ${cls}`}
      style={{ backgroundColor: `${user.avatarColor}33`, color: user.avatarColor }}
    >
      {user.name.slice(0, 1)}
    </span>
  );
}

export function FriendsView({ friends, requests, onRefresh }: FriendsViewProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      setResults(await api.searchUsers(query.trim()));
    } catch (err) {
      setError(String(err));
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(user: User) {
    setActionId(user.id);
    try {
      await api.sendFriendRequest({ userId: user.id, message: "一起协作吧" });
      setResults((prev) => prev.filter((u) => u.id !== user.id));
      await onRefresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setActionId(null);
    }
  }

  async function handleAccept(id: string) {
    setActionId(id);
    try {
      await api.acceptFriendRequest(id);
      await onRefresh();
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id: string) {
    setActionId(id);
    try {
      await api.rejectFriendRequest(id);
      await onRefresh();
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-pr-text">
          <Users className="h-5 w-5 text-pr-green" />
          好友
        </h1>
        <p className="mt-1 text-sm text-pr-muted">
          添加协作者好友，邀请加入小组作业或制作组
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-pr-border bg-pr-panel p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-pr-text">
          <UserPlus className="h-4 w-4 text-pr-accent" />
          添加好友
        </h2>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="搜索用户名或 @handle"
            className="flex-1 rounded-md border border-pr-border bg-pr-elevated px-3 py-2 text-sm text-pr-text"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center gap-2 rounded-md bg-pr-accent px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            搜索
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-pr-red">{error}</p>}
        {results.length > 0 && (
          <ul className="mt-3 space-y-2">
            {results.map((u) => (
              <li key={u.id} className="flex items-center gap-3 rounded-md bg-pr-elevated px-3 py-2">
                <Avatar user={u} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-pr-text">{u.name}</div>
                  <div className="text-[11px] text-pr-muted">@{u.handle} · {u.bio}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdd(u)}
                  disabled={actionId === u.id}
                  className="rounded bg-pr-green px-3 py-1 text-xs text-pr-bg disabled:opacity-50"
                >
                  加好友
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {requests.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-pr-text">好友请求 ({requests.length})</h2>
          <ul className="space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-lg border border-pr-border bg-pr-panel px-4 py-3">
                <Avatar user={r.fromUser} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-pr-text">{r.fromUser.name}</div>
                  <div className="text-[11px] text-pr-muted">
                    @{r.fromUser.handle}
                    {r.message ? ` · ${r.message}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAccept(r.id)}
                  disabled={actionId === r.id}
                  className="flex items-center gap-1 rounded bg-pr-green px-3 py-1.5 text-xs text-pr-bg"
                >
                  <Check className="h-3 w-3" /> 接受
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(r.id)}
                  disabled={actionId === r.id}
                  className="flex items-center gap-1 rounded border border-pr-border px-3 py-1.5 text-xs text-pr-muted"
                >
                  <X className="h-3 w-3" /> 忽略
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium text-pr-text">我的好友 ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-sm text-pr-muted">暂无好友，搜索用户名添加</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-lg border border-pr-border bg-pr-panel p-3">
                <Avatar user={f} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-pr-text">{f.name}</div>
                  <div className="truncate text-[11px] text-pr-muted">@{f.handle}</div>
                  {f.bio && <div className="truncate text-[10px] text-pr-muted">{f.bio}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

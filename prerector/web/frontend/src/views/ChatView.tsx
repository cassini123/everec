import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import type { ChatMessage, Team } from "@everec/shared";
import { TEAM_KIND_LABELS, api, formatChatTime, getStoredUserId } from "../lib/api";

interface ChatViewProps {
  teams: Team[];
  onRefresh: () => Promise<void>;
}

export function ChatView({ teams, onRefresh }: ChatViewProps) {
  const [activeTeamId, setActiveTeamId] = useState(teams[0]?.id ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userId = getStoredUserId();

  const activeTeam = teams.find((t) => t.id === activeTeamId);

  useEffect(() => {
    if (teams[0] && !activeTeamId) setActiveTeamId(teams[0].id);
  }, [teams, activeTeamId]);

  useEffect(() => {
    if (!activeTeamId) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const msgs = await api.listChatMessages(activeTeamId);
        if (!cancelled) {
          setMessages(msgs);
          await api.markChatRead(activeTeamId);
          await onRefresh();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const poll = setInterval(async () => {
      try {
        const msgs = await api.listChatMessages(activeTeamId);
        setMessages(msgs);
      } catch {
        /* ignore */
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [activeTeamId, onRefresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !activeTeamId) return;
    setSending(true);
    try {
      const msg = await api.sendChatMessage(activeTeamId, input);
      setMessages((prev) => [...prev, msg]);
      setInput("");
    } finally {
      setSending(false);
    }
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-pr-muted">
        请先创建小组并邀请好友，即可开始群聊
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="flex w-56 shrink-0 flex-col border-r border-pr-border bg-pr-surface">
        <div className="border-b border-pr-border px-3 py-3 text-[10px] font-medium uppercase tracking-widest text-pr-muted">
          小组群聊
        </div>
        <nav className="flex-1 overflow-auto p-2">
          {teams.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => setActiveTeamId(team.id)}
              className={`mb-1 flex w-full flex-col rounded-md px-3 py-2 text-left ${
                activeTeamId === team.id ? "bg-pr-elevated ring-1 ring-pr-accent/40" : "hover:bg-pr-panel"
              }`}
            >
              <span className="truncate text-sm text-pr-text">{team.name}</span>
              <span className="text-[10px] text-pr-muted">
                {TEAM_KIND_LABELS[team.kind ?? "production"]} · {team.members.length} 人
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-pr-border px-4 py-3">
          <MessageCircle className="h-4 w-4 text-pr-accent" />
          <div>
            <div className="text-sm font-medium text-pr-text">{activeTeam?.name}</div>
            <div className="text-[11px] text-pr-muted">
              {activeTeam?.members.map((m) => m.name).join("、")}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 py-3">
          {loading ? (
            <div className="flex h-full items-center justify-center text-pr-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMe = msg.senderId === userId;
                const isSystem = msg.senderId === "system";
                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center text-[11px] text-pr-muted">
                      {msg.content} · {formatChatTime(msg.createdAt)}
                    </div>
                  );
                }
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 ${
                        isMe ? "bg-pr-accent text-white" : "bg-pr-panel text-pr-text"
                      }`}
                    >
                      {!isMe && (
                        <div className="mb-0.5 text-[10px] opacity-70">{msg.senderName}</div>
                      )}
                      <div className="text-sm">{msg.content}</div>
                      <div className={`mt-1 text-[10px] ${isMe ? "text-white/60" : "text-pr-muted"}`}>
                        {formatChatTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-pr-border p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={`在「${activeTeam?.name}」发消息…`}
            className="flex-1 rounded-md border border-pr-border bg-pr-elevated px-3 py-2 text-sm text-pr-text"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="flex items-center gap-2 rounded-md bg-pr-accent px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

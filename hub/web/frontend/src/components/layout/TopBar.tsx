import { Bell, Search, User } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-ev-border bg-ev-surface/80 px-6 backdrop-blur-sm">
      <div>
        <h1 className="font-display text-base font-semibold">{title}</h1>
        {subtitle && (
          <p className="text-xs text-ev-muted">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-ev-border bg-ev-panel px-3 py-1.5">
          <Search size={14} className="text-ev-muted" />
          <input
            type="text"
            placeholder="搜索项目、灵感、风格…"
            className="w-48 bg-transparent text-sm outline-none placeholder:text-ev-muted/60"
          />
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-ev-muted transition-colors hover:bg-ev-panel hover:text-ev-text"
          aria-label="通知"
        >
          <Bell size={18} />
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-ev-border bg-ev-panel px-3 py-1.5 text-sm text-ev-muted transition-colors hover:text-ev-text"
        >
          <User size={16} />
          <span>创作者</span>
        </button>
      </div>
    </header>
  );
}

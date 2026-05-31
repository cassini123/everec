import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Download,
  FileAudio,
  FolderPlus,
  Search,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import { api } from "../lib/api";
import type { SoundAsset } from "../types";

interface LibraryViewProps {
  sounds: SoundAsset[];
  onRefresh: () => void;
  onExport?: () => void;
}

const categories = ["all", "imported", "foley", "music"] as const;

export function LibraryView({ sounds, onRefresh, onExport }: LibraryViewProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("all");
  const [selected, setSelected] = useState<SoundAsset | null>(null);
  const [importing, setImporting] = useState(false);

  const filtered = sounds.filter((s) => {
    const matchCat = category === "all" || s.category === category;
    const matchQuery =
      !query ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
    return matchCat && matchQuery;
  });

  const handleImport = async () => {
    const path = await open({
      multiple: false,
      filters: [
        {
          name: "Audio",
          extensions: ["wav", "mp3", "flac", "aac", "ogg", "m4a"],
        },
      ],
    });
    if (!path || typeof path !== "string") return;

    setImporting(true);
    try {
      await api.importSound(path);
      await onRefresh();
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.deleteSound(id);
    if (selected?.id === id) setSelected(null);
    await onRefresh();
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-ds-border bg-ds-panel px-4 py-3">
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="flex items-center gap-2 rounded-md bg-ds-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-ds-accent-dim disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {importing ? "导入中…" : "导入音频"}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-ds-border px-3 py-2 text-sm text-ds-muted transition hover:border-ds-accent hover:text-ds-text"
          >
            <FolderPlus className="h-4 w-4" />
            新建文件夹
          </button>
          <div className="relative ml-auto flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索素材…"
              className="w-full rounded-md border border-ds-border bg-ds-bg py-2 pl-9 pr-3 text-sm outline-none focus:border-ds-accent"
            />
          </div>
        </div>

        <div className="flex gap-1 border-b border-ds-border px-4 py-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded px-3 py-1 text-xs capitalize transition ${
                category === cat
                  ? "bg-ds-accent/20 text-ds-accent"
                  : "text-ds-muted hover:text-ds-text"
              }`}
            >
              {cat === "all" ? "全部" : cat}
            </button>
          ))}
        </div>

        <div className="grid-bg flex-1 overflow-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-ds-muted">
              <FileAudio className="h-12 w-12 opacity-30" />
              <p className="text-sm">暂无素材 — 点击「导入音频」开始</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
              {filtered.map((sound) => (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => setSelected(sound)}
                  className={`group rounded-lg border p-3 text-left transition ${
                    selected?.id === sound.id
                      ? "border-ds-accent bg-ds-elevated"
                      : "border-ds-border bg-ds-panel hover:border-ds-muted"
                  }`}
                >
                  <div className="mb-3 flex h-16 items-end justify-center gap-0.5 rounded bg-ds-bg px-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-sm bg-ds-accent/60"
                        style={{
                          height: `${20 + Math.sin(i * 0.8 + sound.name.length) * 30 + 20}%`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="truncate text-sm font-medium">{sound.name}</div>
                  <div className="mt-0.5 text-[11px] uppercase text-ds-muted">
                    {sound.format}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <aside className="w-72 shrink-0 border-l border-ds-border bg-ds-surface">
          <div className="border-b border-ds-border px-4 py-3 text-xs font-medium uppercase tracking-wider text-ds-muted">
            Inspector
          </div>
          <div className="space-y-4 p-4">
            <div>
              <div className="text-lg font-semibold">{selected.name}</div>
              <div className="text-xs text-ds-muted">{selected.fileName}</div>
            </div>

            <div className="flex h-20 items-end justify-center gap-1 rounded bg-ds-panel px-2">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="waveform-bar w-1 origin-bottom rounded-sm bg-ds-blue/70"
                  style={{
                    height: `${30 + Math.random() * 60}%`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ds-muted">格式</span>
                <span>{selected.format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ds-muted">来源</span>
                <span>{selected.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ds-muted">分类</span>
                <span>{selected.category}</span>
              </div>
            </div>

            {selected.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selected.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded bg-ds-elevated px-2 py-0.5 text-[11px] text-ds-muted"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onExport}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-ds-border py-2 text-xs text-ds-muted hover:text-ds-text"
              >
                <Download className="h-3.5 w-3.5" />
                导出
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selected.id)}
                className="flex items-center justify-center gap-1.5 rounded-md border border-red-900/50 px-3 py-2 text-xs text-red-400 hover:bg-red-950/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

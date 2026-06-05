import { useCallback, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Download,
  FileAudio,
  Globe,
  Link2,
  Loader2,
  Music,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import { api } from "../lib/api";
import {
  parseMediaUrl,
  saveLinkToLibrary,
  saveSearchResultToLibrary,
  searchMusicOnline,
} from "../lib/musicFetch";
import type { LinkParseResult, MusicSearchResult, SoundAsset } from "../types";

interface LibraryViewProps {
  sounds: SoundAsset[];
  onRefresh: () => void;
  onExport?: () => void;
}

type LibraryTab = "library" | "search" | "link";
type Category = "all" | "imported" | "foley" | "music";

const categories: Category[] = ["all", "imported", "foley", "music"];

const categoryLabels: Record<Category, string> = {
  all: "全部",
  imported: "导入",
  foley: "拟音",
  music: "音乐",
};

const platformLabels: Record<string, string> = {
  bilibili: "Bilibili",
  douyin: "抖音",
  xiaohongshu: "小红书",
  itunes: "iTunes",
  netease: "网易云",
};

function formatDuration(ms: number): string {
  if (!ms) return "--:--";
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDurationSec(sec: number): string {
  if (!sec) return "--:--";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function LibraryView({ sounds, onRefresh, onExport }: LibraryViewProps) {
  const [tab, setTab] = useState<LibraryTab>("library");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [selected, setSelected] = useState<SoundAsset | null>(null);
  const [importing, setImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Online search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MusicSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Link parse state
  const [linkUrl, setLinkUrl] = useState("");
  const [linkResult, setLinkResult] = useState<LinkParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [linkSaving, setLinkSaving] = useState(false);

  const filtered = sounds.filter((s) => {
    const matchCat = category === "all" || s.category === category;
    const matchQuery =
      !query ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
    return matchCat && matchQuery;
  });

  const handleUploadBgm = async () => {
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
    setStatusMsg("");
    try {
      await api.importSound(path, undefined, ["bgm", "upload"], "music");
      await onRefresh();
      setStatusMsg("BGM 上传成功");
    } catch (err) {
      setStatusMsg(String(err));
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.deleteSound(id);
    if (selected?.id === id) setSelected(null);
    await onRefresh();
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setStatusMsg("");
    setSearchResults([]);
    try {
      const results = await searchMusicOnline(searchQuery.trim(), 20);
      setSearchResults(results);
      if (results.length === 0) setStatusMsg("未找到相关歌曲");
    } catch (err) {
      setStatusMsg(String(err));
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleSaveSearchResult = async (result: MusicSearchResult) => {
    setSavingId(result.id);
    setStatusMsg("");
    try {
      await saveSearchResultToLibrary(result);
      await onRefresh();
      setStatusMsg(`已保存: ${result.title}`);
    } catch (err) {
      setStatusMsg(String(err));
    } finally {
      setSavingId(null);
    }
  };

  const handleParseLink = async () => {
    if (!linkUrl.trim()) return;
    setParsing(true);
    setStatusMsg("");
    setLinkResult(null);
    try {
      const result = await parseMediaUrl(linkUrl.trim());
      setLinkResult(result);
    } catch (err) {
      setStatusMsg(String(err));
    } finally {
      setParsing(false);
    }
  };

  const handleSaveLink = async () => {
    if (!linkResult) return;
    setLinkSaving(true);
    setStatusMsg("");
    try {
      await saveLinkToLibrary(linkResult);
      await onRefresh();
      setStatusMsg(`已保存 BGM: ${linkResult.title}`);
      setLinkResult(null);
      setLinkUrl("");
    } catch (err) {
      setStatusMsg(String(err));
    } finally {
      setLinkSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-ds-border bg-ds-panel px-4 py-3">
          <button
            type="button"
            onClick={handleUploadBgm}
            disabled={importing}
            className="flex items-center gap-2 rounded-md bg-ds-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-ds-accent-dim disabled:opacity-50"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {importing ? "上传中…" : "上传 BGM"}
          </button>

          <div className="flex rounded-md border border-ds-border p-0.5">
            {(
              [
                { id: "library" as const, label: "我的素材", icon: FileAudio },
                { id: "search" as const, label: "联网搜索", icon: Globe },
                { id: "link" as const, label: "解析链接", icon: Link2 },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTab(id);
                  setStatusMsg("");
                }}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs transition ${
                  tab === id
                    ? "bg-ds-accent/20 text-ds-accent"
                    : "text-ds-muted hover:text-ds-text"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {tab === "library" && (
            <div className="relative ml-auto flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索素材…"
                className="w-full rounded-md border border-ds-border bg-ds-bg py-2 pl-9 pr-3 text-sm outline-none focus:border-ds-accent"
              />
            </div>
          )}
        </div>

        {statusMsg && (
          <div className="border-b border-ds-border bg-ds-elevated px-4 py-2 text-xs text-ds-muted">
            {statusMsg}
          </div>
        )}

        {/* Tab: My Library */}
        {tab === "library" && (
          <>
            <div className="flex gap-1 border-b border-ds-border px-4 py-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded px-3 py-1 text-xs transition ${
                    category === cat
                      ? "bg-ds-accent/20 text-ds-accent"
                      : "text-ds-muted hover:text-ds-text"
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>

            <div className="grid-bg flex-1 overflow-auto p-4">
              {filtered.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-ds-muted">
                  <FileAudio className="h-12 w-12 opacity-30" />
                  <p className="text-sm">暂无素材 — 上传 BGM 或联网搜索添加</p>
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
                      <div className="mt-0.5 flex items-center justify-between text-[11px] uppercase text-ds-muted">
                        <span>{sound.format}</span>
                        {sound.category === "music" && (
                          <Music className="h-3 w-3 text-ds-purple" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab: Online Search */}
        {tab === "search" && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex gap-2 border-b border-ds-border px-4 py-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-muted" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="搜索歌曲名称、歌手…"
                  className="w-full rounded-md border border-ds-border bg-ds-bg py-2 pl-9 pr-3 text-sm outline-none focus:border-ds-accent"
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="flex items-center gap-2 rounded-md bg-ds-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-ds-accent-dim disabled:opacity-50"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                搜索
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {searchResults.length === 0 && !searching ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-ds-muted">
                  <Globe className="h-12 w-12 opacity-30" />
                  <p className="text-sm">输入关键词搜索歌曲，保存至素材库</p>
                  <p className="text-xs opacity-60">支持网易云音乐、iTunes 曲库</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center gap-3 rounded-lg border border-ds-border bg-ds-panel p-3"
                    >
                      {result.coverUrl ? (
                        <img
                          src={result.coverUrl}
                          alt=""
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded bg-ds-bg">
                          <Music className="h-5 w-5 text-ds-muted" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{result.title}</div>
                        <div className="truncate text-xs text-ds-muted">
                          {result.artist}
                          {result.album ? ` · ${result.album}` : ""}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ds-muted">
                          <span>{platformLabels[result.source] ?? result.source}</span>
                          <span>{formatDuration(result.durationMs)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveSearchResult(result)}
                        disabled={savingId === result.id}
                        className="flex shrink-0 items-center gap-1.5 rounded-md border border-ds-accent/50 px-3 py-1.5 text-xs text-ds-accent transition hover:bg-ds-accent/10 disabled:opacity-50"
                      >
                        {savingId === result.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        保存
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Link Parse */}
        {tab === "link" && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-ds-border px-4 py-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-muted" />
                  <input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleParseLink()}
                    placeholder="粘贴 Bilibili / 抖音 / 小红书链接…"
                    className="w-full rounded-md border border-ds-border bg-ds-bg py-2 pl-9 pr-3 text-sm outline-none focus:border-ds-accent"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleParseLink}
                  disabled={parsing || !linkUrl.trim()}
                  className="flex items-center gap-2 rounded-md bg-ds-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-ds-accent-dim disabled:opacity-50"
                >
                  {parsing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  解析
                </button>
              </div>
              <p className="mt-2 text-[11px] text-ds-muted">
                支持 bilibili.com · douyin.com · xiaohongshu.com / xhslink.com
              </p>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {!linkResult ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-ds-muted">
                  <Link2 className="h-12 w-12 opacity-30" />
                  <p className="text-sm">粘贴视频链接，提取 BGM 保存至素材库</p>
                </div>
              ) : (
                <div className="mx-auto max-w-lg rounded-lg border border-ds-border bg-ds-panel p-5">
                  <div className="flex gap-4">
                    {linkResult.coverUrl ? (
                      <img
                        src={linkResult.coverUrl}
                        alt=""
                        className="h-24 w-24 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded bg-ds-bg">
                        <Music className="h-8 w-8 text-ds-muted" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-semibold">{linkResult.title}</div>
                      {linkResult.author && (
                        <div className="mt-1 text-sm text-ds-muted">{linkResult.author}</div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded bg-ds-accent/20 px-2 py-0.5 text-ds-accent">
                          {platformLabels[linkResult.platform] ?? linkResult.platform}
                        </span>
                        <span className="rounded bg-ds-elevated px-2 py-0.5 text-ds-muted">
                          {formatDurationSec(linkResult.durationSec)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveLink}
                      disabled={linkSaving}
                      className="flex flex-1 items-center justify-center gap-2 rounded-md bg-ds-accent py-2.5 text-sm font-medium text-white transition hover:bg-ds-accent-dim disabled:opacity-50"
                    >
                      {linkSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {linkSaving ? "下载保存中…" : "下载 BGM 至素材库"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selected && tab === "library" && (
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
                <span>{categoryLabels[selected.category as Category] ?? selected.category}</span>
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

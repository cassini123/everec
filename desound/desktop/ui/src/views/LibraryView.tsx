import { useCallback, useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  CheckCircle2,
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
  XCircle,
} from "lucide-react";
import { api } from "../lib/api";
import { DESKTOP_APP_HINT } from "../lib/tauri";
import {
  parseMediaUrl,
  saveLinkToLibrary,
  saveSearchResultToLibrary,
  searchMusicOnline,
} from "../lib/musicFetch";
import { formatResultLabel } from "@everec/shared";
import { ProjectPicker } from "../components/layout/ProjectPicker";
import type {
  DesoundProjectSummary,
  LinkParseResult,
  MusicSearchResult,
  SoundAsset,
} from "../types";

interface LibraryViewProps {
  sounds: SoundAsset[];
  projects: DesoundProjectSummary[];
  activeProjectId: string | null;
  onProjectSelect: (id: string) => void;
  onGoToProjects?: () => void;
  onRefresh: () => void;
  onExport?: () => void;
}

type MusicSubTab = "grid" | "search" | "link";
type Category = "all" | "imported" | "foley" | "music";
type Toast = { type: "success" | "error"; message: string };

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

export function LibraryView({
  sounds,
  projects,
  activeProjectId,
  onProjectSelect,
  onGoToProjects,
  onRefresh,
  onExport,
}: LibraryViewProps) {
  const [musicSubTab, setMusicSubTab] = useState<MusicSubTab>("grid");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [selected, setSelected] = useState<SoundAsset | null>(null);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((type: Toast["type"], message: string) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const showSaveSuccess = useCallback(
    (name: string) => {
      setCategory("music");
      setMusicSubTab("grid");
      showToast("success", `保存成功：${name} 已添加到素材库`);
    },
    [showToast],
  );

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
    if (!api.isDesktop()) {
      showToast("error", DESKTOP_APP_HINT);
      return;
    }
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
      const asset = await api.importSound(path, undefined, ["bgm", "upload"], "music");
      await onRefresh();
      showSaveSuccess(asset.name);
    } catch (err) {
      showToast("error", String(err));
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
    setSearchResults([]);
    try {
      const results = await searchMusicOnline(searchQuery.trim(), 20);
      setSearchResults(results);
      if (results.length === 0) showToast("error", "未找到相关歌曲");
    } catch (err) {
      showToast("error", String(err));
    } finally {
      setSearching(false);
    }
  }, [searchQuery, showToast]);

  const handleSaveSearchResult = async (result: MusicSearchResult) => {
    setSavingId(result.id);
    try {
      const asset = await saveSearchResultToLibrary(result);
      await onRefresh();
      showSaveSuccess(asset.name);
    } catch (err) {
      showToast("error", String(err));
    } finally {
      setSavingId(null);
    }
  };

  const handleParseLink = async () => {
    if (!linkUrl.trim()) return;
    setParsing(true);
    setLinkResult(null);
    try {
      const result = await parseMediaUrl(linkUrl.trim());
      setLinkResult(result);
    } catch (err) {
      showToast("error", String(err));
    } finally {
      setParsing(false);
    }
  };

  const handleSaveLink = async () => {
    if (!linkResult) return;
    setLinkSaving(true);
    try {
      const asset = await saveLinkToLibrary(linkResult);
      await onRefresh();
      showSaveSuccess(asset.name);
      setLinkResult(null);
      setLinkUrl("");
    } catch (err) {
      showToast("error", String(err));
    } finally {
      setLinkSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-ds-border bg-ds-panel px-4 py-3">
          <ProjectPicker
            projects={projects}
            activeProjectId={activeProjectId}
            onSelect={onProjectSelect}
            onManage={onGoToProjects}
          />
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
            {importing ? "上传中…" : "上传"}
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

        {toast && (
          <div
            className={`flex items-center gap-2 border-b px-4 py-2.5 text-sm ${
              toast.type === "success"
                ? "border-ds-green/30 bg-ds-green/10 text-ds-green"
                : "border-red-900/30 bg-red-950/40 text-red-300"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            {toast.message}
          </div>
        )}

        <div className="flex gap-1 border-b border-ds-border px-4 py-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategory(cat);
                if (cat === "music") setMusicSubTab("grid");
              }}
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

        {category === "music" && (
          <div className="flex gap-1 border-b border-ds-border px-4 py-2">
            {(
              [
                { id: "grid" as const, label: "素材", icon: FileAudio },
                { id: "search" as const, label: "联网搜索", icon: Globe },
                { id: "link" as const, label: "解析链接", icon: Link2 },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMusicSubTab(id)}
                className={`flex items-center gap-1.5 rounded px-3 py-1 text-xs transition ${
                  musicSubTab === id
                    ? "bg-ds-purple/20 text-ds-purple"
                    : "text-ds-muted hover:text-ds-text"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}

        {(category !== "music" || musicSubTab === "grid") && (
          <>
            <div className="grid-bg flex-1 overflow-auto p-4">
              {filtered.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-ds-muted">
                  <FileAudio className="h-12 w-12 opacity-30" />
                  <p className="text-sm">暂无素材 — 上传或联网搜索添加</p>
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
        {category === "music" && musicSubTab === "search" && (
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
            <p className="px-4 pb-2 text-[11px] text-ds-muted">
              仅 iTunes 曲库，展示专辑封面与曲目信息
            </p>

            <div className="flex-1 overflow-auto p-4">
              {searchResults.length === 0 && !searching ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-ds-muted">
                  <Globe className="h-12 w-12 opacity-30" />
                  <p className="text-sm">输入关键词搜索歌曲，保存至素材库</p>
                  <p className="text-xs opacity-60">支持歌名、歌手或「歌手 歌名」</p>
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
                          alt={result.album}
                          className="h-14 w-14 shrink-0 rounded-md object-cover shadow-sm"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-ds-bg">
                          <Music className="h-5 w-5 text-ds-muted" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ds-text/90">
                          {result.album}
                        </div>
                        <div className="truncate text-xs text-ds-muted">
                          {formatResultLabel(result.title, result.artist)}
                          <span> · {formatDuration(result.durationMs)}</span>
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
        {category === "music" && musicSubTab === "link" && (
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

      {selected && (category !== "music" || musicSubTab === "grid") && (
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

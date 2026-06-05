import { useMemo, useRef, useState } from "react";
import { Loader2, Play, Plus, RotateCcw, Save, Search, Upload, Volume2 } from "lucide-react";
import { api } from "../lib/api";
import { FOLEY_PRESETS, synthesizeFoley } from "../lib/foley";
import { ProjectPicker } from "../components/layout/ProjectPicker";
import type {
  DesoundProjectSummary,
  FoleyPreset,
  SfxSearchResult,
  SoundAsset,
} from "../types";

interface FoleyViewProps {
  sounds: SoundAsset[];
  projects: DesoundProjectSummary[];
  activeProjectId: string | null;
  onProjectSelect: (id: string) => void;
  onGoToProjects?: () => void;
  onSaved: () => void;
}

export function FoleyView({
  sounds,
  projects,
  activeProjectId,
  onProjectSelect,
  onGoToProjects,
  onSaved,
}: FoleyViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const [preset, setPreset] = useState<FoleyPreset>(FOLEY_PRESETS[0]);
  const [params, setParams] = useState<Record<string, number>>(() =>
    Object.fromEntries(preset.params.map((p) => [p.id, p.default])),
  );
  const [name, setName] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingAsset, setEditingAsset] = useState<SoundAsset | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  const [sfxQuery, setSfxQuery] = useState("");
  const [sfxResults, setSfxResults] = useState<SfxSearchResult[]>([]);
  const [sfxSearching, setSfxSearching] = useState(false);
  const [sfxSavingId, setSfxSavingId] = useState<string | null>(null);
  const [sfxPreviewId, setSfxPreviewId] = useState<string | null>(null);

  const foleyHistory = useMemo(
    () => sounds.filter((s) => s.category === "foley").slice(-8).reverse(),
    [sounds],
  );

  const selectPreset = (next: FoleyPreset) => {
    setPreset(next);
    setParams(Object.fromEntries(next.params.map((p) => [p.id, p.default])));
    setName(`${next.nameZh}_${Date.now().toString(36).slice(-4)}`);
    setEditingAsset(null);
  };

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  };

  const handlePreview = async () => {
    setPreviewing(true);
    const ctx = getCtx();
    const source = synthesizeFoley(ctx, preset.id, params);
    source.connect(ctx.destination);
    source.start();
    source.onended = () => setPreviewing(false);
  };

  const handleReset = () => {
    setParams(Object.fromEntries(preset.params.map((p) => [p.id, p.default])));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveFoleySound(
        name || `${preset.nameZh}_design`,
        preset.id,
        [preset.category, ...Object.keys(params)],
      );
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async () => {
    if (api.isDesktop()) {
      setImporting(true);
      try {
        const asset = await api.uploadFoleyFile();
        setEditingAsset(asset);
        setName(asset.name);
        await onSaved();
      } catch (err) {
        alert(String(err));
      } finally {
        setImporting(false);
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const asset = await api.uploadFoleyFile(file);
      setEditingAsset(asset);
      setName(asset.name);
      await onSaved();
    } catch (err) {
      alert(String(err));
    } finally {
      setImporting(false);
    }
  };

  const handleSfxSearch = async () => {
    if (!sfxQuery.trim()) return;
    setSfxSearching(true);
    setSfxResults([]);
    try {
      setSfxResults(await api.searchSfxOnline(sfxQuery.trim(), 12));
    } catch (err) {
      alert(String(err));
    } finally {
      setSfxSearching(false);
    }
  };

  const previewSfx = (item: SfxSearchResult) => {
    const audio = previewAudioRef.current;
    if (!audio) return;
    if (sfxPreviewId === item.id && !audio.paused) {
      audio.pause();
      setSfxPreviewId(null);
      return;
    }
    audio.src = item.previewUrl;
    audio.play().catch(() => alert("预览失败"));
    setSfxPreviewId(item.id);
  };

  const saveSfx = async (item: SfxSearchResult) => {
    setSfxSavingId(item.id);
    try {
      const asset = await api.saveSfxResult(item);
      setEditingAsset(asset);
      setName(asset.name);
      await onSaved();
    } catch (err) {
      alert(String(err));
    } finally {
      setSfxSavingId(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center border-b border-ds-border bg-ds-panel px-4 py-2">
        <ProjectPicker
          projects={projects}
          activeProjectId={activeProjectId}
          onSelect={onProjectSelect}
          onManage={onGoToProjects}
        />
      </div>

      <div className="flex min-h-0 flex-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a"
        className="hidden"
        onChange={handleFileChange}
      />
      <audio ref={previewAudioRef} onEnded={() => setSfxPreviewId(null)} className="hidden" />

      <div className="flex w-60 shrink-0 flex-col border-r border-ds-border bg-ds-surface">
        <div className="flex items-center justify-between border-b border-ds-border px-3 py-2">
          <span className="text-[10px] font-medium uppercase tracking-widest text-ds-muted">拟声预设</span>
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            title="导入素材编辑"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-ds-border text-ds-muted transition hover:border-ds-accent hover:text-ds-accent disabled:opacity-50"
          >
            {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-auto p-2">
          {FOLEY_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPreset(p)}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left transition ${
                preset.id === p.id && !editingAsset
                  ? "bg-ds-elevated ring-1 ring-ds-green/40"
                  : "hover:bg-ds-panel"
              }`}
            >
              <span className="text-lg">{p.icon}</span>
              <div>
                <div className="text-sm font-medium">{p.nameZh}</div>
                <div className="text-[11px] text-ds-muted">{p.name}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-ds-border p-2">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-widest text-ds-muted">
            搜索互联网音效
          </div>
          <div className="flex gap-1">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ds-muted" />
              <input
                value={sfxQuery}
                onChange={(e) => setSfxQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSfxSearch()}
                placeholder="树木莎莎、点赞…"
                className="w-full rounded border border-ds-border bg-ds-bg py-1.5 pl-7 pr-2 text-xs outline-none focus:border-ds-accent"
              />
            </div>
            <button
              type="button"
              onClick={handleSfxSearch}
              disabled={sfxSearching || !sfxQuery.trim()}
              className="rounded border border-ds-border px-2 text-xs text-ds-muted hover:text-ds-text disabled:opacity-50"
            >
              {sfxSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "搜"}
            </button>
          </div>
          <div className="mt-2 max-h-40 space-y-1 overflow-auto">
            {sfxResults.map((item) => (
              <div key={item.id} className="rounded bg-ds-panel px-2 py-1.5">
                <div className="truncate text-[11px] font-medium">{item.title}</div>
                <div className="mt-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => previewSfx(item)}
                    className="rounded px-1.5 py-0.5 text-[10px] text-ds-muted hover:text-ds-text"
                  >
                    试听
                  </button>
                  <button
                    type="button"
                    onClick={() => saveSfx(item)}
                    disabled={sfxSavingId === item.id}
                    className="rounded px-1.5 py-0.5 text-[10px] text-ds-accent hover:bg-ds-accent/10 disabled:opacity-50"
                  >
                    {sfxSavingId === item.id ? "…" : "添加"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-ds-border bg-ds-panel px-4 py-3">
          <span className="text-2xl">{editingAsset ? "📁" : preset.icon}</span>
          <div>
            <h2 className="text-lg font-semibold">
              {editingAsset ? editingAsset.name : preset.nameZh}
            </h2>
            <p className="text-xs text-ds-muted">
              {editingAsset
                ? "已导入素材 · 可重命名后保存"
                : `${preset.name} · ${preset.category}`}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            {!editingAsset && (
              <>
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={previewing}
                  className="flex items-center gap-2 rounded-md bg-ds-green/20 px-4 py-2 text-sm text-ds-green transition hover:bg-ds-green/30 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" fill="currentColor" />
                  {previewing ? "播放中…" : "预览"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-md border border-ds-border px-3 py-2 text-sm text-ds-muted hover:text-ds-text"
                >
                  <RotateCcw className="h-4 w-4" />
                  重置
                </button>
              </>
            )}
            {editingAsset && (
              <button
                type="button"
                onClick={() => {
                  const audio = previewAudioRef.current;
                  if (audio && editingAsset.audioUrl) {
                    audio.src = editingAsset.audioUrl;
                    audio.play().catch(() => undefined);
                  }
                }}
                className="flex items-center gap-2 rounded-md border border-ds-border px-3 py-2 text-sm"
              >
                <Play className="h-4 w-4" />
                播放素材
              </button>
            )}
          </div>
        </div>

        <div className="grid-bg flex flex-1 gap-6 overflow-auto p-6">
          {!editingAsset ? (
            <div className="grid flex-1 grid-cols-2 gap-4 lg:grid-cols-3">
              {preset.params.map((param) => (
                <div key={param.id} className="rounded-lg border border-ds-border bg-ds-panel p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium">{param.label}</span>
                    <span className="font-mono text-xs text-ds-accent">
                      {(params[param.id] ?? param.default).toFixed(2)}
                      {param.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={params[param.id] ?? param.default}
                    onChange={(e) =>
                      setParams((prev) => ({ ...prev, [param.id]: Number(e.target.value) }))
                    }
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-ds-muted">
              <Upload className="h-12 w-12 opacity-40" />
              <p className="text-sm">导入的拟音素材已加载，可在右侧保存或继续搜索添加</p>
            </div>
          )}

          <div className="flex w-64 shrink-0 flex-col gap-4">
            <div className="rounded-lg border border-ds-border bg-ds-panel p-4">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-ds-muted">
                <Volume2 className="h-3.5 w-3.5" />
                波形预览
              </div>
              <div className="flex h-24 items-end justify-center gap-0.5">
                {Array.from({ length: 32 }).map((_, i) => {
                  const v = Object.values(params)[i % Object.values(params).length] ?? 0.5;
                  return (
                    <div
                      key={i}
                      className="w-1 rounded-sm bg-ds-green/60"
                      style={{ height: `${20 + v * 60 + Math.sin(i * 0.5) * 15}%` }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-ds-border bg-ds-panel p-4">
              <label className="mb-2 block text-xs text-ds-muted">保存名称</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${preset.nameZh}_design`}
                className="mb-3 w-full rounded border border-ds-border bg-ds-bg px-3 py-2 text-sm outline-none focus:border-ds-accent"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !!editingAsset}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-ds-accent py-2.5 text-sm font-medium text-white transition hover:bg-ds-accent-dim disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "保存中…" : "保存到素材库"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {foleyHistory.length > 0 && (
        <aside className="w-52 shrink-0 border-l border-ds-border bg-ds-surface">
          <div className="border-b border-ds-border px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-ds-muted">
            最近保存
          </div>
          <div className="space-y-1 p-2">
            {foleyHistory.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setEditingAsset(s);
                  setName(s.name);
                }}
                className="w-full rounded-md bg-ds-panel px-3 py-2 text-left text-sm hover:ring-1 hover:ring-ds-accent/30"
              >
                <div className="truncate font-medium">{s.name}</div>
                <div className="text-[11px] text-ds-muted">{s.createdAt}</div>
              </button>
            ))}
          </div>
        </aside>
      )}
      </div>
    </div>
  );
}

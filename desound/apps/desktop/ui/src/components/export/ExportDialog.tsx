import { save } from "@tauri-apps/plugin-dialog";
import { Download, X } from "lucide-react";
import { useState } from "react";
import { api } from "../../lib/api";
import type { ExportFormat, SoundAsset } from "../../types";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  sounds: SoundAsset[];
  defaultSoundId?: string;
}

const FORMATS: { id: ExportFormat; label: string; ext: string }[] = [
  { id: "wav", label: "WAV", ext: "wav" },
  { id: "mp3", label: "MP3", ext: "mp3" },
  { id: "flac", label: "FLAC", ext: "flac" },
  { id: "aac", label: "AAC", ext: "aac" },
];

export function ExportDialog({
  open,
  onClose,
  sounds,
  defaultSoundId,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("wav");
  const [soundId, setSoundId] = useState(defaultSoundId ?? sounds[0]?.id ?? "");
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  if (!open) return null;

  const selected = sounds.find((s) => s.id === soundId);
  const fmt = FORMATS.find((f) => f.id === format)!;

  const handleExport = async () => {
    if (!soundId) {
      setMessage("请先选择要导出的素材");
      return;
    }
    const dest = await save({
      defaultPath: `${selected?.name ?? "export"}.${fmt.ext}`,
      filters: [{ name: fmt.label, extensions: [fmt.ext] }],
    });
    if (!dest) return;

    setExporting(true);
    setMessage("");
    try {
      const result = await api.exportSound(soundId, format, dest);
      setMessage(result);
    } catch (err) {
      setMessage(String(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg border border-ds-border bg-ds-elevated shadow-2xl">
        <div className="flex items-center justify-between border-b border-ds-border px-4 py-3">
          <h3 className="font-semibold">导出音频</h3>
          <button type="button" onClick={onClose} className="text-ds-muted hover:text-ds-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <label className="mb-2 block text-xs text-ds-muted">素材</label>
            <select
              value={soundId}
              onChange={(e) => setSoundId(e.target.value)}
              className="w-full rounded border border-ds-border bg-ds-bg px-3 py-2 text-sm outline-none"
            >
              {sounds.length === 0 && <option value="">暂无素材</option>}
              {sounds.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.format})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs text-ds-muted">导出格式</label>
            <div className="grid grid-cols-4 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  className={`rounded border py-2 text-sm transition ${
                    format === f.id
                      ? "border-ds-accent bg-ds-accent/15 text-ds-accent"
                      : "border-ds-border text-ds-muted hover:border-ds-muted"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {format === "mp3" && (
              <p className="mt-2 text-[11px] text-ds-muted">
                MP3 需要系统已安装 ffmpeg；否则将尝试直接复制源文件。
              </p>
            )}
          </div>

          {message && (
            <p className={`text-xs ${message.startsWith("导出成功") ? "text-ds-green" : "text-ds-accent"}`}>
              {message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-ds-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-ds-border px-4 py-2 text-sm text-ds-muted"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || !soundId}
            className="flex items-center gap-2 rounded bg-ds-accent px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? "导出中…" : "导出"}
          </button>
        </div>
      </div>
    </div>
  );
}

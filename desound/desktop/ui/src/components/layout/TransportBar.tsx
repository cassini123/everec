import { Download, Pause, Play, Square } from "lucide-react";
import type { Workspace } from "../../types";

interface TransportBarProps {
  workspace: Workspace;
  playing: boolean;
  bpm: number;
  position: number;
  totalBeats?: number;
  positionSec: number;
  showTransport: boolean;
  onPlay: () => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
  onExport: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TransportBar({
  workspace,
  playing,
  bpm,
  position,
  totalBeats = 32,
  positionSec,
  showTransport,
  onPlay,
  onStop,
  onBpmChange,
  onExport,
}: TransportBarProps) {
  return (
    <footer className="flex h-12 shrink-0 items-center justify-between border-t border-ds-border bg-ds-panel px-4">
      <div className="flex items-center gap-2">
        {showTransport && (
          <>
            <button
              type="button"
              onClick={playing ? onStop : onPlay}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ds-accent text-white transition hover:bg-ds-accent-dim"
            >
              {playing ? (
                <Pause className="h-3.5 w-3.5" fill="currentColor" />
              ) : (
                <Play className="h-3.5 w-3.5 translate-x-0.5" fill="currentColor" />
              )}
            </button>
            <button
              type="button"
              onClick={onStop}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-ds-elevated text-ds-muted transition hover:text-ds-text"
            >
              <Square className="h-3 w-3" fill="currentColor" />
            </button>
            <div className="ml-3 flex items-center gap-3 font-mono text-xs text-ds-muted">
              <span>
                {formatTime(positionSec)} · Bar {Math.floor(position / 4) + 1}.
                {(position % 4) + 1}
              </span>
            </div>
          </>
        )}
      </div>

      {showTransport && (
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-ds-muted">
            BPM
            <input
              type="number"
              min={40}
              max={240}
              value={bpm}
              onChange={(e) => onBpmChange(Number(e.target.value))}
              className="w-14 rounded border border-ds-border bg-ds-bg px-2 py-1 font-mono text-sm text-ds-text outline-none focus:border-ds-accent"
            />
          </label>
          <div className="flex gap-0.5">
            {Array.from({ length: totalBeats }).map((_, i) => (
              <div
                key={i}
                className={`h-4 w-1 rounded-sm ${
                  i === position
                    ? "bg-ds-accent"
                    : i % 4 === 0
                      ? "bg-ds-border"
                      : "bg-ds-elevated"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-[11px] text-ds-muted">
          {workspace === "library" && "导入素材 · 支持 WAV / MP3 / FLAC"}
          {workspace === "foley" && "拟声设计 · 底部栏可叠加效果"}
          {workspace === "compose" && "音乐设计/时间轴 · 总览 + 格子编辑"}
          {workspace === "processing" && "声音处理预设 · 电台 / 广播 / 水中 / 回音"}
          {workspace === "design" && "AI 辅助关键词与风格匹配"}
        </span>
        {(workspace === "library" || workspace === "compose") && (
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-1.5 rounded border border-ds-border px-2.5 py-1 text-xs text-ds-muted hover:border-ds-accent hover:text-ds-accent"
          >
            <Download className="h-3.5 w-3.5" />
            导出
          </button>
        )}
      </div>
    </footer>
  );
}

import { useState } from "react";
import { Bookmark, Plus } from "lucide-react";
import { api, formatMs } from "../lib/api";
import type { Project } from "../types";

interface Props {
  project: Project;
  positionMs: number;
  onUpdate: (project: Project) => void;
}

export function StillsView({ project, positionMs, onUpdate }: Props) {
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");

  const handleCapture = async () => {
    const media = project.media[0];
    if (!media) {
      setMessage("请先导入视频素材");
      return;
    }
    try {
      const still = await api.addStillFrame(
        project.id,
        media.id,
        positionMs,
        label || `静帧 ${formatMs(positionMs)}`,
        ["静帧"],
        ["#5b8def", "#f59e6c", "#3dd68c"],
      );
      onUpdate({ ...project, stills: [...project.stills, still] });
      setLabel("");
      setMessage("静帧已保存");
    } catch (err) {
      setMessage(String(err));
    }
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Bookmark size={20} />
          静帧管理
        </h1>
        <p className="mt-1 text-sm text-sc-muted">
          捕捉关键画面，关联色彩参考与风格标签
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={`在当前位置 ${formatMs(positionMs)} 捕捉静帧…`}
          className="flex-1 rounded-lg border border-sc-border bg-sc-panel px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleCapture}
          className="flex items-center gap-2 rounded-lg bg-sc-accent px-4 py-2 text-sm text-white"
        >
          <Plus size={14} />
          捕捉
        </button>
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-sc-panel px-3 py-2 text-xs text-sc-muted">{message}</p>
      )}

      <div className="grid flex-1 grid-cols-2 gap-3 overflow-auto md:grid-cols-3 lg:grid-cols-4">
        {project.stills.map((still) => (
          <div
            key={still.id}
            className="rounded-xl border border-sc-border bg-sc-panel p-3"
          >
            <div className="mb-2 flex h-24 items-center justify-center rounded-lg bg-sc-track text-sc-muted">
              <Bookmark size={24} className="opacity-30" />
            </div>
            <div className="text-sm font-medium">{still.label}</div>
            <div className="mt-1 font-mono text-[10px] text-sc-muted">
              {formatMs(still.timestampMs)}
            </div>
            <div className="mt-2 flex gap-1">
              {still.colorPalette.map((c) => (
                <div
                  key={c}
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        ))}
        {project.stills.length === 0 && (
          <div className="col-span-full py-16 text-center text-sm text-sc-muted">
            在时间轴上定位后捕捉静帧
          </div>
        )}
      </div>
    </div>
  );
}

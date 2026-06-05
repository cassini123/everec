import { useEffect, useState } from "react";
import type { KnowgoProject, ProjectBrief } from "../types";
import { saveBrief } from "../lib/api";

interface BriefViewProps {
  project: KnowgoProject;
  onUpdate: (p: KnowgoProject) => void;
}

const FIELDS: { key: keyof ProjectBrief; label: string; rows?: number }[] = [
  { key: "title", label: "项目名称" },
  { key: "client", label: "客户 / 品牌" },
  { key: "objective", label: "项目目标", rows: 3 },
  { key: "audience", label: "目标受众", rows: 2 },
  { key: "tone", label: "调性 / 气质", rows: 2 },
  { key: "duration", label: "时长 / 规格" },
  { key: "references", label: "参考方向", rows: 3 },
  { key: "constraints", label: "约束条件", rows: 2 },
  { key: "deliverables", label: "交付物", rows: 2 },
];

export function BriefView({ project, onUpdate }: BriefViewProps) {
  const [brief, setBrief] = useState(project.brief);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setBrief(project.brief);
  }, [project.id, project.brief]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await saveBrief(project.id, brief);
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="border-b border-kg-border bg-kg-panel px-6 py-4">
        <h2 className="text-lg font-semibold">项目 Brief</h2>
        <p className="mt-1 text-xs text-kg-muted">
          定义项目背景与创作边界，后续分析与文档将引用此 Brief
        </p>
      </div>

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-6">
        {FIELDS.map(({ key, label, rows }) => (
          <div key={key}>
            <label className="mb-1.5 block text-xs font-medium text-kg-muted">
              {label}
            </label>
            {rows ? (
              <textarea
                value={brief[key]}
                onChange={(e) => setBrief({ ...brief, [key]: e.target.value })}
                rows={rows}
                className="w-full resize-none rounded-lg border border-kg-border bg-kg-bg px-3 py-2 text-sm outline-none focus:border-kg-accent"
              />
            ) : (
              <input
                value={brief[key]}
                onChange={(e) => setBrief({ ...brief, [key]: e.target.value })}
                className="w-full rounded-lg border border-kg-border bg-kg-bg px-3 py-2 text-sm outline-none focus:border-kg-accent"
              />
            )}
          </div>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-kg-accent px-5 py-2 text-sm font-medium text-kg-bg hover:bg-kg-accent-dim disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存 Brief"}
          </button>
          {saved && <span className="text-xs text-kg-accent">已保存</span>}
        </div>
      </div>
    </div>
  );
}

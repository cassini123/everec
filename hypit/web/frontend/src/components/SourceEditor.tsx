interface Props {
  value: string;
  onChange: (next: string) => void;
}

export function SourceEditor({ value, onChange }: Props) {
  const lines = value.split("\n");
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-hp-border bg-hp-surface">
      <div className="select-none border-r border-hp-border bg-black/20 px-2 py-3 text-right font-mono text-[11px] leading-6 text-hp-muted">
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="min-h-0 flex-1 resize-none bg-transparent px-3 py-3 font-mono text-[12.5px] leading-6 text-hp-text outline-none"
        aria-label="Workflow source"
      />
    </div>
  );
}

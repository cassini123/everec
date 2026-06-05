import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { InstrumentInfo } from "../../types";

interface InstrumentPickerProps {
  instruments: InstrumentInfo[];
  value: string;
  onChange: (slug: string) => void;
}

export function InstrumentPicker({
  instruments,
  value,
  onChange,
}: InstrumentPickerProps) {
  const [open, setOpen] = useState(false);
  const current = instruments.find((i) => i.slug === value);

  const grouped = instruments.reduce<Record<string, InstrumentInfo[]>>(
    (acc, inst) => {
      (acc[inst.category] ??= []).push(inst);
      return acc;
    },
    {},
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md border border-ds-border bg-ds-bg px-3 py-1.5 text-sm transition hover:border-ds-accent"
      >
        <span className="text-ds-accent">◆</span>
        {current?.name ?? "Select Instrument"}
        <ChevronDown className="h-3.5 w-3.5 text-ds-muted" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 max-h-72 w-64 overflow-auto rounded-lg border border-ds-border bg-ds-elevated py-1 shadow-xl">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-ds-muted">
                  {category}
                </div>
                {items.map((inst) => (
                  <button
                    key={inst.slug}
                    type="button"
                    onClick={() => {
                      onChange(inst.slug);
                      setOpen(false);
                    }}
                    className={`flex w-full flex-col px-3 py-2 text-left transition hover:bg-ds-panel ${
                      inst.slug === value ? "bg-ds-accent/10" : ""
                    }`}
                  >
                    <span className="text-sm">{inst.name}</span>
                    <span className="text-[11px] text-ds-muted">
                      {inst.description}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const STORAGE_KEY = "simcut-preview-height";
const DEFAULT_HEIGHT = 224;
const MIN_HEIGHT = 120;

interface Props {
  children: [ReactNode, ReactNode];
}

export function ResizableSplit({ children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topHeight, setTopHeight] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : DEFAULT_HEIGHT;
  });
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  const clampHeight = useCallback((h: number) => {
    const container = containerRef.current;
    const max = container ? Math.floor(container.clientHeight * 0.75) : 480;
    return Math.max(MIN_HEIGHT, Math.min(max, h));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(topHeight));
  }, [topHeight]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startH: topHeight };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    setTopHeight(clampHeight(drag.startH + (e.clientY - drag.startY)));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 overflow-hidden" style={{ height: topHeight }}>
        {children[0]}
      </div>

      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="调整预览区高度"
        className="group relative z-10 flex h-2 shrink-0 cursor-row-resize items-center justify-center border-y border-sc-border bg-sc-surface hover:bg-sc-accent/10"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="h-0.5 w-10 rounded-full bg-sc-muted/50 group-hover:bg-sc-accent/60" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">{children[1]}</div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import type { WaveformScope as ScopeData } from "../../types";

interface Props {
  scope: ScopeData;
  title?: string;
}

const SCOPE_H = 96;
const GAP = 4;

function drawScope(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  columns: number[][],
  color: string,
) {
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "#2a2a32";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const ly = y + (i / 4) * h;
    ctx.beginPath();
    ctx.moveTo(x, ly);
    ctx.lineTo(x + w, ly);
    ctx.stroke();
  }

  const colW = w / columns.length;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.55;

  for (let col = 0; col < columns.length; col++) {
    const values = columns[col];
    const cx = x + col * colW;
    for (const v of values) {
      const py = y + h - (v / 255) * h;
      ctx.fillRect(cx, py, Math.max(1, colW), 1.2);
    }
  }
  ctx.globalAlpha = 1;
}

export function WaveformScope({ scope, title = "色彩波形监视器" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const totalW = canvas.clientWidth;
    const totalH = SCOPE_H * 2 + GAP;

    canvas.width = totalW * dpr;
    canvas.height = totalH * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, totalW, totalH);

    drawScope(ctx, 0, 0, totalW, SCOPE_H, scope.luma, "#c8c8d0");

    const paradeW = (totalW - GAP * 2) / 3;
    const row2 = SCOPE_H + GAP;
    drawScope(ctx, 0, row2, paradeW, SCOPE_H, scope.r, "#f87171");
    drawScope(ctx, paradeW + GAP, row2, paradeW, SCOPE_H, scope.g, "#4ade80");
    drawScope(ctx, (paradeW + GAP) * 2, row2, paradeW, SCOPE_H, scope.b, "#60a5fa");
  }, [scope]);

  return (
    <div className="rounded-lg border border-sc-border bg-sc-track p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-sc-muted">{title}</span>
        <span className="font-mono text-[10px] text-sc-muted/60">
          Luma · RGB Parade · {scope.columns} 列采样
        </span>
      </div>
      <canvas ref={canvasRef} className="w-full" style={{ height: SCOPE_H * 2 + GAP }} />
      <div className="mt-1 flex gap-4 text-[10px] text-sc-muted">
        <span className="text-[#c8c8d0]">亮度波形</span>
        <span className="text-[#f87171]">R</span>
        <span className="text-[#4ade80]">G</span>
        <span className="text-[#60a5fa]">B</span>
      </div>
    </div>
  );
}

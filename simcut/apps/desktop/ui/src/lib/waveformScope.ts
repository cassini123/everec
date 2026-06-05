import type { WaveformScope } from "../types";

function computeLuma(r: number, g: number, b: number): number {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

/** 从像素栅格生成专业监视器风格的列波形（Luma + RGB Parade） */
export function computeWaveformScope(
  data: Uint8ClampedArray,
  imgWidth: number,
  imgHeight: number,
  scopeCols = 280,
): WaveformScope {
  const luma: number[][] = Array.from({ length: scopeCols }, () => []);
  const r: number[][] = Array.from({ length: scopeCols }, () => []);
  const g: number[][] = Array.from({ length: scopeCols }, () => []);
  const b: number[][] = Array.from({ length: scopeCols }, () => []);

  const rowStep = Math.max(1, Math.floor(imgHeight / 160));
  const colWidth = imgWidth / scopeCols;

  for (let col = 0; col < scopeCols; col++) {
    const xStart = Math.floor(col * colWidth);
    const xEnd = Math.min(imgWidth, Math.floor((col + 1) * colWidth));
    for (let x = xStart; x < xEnd; x++) {
      for (let y = 0; y < imgHeight; y += rowStep) {
        const i = (y * imgWidth + x) * 4;
        const rv = data[i];
        const gv = data[i + 1];
        const bv = data[i + 2];
        luma[col].push(computeLuma(rv, gv, bv));
        r[col].push(rv);
        g[col].push(gv);
        b[col].push(bv);
      }
    }
  }

  return { columns: scopeCols, luma, r, g, b };
}

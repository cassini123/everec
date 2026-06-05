/** 时间轴像素密度：每秒对应的像素宽度 */
export const PX_PER_SEC = 72;

export function timelineWidthPx(durationMs: number, minMs = 10000): number {
  const duration = Math.max(durationMs, minMs);
  return Math.ceil((duration / 1000) * PX_PER_SEC);
}

export function msFromTimelineX(
  scrollLeft: number,
  clientX: number,
  containerLeft: number,
): number {
  const x = scrollLeft + (clientX - containerLeft);
  return Math.max(0, (x / PX_PER_SEC) * 1000);
}

export function pxFromMs(ms: number): number {
  return (ms / 1000) * PX_PER_SEC;
}

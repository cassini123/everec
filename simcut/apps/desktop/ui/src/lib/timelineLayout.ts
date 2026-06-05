/** 时间轴像素密度：每秒对应的像素宽度 */
export const PX_PER_SEC = 72;

/** 时间轴末尾留白（可无限向后拖动） */
export const TIMELINE_PADDING_MS = 180_000;
export const TIMELINE_MIN_EXTENT_MS = 600_000;

export function timelineExtentMs(projectDurationMs: number, positionMs = 0): number {
  return Math.max(
    projectDurationMs + TIMELINE_PADDING_MS,
    positionMs + 60_000,
    TIMELINE_MIN_EXTENT_MS,
  );
}

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

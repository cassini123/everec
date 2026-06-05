/** SMPTE 风格时间码 MM:SS:FF 或 HH:MM:SS:FF */
export function formatTimecode(ms: number, fps = 30): string {
  const clamped = Math.max(0, ms);
  const totalFrames = Math.floor((clamped / 1000) * fps);
  const frames = totalFrames % fps;
  const totalSec = Math.floor(clamped / 1000);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60) % 60;
  const hour = Math.floor(totalSec / 3600);

  const ff = frames.toString().padStart(2, "0");
  const ss = sec.toString().padStart(2, "0");
  const mm = min.toString().padStart(2, "0");

  if (hour > 0) {
    return `${hour.toString().padStart(2, "0")}:${mm}:${ss}:${ff}`;
  }
  return `${mm}:${ss}:${ff}`;
}

export function rulerTicks(durationMs: number, _fps = 30): { ms: number; major: boolean }[] {
  const duration = Math.max(durationMs, 10000);
  const step = duration > 120000 ? 10000 : duration > 60000 ? 5000 : 1000;
  const ticks: { ms: number; major: boolean }[] = [];
  for (let ms = 0; ms <= duration; ms += step) {
    ticks.push({ ms, major: ms % (step * 5) === 0 || step >= 5000 });
  }
  return ticks;
}

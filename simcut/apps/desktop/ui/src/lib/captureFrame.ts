/** 从预览元素截取静帧缩略图与主色 */
export async function capturePreviewFrame(
  el: HTMLVideoElement | HTMLImageElement,
): Promise<{ dataUrl: string; palette: string[] }> {
  const w =
    el instanceof HTMLVideoElement ? el.videoWidth : el.naturalWidth;
  const h =
    el instanceof HTMLVideoElement ? el.videoHeight : el.naturalHeight;
  if (!w || !h) throw new Error("画面尚未就绪");

  const maxSide = 480;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(w * scale));
  canvas.height = Math.max(1, Math.floor(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 不可用");

  ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  const palette = extractPalette(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
  return { dataUrl, palette };
}

function extractPalette(data: Uint8ClampedArray, count = 3): string[] {
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += 16) {
    const r = Math.floor(data[i] / 64) * 64;
    const g = Math.floor(data[i + 1] / 64) * 64;
    const b = Math.floor(data[i + 2] / 64) * 64;
    const key = `${r},${g},${b}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.n++;
    else buckets.set(key, { r, g, b, n: 1 });
  }
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map(
      (c) =>
        `#${c.r.toString(16).padStart(2, "0")}${c.g.toString(16).padStart(2, "0")}${c.b.toString(16).padStart(2, "0")}`,
    );
}

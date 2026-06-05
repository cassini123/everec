/** 内存级预览 URL 缓存，避免 IndexedDB 异步读取导致黑屏 */
const urlCache = new Map<string, string>();

export function cachePreviewUrl(blobId: string, file: File | Blob): string {
  const existing = urlCache.get(blobId);
  if (existing) return existing;
  const url = URL.createObjectURL(file);
  urlCache.set(blobId, url);
  return url;
}

export function getCachedUrl(blobId: string): string | null {
  return urlCache.get(blobId) ?? null;
}

export function setCachedUrl(blobId: string, url: string) {
  const old = urlCache.get(blobId);
  if (old && old !== url) URL.revokeObjectURL(old);
  urlCache.set(blobId, url);
}

export async function resolvePreviewUrl(
  blobId: string,
  loader: () => Promise<string | null>,
): Promise<string | null> {
  const cached = getCachedUrl(blobId);
  if (cached) return cached;
  const url = await loader();
  if (url) setCachedUrl(blobId, url);
  return url;
}

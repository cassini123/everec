import { guessMime, isImageFile, isVideoFile } from "./mime";
import { cachePreviewUrl, getCachedUrl, setCachedUrl } from "./previewCache";

const DB_NAME = "simcut-media";
const STORE = "blobs";
const DB_VERSION = 2;

interface StoredMedia {
  mimeType: string;
  buffer: ArrayBuffer;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

export async function saveBlob(id: string, file: File | Blob, fileName?: string): Promise<void> {
  const mimeType =
    file.type || guessMime(fileName ?? (file instanceof File ? file.name : "media.mp4"));
  const buffer = (await file.arrayBuffer()).slice(0);
  cachePreviewUrl(id, new Blob([buffer], { type: mimeType }));
  const entry: StoredMedia = { mimeType, buffer };
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(entry, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function readEntry(id: string): Promise<StoredMedia | null> {
  const db = await openDb();
  const raw = await new Promise<StoredMedia | Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });

  if (!raw) return null;

  // 兼容旧版：直接存的 Blob/File
  if (raw instanceof Blob) {
    const mimeType = raw.type || "video/mp4";
    return { mimeType, buffer: await raw.arrayBuffer() };
  }

  if ("buffer" in raw && "mimeType" in raw) {
    return raw as StoredMedia;
  }

  return null;
}

export async function getBlob(id: string): Promise<Blob | null> {
  const entry = await readEntry(id);
  if (!entry) return null;
  return new Blob([entry.buffer], { type: entry.mimeType });
}

export async function getObjectUrl(id: string): Promise<string | null> {
  const cached = getCachedUrl(id);
  if (cached) return cached;
  const blob = await getBlob(id);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  setCachedUrl(id, url);
  return url;
}

export function getObjectUrlSync(id: string): string | null {
  return getCachedUrl(id);
}

export function probeVideo(file: File, blobUrl?: string): Promise<{
  durationMs: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const url = blobUrl ?? URL.createObjectURL(file);
    const shouldRevoke = !blobUrl;
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      if (shouldRevoke) URL.revokeObjectURL(url);
    };

    video.onloadeddata = () => {
      resolve({
        durationMs: Math.round((video.duration || 0) * 1000),
        width: video.videoWidth || 1920,
        height: video.videoHeight || 1080,
      });
      cleanup();
    };
    video.onerror = () => {
      cleanup();
      reject(new Error(`无法解码视频（${file.name}）。若为 HEVC/H.265，请尝试导出为 H.264 MP4`));
    };
    video.src = url;
    video.load();
  });
}

export function probeImage(file: File, blobUrl?: string): Promise<{
  durationMs: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const url = blobUrl ?? URL.createObjectURL(file);
    const shouldRevoke = !blobUrl;
    const img = new Image();
    img.onload = () => {
      resolve({
        durationMs: 5000,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      if (shouldRevoke) URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      if (shouldRevoke) URL.revokeObjectURL(url);
      reject(new Error(`无法加载图片: ${file.name}`));
    };
    img.src = url;
  });
}

export async function probeMedia(file: File): Promise<{
  durationMs: number;
  width: number;
  height: number;
  kind: "video" | "image";
}> {
  const mime = file.type || guessMime(file.name);
  if (isVideoFile(file.name, mime)) {
    const meta = await probeVideo(file);
    return { ...meta, kind: "video" };
  }
  if (isImageFile(file.name, mime)) {
    const meta = await probeImage(file);
    return { ...meta, kind: "image" };
  }
  try {
    const meta = await probeVideo(file);
    return { ...meta, kind: "video" };
  } catch {
    const meta = await probeImage(file);
    return { ...meta, kind: "image" };
  }
}

export async function captureVideoFrame(
  blobId: string,
  timeMs: number,
): Promise<{ r: number; g: number; b: number }[]> {
  const url = await getObjectUrl(blobId);
  if (!url) throw new Error("素材未找到");

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    video.onloadeddata = () => {
      video.currentTime = Math.min(timeMs / 1000, Math.max(0, video.duration - 0.1));
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(video.videoWidth, 320);
      canvas.height = Math.min(video.videoHeight, 180);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas 不可用"));
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const pixels: { r: number; g: number; b: number }[] = [];
      for (let i = 0; i < data.length; i += 4) {
        pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
      URL.revokeObjectURL(url);
      resolve(pixels);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法截取视频帧"));
    };

    video.src = url;
    video.load();
  });
}

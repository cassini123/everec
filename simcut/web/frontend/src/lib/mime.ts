export type MediaKind = "video" | "image" | "audio";

const EXT_MIME: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  m4v: "video/mp4",
  webm: "video/webm",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  gif: "image/gif",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
};

export function extFromName(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function guessMime(name: string, fallback = "application/octet-stream"): string {
  return EXT_MIME[extFromName(name)] ?? fallback;
}

export function guessKind(name: string, mime?: string): MediaKind {
  const m = mime || guessMime(name);
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("audio/")) return "audio";
  const ext = extFromName(name);
  if (["mp4", "mov", "m4v", "webm", "mkv", "avi"].includes(ext)) return "video";
  if (["jpg", "jpeg", "png", "webp", "heic", "gif"].includes(ext)) return "image";
  return "video";
}

export function isVideoFile(name: string, mime?: string): boolean {
  return guessKind(name, mime) === "video";
}

export function isImageFile(name: string, mime?: string): boolean {
  return guessKind(name, mime) === "image";
}

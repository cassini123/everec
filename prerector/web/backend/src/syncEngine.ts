import { v4 as uuid } from "uuid";
import type { SyncFile, SyncPriority, SyncSession } from "@everec/shared";

const VIDEO_MIMES = [
  "video/mp4",
  "video/quicktime",
  "video/x-matroska",
  "application/octet-stream",
];

interface CreateSyncInput {
  projectId: string;
  name: string;
  strategy?: SyncSession["strategy"];
  fileNames?: string[];
}

const DEFAULT_VIDEO_FILES = [
  { name: "timeline.xml", size: 128_000, priority: "timeline" as SyncPriority, isProxy: false },
  { name: "project.prproj", size: 256_000, priority: "timeline" as SyncPriority, isProxy: false },
  { name: "footage_a001_proxy.mp4", size: 45_000_000, priority: "proxy" as SyncPriority, isProxy: true },
  { name: "footage_a002_proxy.mp4", size: 38_000_000, priority: "proxy" as SyncPriority, isProxy: true },
  { name: "footage_a001_raw.mov", size: 2_400_000_000, priority: "raw" as SyncPriority, isProxy: false },
  { name: "footage_a002_raw.mov", size: 1_800_000_000, priority: "raw" as SyncPriority, isProxy: false },
  { name: "color_lut.cube", size: 12_000, priority: "timeline" as SyncPriority, isProxy: false },
  { name: "subtitles.srt", size: 4_000, priority: "timeline" as SyncPriority, isProxy: false },
];

function priorityOrder(strategy: SyncSession["strategy"]): SyncPriority[] {
  switch (strategy) {
    case "timeline_first":
      return ["timeline", "proxy", "raw"];
    case "full":
      return ["timeline", "proxy", "raw"];
    case "proxy_first":
    default:
      return ["proxy", "timeline", "raw"];
  }
}

function guessMime(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "mp4") return "video/mp4";
  if (ext === "mov") return "video/quicktime";
  if (ext === "mkv") return "video/x-matroska";
  if (ext === "xml" || ext === "prproj") return "application/xml";
  if (ext === "srt") return "text/plain";
  if (ext === "cube") return "text/plain";
  return "application/octet-stream";
}

function guessPriority(name: string, isProxy: boolean): SyncPriority {
  if (isProxy || name.includes("proxy")) return "proxy";
  if (/timeline|\.xml|\.prproj|\.srt|\.cube|edit/i.test(name)) return "timeline";
  if (/raw|\.mov|\.mp4|footage|a00/i.test(name)) return "raw";
  return "timeline";
}

export function createSyncSession(input: CreateSyncInput): SyncSession {
  const now = new Date().toISOString();
  const strategy = input.strategy ?? "proxy_first";
  const sessionId = uuid();

  const specs =
    input.fileNames && input.fileNames.length > 0
      ? input.fileNames.map((name) => {
          const isProxy = name.includes("proxy");
          return {
            name,
            size: isProxy ? 40_000_000 : name.includes("raw") ? 1_500_000_000 : 200_000,
            priority: guessPriority(name, isProxy),
            isProxy,
          };
        })
      : DEFAULT_VIDEO_FILES;

  const order = priorityOrder(strategy);
  const sorted = [...specs].sort(
    (a, b) => order.indexOf(a.priority) - order.indexOf(b.priority),
  );

  const files: SyncFile[] = sorted.map((spec) => ({
    id: uuid(),
    sessionId,
    name: spec.name,
    sizeBytes: spec.size,
    priority: spec.priority,
    status: "pending",
    progress: 0,
    isProxy: spec.isProxy,
    mimeType: guessMime(spec.name),
  }));

  return {
    id: sessionId,
    projectId: input.projectId,
    name: input.name,
    strategy,
    files,
    createdAt: now,
  };
}

/** Simulate one sync tick — proxy files sync faster (video-optimized). */
export function advanceSyncSession(session: SyncSession): SyncSession {
  const files = session.files.map((f) => ({ ...f }));
  const active = files.find((f) => f.status === "syncing");
  const next =
    active ??
    files.find((f) => f.status === "pending" && (f.priority === "proxy" || f.priority === "timeline"));

  if (!next) return { ...session, files };

  const idx = files.findIndex((f) => f.id === next.id);
  const chunkRate = next.isProxy ? 18 : next.priority === "timeline" ? 35 : 4;
  const newProgress = Math.min(100, next.progress + chunkRate);

  files[idx] = {
    ...next,
    status: newProgress >= 100 ? "done" : "syncing",
    progress: newProgress,
  };

  return { ...session, files };
}

export function syncStats(session: SyncSession) {
  const total = session.files.length;
  const done = session.files.filter((f) => f.status === "done").length;
  const bytesTotal = session.files.reduce((s, f) => s + f.sizeBytes, 0);
  const bytesDone = session.files.reduce(
    (s, f) => s + (f.sizeBytes * f.progress) / 100,
    0,
  );
  return { total, done, bytesTotal, bytesDone, percent: total ? (done / total) * 100 : 0 };
}

export { VIDEO_MIMES };

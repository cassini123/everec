import { guessKind, guessMime } from "./mime";
import type { Clip, MediaAsset, Project, Track } from "../types";

export function migrateMedia(asset: MediaAsset): MediaAsset {
  const mimeType = asset.mimeType ?? guessMime(asset.fileName);
  return {
    ...asset,
    blobId: asset.blobId ?? asset.id,
    mimeType,
    kind: asset.kind ?? guessKind(asset.fileName, mimeType),
  };
}

export function migrateProject(project: Project): Project {
  return {
    ...project,
    media: project.media.map(migrateMedia),
  };
}

export function findMedia(project: Project, mediaId: string): MediaAsset | undefined {
  return project.media.find((m) => m.id === mediaId);
}

export function clipAtTime(project: Project, timeMs: number): Clip | null {
  for (const track of project.tracks) {
    for (const clip of track.clips) {
      if (timeMs >= clip.startMs && timeMs < clip.startMs + clip.durationMs) {
        return clip;
      }
    }
  }
  return project.tracks[0]?.clips[0] ?? null;
}

export function updateClip(
  project: Project,
  clipId: string,
  patch: Partial<Pick<Clip, "startMs" | "durationMs" | "trimInMs" | "trimOutMs" | "trackIndex">>,
): Project {
  const tracks = project.tracks.map((track) => ({
    ...track,
    clips: track.clips.map((c) => (c.id === clipId ? { ...c, ...patch } : c)),
  }));

  const durationMs = Math.max(
    project.durationMs,
    ...tracks.flatMap((t) => t.clips.map((c) => c.startMs + c.durationMs)),
    1000,
  );

  return { ...project, tracks, durationMs };
}

export function addClipToTrack(
  project: Project,
  media: MediaAsset,
  trackIndex: number,
  startMs: number,
): Project {
  const durationMs = media.durationMs || 5000;
  const clip: Clip = {
    id: crypto.randomUUID(),
    trackIndex,
    mediaId: media.id,
    startMs: Math.max(0, startMs),
    durationMs,
    trimInMs: 0,
    trimOutMs: durationMs,
    effectIds: [],
  };

  const tracks: Track[] = project.tracks.map((t) =>
    t.index === trackIndex ? { ...t, clips: [...t.clips, clip] } : t,
  );

  const newDuration = Math.max(project.durationMs, clip.startMs + clip.durationMs);

  return {
    ...project,
    tracks,
    durationMs: newDuration,
    media: project.media.some((m) => m.id === media.id)
      ? project.media
      : [...project.media, media],
  };
}

export function removeClip(project: Project, clipId: string): Project {
  const tracks = project.tracks.map((t) => ({
    ...t,
    clips: t.clips.filter((c) => c.id !== clipId),
  }));
  return { ...project, tracks };
}

export function snapMs(ms: number, step = 100): number {
  return Math.round(ms / step) * step;
}

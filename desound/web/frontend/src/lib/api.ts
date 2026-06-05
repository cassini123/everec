import type {
  ExportFormat,
  InstrumentInfo,
  LinkParseResult,
  MusicSearchResult,
  SfxSearchResult,
  SoundAsset,
  SoundDesignResult,
  TrackInfo,
} from "@everec/shared";
import { WEB_INSTRUMENTS } from "@everec/shared";
import {
  initWebAudio,
  playWebNote,
  stopAllWebNotes,
  stopWebNote,
} from "./webAudioEngine";

const API = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, init);
  let data: unknown = {};
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || `HTTP ${res.status}` };
  }
  if (!res.ok) {
    const msg = (data as { error?: string }).error ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

let webTracks: TrackInfo[] = [
  {
    index: 0,
    name: "Track 1",
    instrument: "grand_piano",
    volume: 0.85,
    pan: 0,
    muted: false,
    solo: false,
  },
];

export const api = {
  isDesktop: () => false,
  isWeb: () => true,

  listInstruments: (): Promise<InstrumentInfo[]> => Promise.resolve(WEB_INSTRUMENTS),

  initAudio: (): Promise<void> => initWebAudio(),

  listTracks: (): Promise<TrackInfo[]> => Promise.resolve(webTracks.map((t) => ({ ...t }))),

  addTrack: async (name = "Track", instrument = "grand_piano"): Promise<number> => {
    const idx = webTracks.length;
    webTracks = [
      ...webTracks,
      {
        index: idx,
        name: name || `Track ${idx + 1}`,
        instrument,
        volume: 0.85,
        pan: 0,
        muted: false,
        solo: false,
      },
    ];
    return idx;
  },

  setTrackInstrument: async (track: number, instrument: string): Promise<void> => {
    webTracks = webTracks.map((t) => (t.index === track ? { ...t, instrument } : t));
  },

  setTrackVolume: async (track: number, volume: number): Promise<void> => {
    webTracks = webTracks.map((t) => (t.index === track ? { ...t, volume } : t));
  },

  setTrackLoudness: async (): Promise<void> => Promise.resolve(),

  noteOn: async (track: number, note: number, velocity = 0.85): Promise<void> => {
    await initWebAudio();
    const inst = webTracks[track]?.instrument ?? "grand_piano";
    playWebNote(track, note, velocity, inst as "grand_piano");
  },

  noteOff: async (track: number, note: number): Promise<void> => {
    stopWebNote(track, note);
  },

  allNotesOff: async (): Promise<void> => {
    stopAllWebNotes();
  },

  listLibrarySounds: () => request<SoundAsset[]>("/library/sounds"),

  uploadBgmFile: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API}/library/upload`, { method: "POST", body: form }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "上传失败");
      return data as SoundAsset;
    });
  },

  uploadFoleyFile: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API}/library/upload-foley`, { method: "POST", body: form }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "上传失败");
      return data as SoundAsset;
    });
  },

  saveFoleySound: async (name: string, presetId: string, tags: string[]): Promise<SoundAsset> => {
    return request<SoundAsset>("/library/save-foley-meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, presetId, tags }),
    });
  },

  deleteSound: (id: string) =>
    request<{ ok: boolean }>(`/library/sounds/${id}`, { method: "DELETE" }),

  exportSound: async (soundId: string, _format?: ExportFormat) => {
    const sound = await request<SoundAsset>(`/library/sounds/${soundId}`);
    return sound.audioUrl ?? `/api/library/sounds/${soundId}/audio`;
  },

  analyzeSoundDesign: (): Promise<SoundDesignResult> =>
    Promise.reject(new Error("Web 端使用 Design 面板本地分析")),

  getLibraryDir: (): Promise<string> => Promise.resolve("web"),

  searchMusicOnline: (q: string, limit = 20) =>
    request<MusicSearchResult[]>(`/search/music?q=${encodeURIComponent(q)}&limit=${limit}`),

  searchSfxOnline: (q: string, limit = 12) =>
    request<SfxSearchResult[]>(`/search/sfx?q=${encodeURIComponent(q)}&limit=${limit}`),

  getSearchPlayUrl: (result: MusicSearchResult) => {
    const params = new URLSearchParams({
      resultId: result.id,
      title: result.title,
      artist: result.artist,
      source: result.source,
    });
    if (result.previewUrl) params.set("previewUrl", result.previewUrl);
    return `${API}/search/play?${params.toString()}`;
  },

  parseMediaUrl: (url: string) =>
    request<LinkParseResult>("/library/parse-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }),

  saveSearchResult: (result: MusicSearchResult) =>
    request<SoundAsset>("/library/import-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resultId: result.id,
        title: result.title,
        artist: result.artist,
        previewUrl: result.previewUrl,
        source: result.source,
        playBvid: result.playBvid,
      }),
    }),

  saveSfxResult: (result: SfxSearchResult) =>
    request<SoundAsset>("/library/import-sfx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    }),

  saveLinkResult: (link: LinkParseResult) =>
    request<SoundAsset>("/library/import-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(link),
    }),

  getAudioUrl: (soundId: string) => `/api/library/sounds/${soundId}/audio`,
};

export function noteName(midi: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midi / 12) - 1;
  return `${names[midi % 12]}${octave}`;
}

export function dbToVolume(gainDb: number): number {
  return Math.min(1, Math.max(0, Math.pow(10, gainDb / 20)));
}

export function beatToSec(beat: number, bpm: number): number {
  return (beat * 60) / bpm;
}

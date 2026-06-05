import type {
  ExportFormat,
  InstrumentInfo,
  LinkParseResult,
  MusicSearchResult,
  SoundAsset,
  SoundDesignResult,
  TrackInfo,
} from "@everec/shared";

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

export const api = {
  isDesktop: () => false,
  isWeb: () => true,

  listInstruments: (): Promise<InstrumentInfo[]> => Promise.resolve([]),
  initAudio: (): Promise<void> => Promise.resolve(),
  listTracks: (): Promise<TrackInfo[]> => Promise.resolve([]),
  addTrack: (_name?: string, _instrument?: string): Promise<number> =>
    Promise.reject(new Error("Web 端暂不支持作曲轨")),
  setTrackInstrument: (_track?: number, _instrument?: string): Promise<void> => Promise.resolve(),
  setTrackVolume: (_track?: number, _volume?: number): Promise<void> => Promise.resolve(),
  setTrackLoudness: (_track?: number, _gainDb?: number): Promise<void> => Promise.resolve(),
  noteOn: (_track?: number, _note?: number, _velocity?: number): Promise<void> =>
    Promise.resolve(),
  noteOff: (_track?: number, _note?: number): Promise<void> => Promise.resolve(),
  allNotesOff: (_track?: number): Promise<void> => Promise.resolve(),

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

  saveFoleySound: (_name?: string, _presetId?: string, _tags?: string[]): Promise<SoundAsset> =>
    Promise.reject(new Error("Web 端暂不支持拟音保存")),

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
      }),
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

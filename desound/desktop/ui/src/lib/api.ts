import type {
  ExportFormat,
  InstrumentInfo,
  SfxSearchResult,
  SoundAsset,
  SoundDesignResult,
  TrackInfo,
} from "../types";
import { searchSfxOnline as searchSfxShared } from "@everec/shared";
import { open } from "@tauri-apps/plugin-dialog";
import { DESKTOP_APP_HINT, invoke, isTauriApp } from "./tauri";

function requireDesktop<T>(fn: () => Promise<T>): Promise<T> {
  if (!isTauriApp()) return Promise.reject(new Error(DESKTOP_APP_HINT));
  return fn();
}

export const api = {
  isDesktop: isTauriApp,

  listInstruments: (): Promise<InstrumentInfo[]> =>
    isTauriApp() ? invoke("list_instruments") : Promise.resolve([]),

  initAudio: (): Promise<void> =>
    isTauriApp() ? invoke("init_audio") : Promise.resolve(),

  listTracks: (): Promise<TrackInfo[]> =>
    isTauriApp() ? invoke("list_tracks") : Promise.resolve([]),

  addTrack: (name: string, instrument: string): Promise<number> =>
    requireDesktop(() => invoke("add_track", { name, instrument })),

  setTrackInstrument: (track: number, instrument: string): Promise<void> =>
    isTauriApp()
      ? invoke("set_track_instrument", { track, instrument })
      : Promise.resolve(),

  setTrackVolume: (track: number, volume: number): Promise<void> =>
    isTauriApp()
      ? invoke("set_track_volume", { track, volume })
      : Promise.resolve(),

  setTrackLoudness: (track: number, gainDb: number): Promise<void> =>
    isTauriApp()
      ? invoke("set_track_loudness", { track, gainDb })
      : Promise.resolve(),

  noteOn: (
    track: number,
    note: number,
    velocity: number,
    _durationSec?: number,
  ): Promise<void> =>
    isTauriApp()
      ? invoke("note_on", { track, note, velocity })
      : Promise.resolve(),

  noteOff: (track: number, note: number): Promise<void> =>
    isTauriApp()
      ? invoke("note_off", { track, note })
      : Promise.resolve(),

  allNotesOff: (track?: number): Promise<void> =>
    isTauriApp() ? invoke("all_notes_off", { track }) : Promise.resolve(),

  listLibrarySounds: (): Promise<SoundAsset[]> =>
    isTauriApp() ? invoke("list_library_sounds") : Promise.resolve([]),

  importSound: (
    sourcePath: string,
    name?: string,
    tags?: string[],
    category?: string,
  ): Promise<SoundAsset> =>
    requireDesktop(() => invoke("import_sound", { sourcePath, name, tags, category })),

  saveFoleySound: (name: string, presetId: string, tags?: string[]): Promise<SoundAsset> =>
    requireDesktop(() => invoke("save_foley_sound", { name, presetId, tags })),

  uploadFoleyFile: async (_file?: File): Promise<SoundAsset> => {
    const path = await open({
      multiple: false,
      filters: [{ name: "Audio", extensions: ["wav", "mp3", "flac", "aac", "ogg", "m4a"] }],
    });
    if (!path || typeof path !== "string") throw new Error("已取消选择");
    return invoke("import_sound", {
      sourcePath: path,
      tags: ["foley", "import"],
      category: "foley",
    });
  },

  searchSfxOnline: (q: string, limit = 12): Promise<SfxSearchResult[]> =>
    searchSfxShared(q, limit),

  getSfxPreviewUrl: (result: SfxSearchResult): string => result.previewUrl,

  saveSfxResult: (result: SfxSearchResult): Promise<SoundAsset> =>
    requireDesktop(() =>
      invoke("import_from_http_url", {
        url: result.previewUrl,
        name: result.title,
        tags: ["foley", "sfx", result.source],
        sourceLabel: `sfx:${result.source}`,
        referer: result.referer,
        ext: result.fileType,
      }),
    ),

  deleteSound: (id: string): Promise<void> =>
    requireDesktop(() => invoke("delete_sound", { id })),

  exportSound: (soundId: string, format: ExportFormat, destPath: string): Promise<string> =>
    requireDesktop(() => invoke("export_sound", { soundId, format, destPath })),

  analyzeSoundDesign: (description: string): Promise<SoundDesignResult> =>
    requireDesktop(() => invoke("analyze_sound_design", { description })),

  getLibraryDir: (): Promise<string> =>
    requireDesktop(() => invoke("get_library_dir")),

  checkYtdlp: (): Promise<boolean> =>
    isTauriApp() ? invoke("check_ytdlp") : Promise.resolve(false),
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

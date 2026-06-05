import type {
  ExportFormat,
  InstrumentInfo,
  SoundAsset,
  SoundDesignResult,
  TrackInfo,
} from "../types";
import { MOCK_INSTRUMENTS, MOCK_SOUNDS, MOCK_TRACKS } from "./mockData";
import { invoke, isTauriApp } from "./tauri";

export const api = {
  isDesktop: isTauriApp,

  listInstruments: (): Promise<InstrumentInfo[]> =>
    isTauriApp() ? invoke("list_instruments") : Promise.resolve(MOCK_INSTRUMENTS),

  initAudio: (): Promise<void> =>
    isTauriApp() ? invoke("init_audio") : Promise.resolve(),

  listTracks: (): Promise<TrackInfo[]> =>
    isTauriApp() ? invoke("list_tracks") : Promise.resolve(MOCK_TRACKS),

  addTrack: (name: string, instrument: string): Promise<number> =>
    isTauriApp()
      ? invoke("add_track", { name, instrument })
      : Promise.reject(new Error("浏览器预览模式不支持此操作")),

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

  noteOn: (track: number, note: number, velocity: number): Promise<void> =>
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
    isTauriApp() ? invoke("list_library_sounds") : Promise.resolve(MOCK_SOUNDS),

  importSound: (
    sourcePath: string,
    name?: string,
    tags?: string[],
    category?: string,
  ): Promise<SoundAsset> =>
    isTauriApp()
      ? invoke("import_sound", { sourcePath, name, tags, category })
      : Promise.reject(new Error("浏览器预览模式不支持上传，请使用 Tauri 桌面应用")),

  saveFoleySound: (name: string, presetId: string, tags?: string[]): Promise<SoundAsset> =>
    isTauriApp()
      ? invoke("save_foley_sound", { name, presetId, tags })
      : Promise.reject(new Error("浏览器预览模式不支持此操作")),

  deleteSound: (id: string): Promise<void> =>
    isTauriApp()
      ? invoke("delete_sound", { id })
      : Promise.reject(new Error("浏览器预览模式不支持此操作")),

  exportSound: (soundId: string, format: ExportFormat, destPath: string): Promise<string> =>
    isTauriApp()
      ? invoke("export_sound", { soundId, format, destPath })
      : Promise.reject(new Error("浏览器预览模式不支持导出")),

  analyzeSoundDesign: (description: string): Promise<SoundDesignResult> =>
    isTauriApp()
      ? invoke("analyze_sound_design", { description })
      : Promise.reject(new Error("浏览器预览模式请使用本地分析")),

  getLibraryDir: (): Promise<string> =>
    isTauriApp()
      ? invoke("get_library_dir")
      : Promise.reject(new Error("浏览器预览模式不可用")),

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

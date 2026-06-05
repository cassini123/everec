import { invoke } from "@tauri-apps/api/core";
import type {
  ExportFormat,
  InstrumentInfo,
  SoundAsset,
  SoundDesignResult,
  TrackInfo,
} from "../types";

export const api = {
  listInstruments: () => invoke<InstrumentInfo[]>("list_instruments"),
  initAudio: () => invoke<void>("init_audio"),
  listTracks: () => invoke<TrackInfo[]>("list_tracks"),
  addTrack: (name: string, instrument: string) =>
    invoke<number>("add_track", { name, instrument }),
  setTrackInstrument: (track: number, instrument: string) =>
    invoke<void>("set_track_instrument", { track, instrument }),
  setTrackVolume: (track: number, volume: number) =>
    invoke<void>("set_track_volume", { track, volume }),
  setTrackLoudness: (track: number, gainDb: number) =>
    invoke<void>("set_track_loudness", { track, gainDb }),
  noteOn: (track: number, note: number, velocity: number) =>
    invoke<void>("note_on", { track, note, velocity }),
  noteOff: (track: number, note: number) =>
    invoke<void>("note_off", { track, note }),
  allNotesOff: (track?: number) => invoke<void>("all_notes_off", { track }),
  listLibrarySounds: () => invoke<SoundAsset[]>("list_library_sounds"),
  importSound: (
    sourcePath: string,
    name?: string,
    tags?: string[],
    category?: string,
  ) => invoke<SoundAsset>("import_sound", { sourcePath, name, tags, category }),
  saveFoleySound: (name: string, presetId: string, tags?: string[]) =>
    invoke<SoundAsset>("save_foley_sound", { name, presetId, tags }),
  deleteSound: (id: string) => invoke<void>("delete_sound", { id }),
  exportSound: (soundId: string, format: ExportFormat, destPath: string) =>
    invoke<string>("export_sound", { soundId, format, destPath }),
  analyzeSoundDesign: (description: string) =>
    invoke<SoundDesignResult>("analyze_sound_design", { description }),
  getLibraryDir: () => invoke<string>("get_library_dir"),
  checkYtdlp: () => invoke<boolean>("check_ytdlp"),
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

import { useCallback, useEffect, useState } from "react";
import { Download, Plus } from "lucide-react";
import { api } from "../lib/api";
import { InstrumentPicker } from "../components/compose/InstrumentPicker";
import { NotePickerModal } from "../components/compose/NotePickerModal";
import { PianoRoll, type GridPick } from "../components/compose/PianoRoll";
import { MasterOverview } from "../components/compose/MasterOverview";
import { TrackList } from "../components/compose/TrackList";
import type { InstrumentInfo, NoteClip, TrackInfo } from "../types";

const TRACK_COLORS = ["#ff6b2c", "#4da3ff", "#3dd68c", "#a78bfa", "#f472b6"];
const TOTAL_BEATS = 32;

interface ComposeViewProps {
  instruments: InstrumentInfo[];
  tracks: TrackInfo[];
  bpm: number;
  position: number;
  playing: boolean;
  onTracksChange: () => void;
  onExport: () => void;
}

export function ComposeView({
  instruments,
  tracks,
  bpm,
  position,
  playing,
  onTracksChange,
  onExport,
}: ComposeViewProps) {
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [clips, setClips] = useState<NoteClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [lastPlayedBeat, setLastPlayedBeat] = useState(-1);
  const [picker, setPicker] = useState<GridPick | null>(null);

  const playNote = useCallback(
    async (track: number, note: number, velocity = 0.85) => {
      try {
        await api.noteOn(track, note, velocity);
        setActiveNotes((prev) => new Set(prev).add(note));
        window.setTimeout(() => {
          api.noteOff(track, note);
          setActiveNotes((prev) => {
            const next = new Set(prev);
            next.delete(note);
            return next;
          });
        }, 300);
      } catch {
        /* audio unavailable */
      }
    },
    [],
  );

  useEffect(() => {
    if (!playing) {
      setLastPlayedBeat(-1);
      return;
    }
    const beat = position;
    if (beat === lastPlayedBeat) return;
    setLastPlayedBeat(beat);

    clips
      .filter((c) => Math.floor(c.startBeat) === beat)
      .forEach((clip) => {
        api.noteOn(clip.track, clip.note, clip.velocity);
        window.setTimeout(() => api.noteOff(clip.track, clip.note), 220);
      });
  }, [playing, position, clips, lastPlayedBeat]);

  const addClip = useCallback(
    (note: number, beat: number, track = selectedTrack) => {
      const duplicate = clips.some(
        (c) => c.track === track && c.startBeat === beat && c.note === note,
      );
      if (duplicate) return;

      const clip: NoteClip = {
        id: crypto.randomUUID(),
        track,
        note,
        startBeat: beat,
        durationBeats: 1,
        velocity: 0.85,
      };
      setClips((prev) => [...prev, clip]);
      setSelectedClipId(clip.id);
      playNote(track, note);
    },
    [clips, selectedTrack, playNote],
  );

  const updateClip = useCallback((id: string, patch: Partial<NoteClip>) => {
    setClips((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, ...patch };
        const conflict = prev.some(
          (other) =>
            other.id !== id &&
            other.track === next.track &&
            other.startBeat === next.startBeat &&
            other.note === next.note,
        );
        return conflict ? c : next;
      }),
    );
  }, []);

  const deleteClip = useCallback((id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handlePickerConfirm = (note: number) => {
    if (!picker) return;
    if (picker.clipId) {
      updateClip(picker.clipId, { note, startBeat: picker.beat });
      playNote(selectedTrack, note);
    } else {
      addClip(note, picker.beat);
    }
    setPicker(null);
  };

  const handleAddTrack = async () => {
    const idx = tracks.length;
    await api.addTrack(`Track ${idx + 1}`, "grand_piano");
    await onTracksChange();
    setSelectedTrack(idx);
  };

  const handleInstrumentChange = async (slug: string) => {
    await api.setTrackInstrument(selectedTrack, slug);
    await onTracksChange();
  };

  const handleVolumeChange = async (track: number, volume: number) => {
    await api.setTrackVolume(track, volume);
    await onTracksChange();
  };

  const currentSlug = tracks[selectedTrack]?.instrument ?? "grand_piano";
  const trackColor = TRACK_COLORS[selectedTrack % TRACK_COLORS.length];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-ds-border bg-ds-panel px-4 py-2">
        <InstrumentPicker
          instruments={instruments}
          value={currentSlug}
          onChange={handleInstrumentChange}
        />
        <button
          type="button"
          onClick={handleAddTrack}
          className="flex items-center gap-1.5 rounded-md border border-ds-border px-3 py-1.5 text-xs text-ds-muted transition hover:border-ds-accent hover:text-ds-text"
        >
          <Plus className="h-3.5 w-3.5" />
          添加轨道
        </button>
        <span className="text-xs text-ds-muted">
          {clips.length} 个音符 · {bpm} BPM
        </span>
        <button
          type="button"
          onClick={onExport}
          className="ml-auto flex items-center gap-1.5 rounded-md bg-ds-accent/20 px-3 py-1.5 text-xs text-ds-accent hover:bg-ds-accent/30"
        >
          <Download className="h-3.5 w-3.5" />
          导出
        </button>
      </div>

      <MasterOverview
        tracks={tracks}
        clips={clips}
        beats={TOTAL_BEATS}
        position={position}
        playing={playing}
        selectedTrack={selectedTrack}
        onSelectTrack={setSelectedTrack}
      />

      <div className="flex min-h-0 flex-1">
        <TrackList
          tracks={tracks}
          selected={selectedTrack}
          onSelect={setSelectedTrack}
          onVolumeChange={handleVolumeChange}
        />
        <PianoRoll
          clips={clips}
          selectedTrack={selectedTrack}
          beats={TOTAL_BEATS}
          position={position}
          playing={playing}
          selectedClipId={selectedClipId}
          activeNotes={activeNotes}
          trackColor={trackColor}
          onSelectClip={setSelectedClipId}
          onAddClip={(note, beat) => addClip(note, beat)}
          onUpdateClip={updateClip}
          onDeleteClip={deleteClip}
          onOpenPicker={setPicker}
          onPreviewNote={(note) => playNote(selectedTrack, note)}
        />
      </div>

      <NotePickerModal
        open={picker !== null}
        beat={picker?.beat ?? 0}
        initialNote={picker?.note ?? 60}
        instrumentSlug={currentSlug}
        instruments={instruments}
        onPreview={(note) => playNote(selectedTrack, note)}
        onInstrumentChange={handleInstrumentChange}
        onConfirm={handlePickerConfirm}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}

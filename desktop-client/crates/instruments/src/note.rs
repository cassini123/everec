/// MIDI note number (0–127).
pub type MidiNote = u8;

/// Normalized velocity (0.0–1.0).
pub type Velocity = f32;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NoteEventKind {
    On,
    Off,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct NoteEvent {
    pub kind: NoteEventKind,
    pub note: MidiNote,
    pub velocity: Velocity,
}

impl NoteEvent {
    pub fn on(note: MidiNote, velocity: Velocity) -> Self {
        Self {
            kind: NoteEventKind::On,
            note,
            velocity: velocity.clamp(0.0, 1.0),
        }
    }

    pub fn off(note: MidiNote) -> Self {
        Self {
            kind: NoteEventKind::Off,
            note,
            velocity: 0.0,
        }
    }
}

/// Convert a MIDI note to frequency in Hz (A4 = 440 Hz).
pub fn midi_to_hz(note: MidiNote) -> f32 {
    440.0 * 2.0_f32.powf((note as f32 - 69.0) / 12.0)
}

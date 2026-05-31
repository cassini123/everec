mod catalog;
mod note;
mod preset;
mod voice;

pub use catalog::{
    catalog, find, InstrumentCategory, InstrumentDefinition, InstrumentId,
};
pub use note::{midi_to_hz, MidiNote, NoteEvent, NoteEventKind, Velocity};
pub use preset::{Adsr, InstrumentPreset, Waveform};
pub use voice::InstrumentVoicePool;

use preset::InstrumentPreset as Preset;

/// Playable instrument instance backed by a voice pool and preset.
pub struct Instrument {
    pool: InstrumentVoicePool,
}

impl Instrument {
    pub fn new(id: InstrumentId) -> Self {
        Self {
            pool: InstrumentVoicePool::new(Preset::for_id(id)),
        }
    }

    pub fn with_preset(preset: InstrumentPreset) -> Self {
        Self {
            pool: InstrumentVoicePool::new(preset),
        }
    }

    pub fn id(&self) -> InstrumentId {
        self.pool.preset().id
    }

    pub fn set_instrument(&mut self, id: InstrumentId) {
        self.pool.set_preset(Preset::for_id(id));
    }

    pub fn note_on(&mut self, note: MidiNote, velocity: Velocity) {
        self.pool.note_on(note, velocity);
    }

    pub fn note_off(&mut self, note: MidiNote) {
        self.pool.note_off(note);
    }

    pub fn all_notes_off(&mut self) {
        self.pool.all_notes_off();
    }

    pub fn process(&mut self, sample_rate: f32, output: &mut [f32]) {
        self.pool.render(sample_rate, output);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn catalog_lists_all_instruments() {
        assert_eq!(catalog().len(), InstrumentId::all().len());
    }

    #[test]
    fn slug_lookup_works() {
        assert_eq!(
            InstrumentId::from_slug("piano"),
            Some(InstrumentId::GrandPiano)
        );
    }
}

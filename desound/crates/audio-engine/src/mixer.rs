use instruments::{Instrument, InstrumentId, MidiNote, Velocity};
use parking_lot::Mutex;

const MAX_TRACKS: usize = 16;

pub struct Track {
    name: String,
    instrument: Instrument,
    volume: f32,
    pan: f32,
    muted: bool,
    solo: bool,
}

impl Track {
    pub fn new(name: impl Into<String>, instrument: InstrumentId) -> Self {
        Self {
            name: name.into(),
            instrument: Instrument::new(instrument),
            volume: 0.8,
            pan: 0.0,
            muted: false,
            solo: false,
        }
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn instrument_id(&self) -> InstrumentId {
        self.instrument.id()
    }

    pub fn set_instrument(&mut self, id: InstrumentId) {
        self.instrument.set_instrument(id);
    }

    pub fn set_volume(&mut self, volume: f32) {
        self.volume = volume.clamp(0.0, 1.0);
    }

    pub fn volume(&self) -> f32 {
        self.volume
    }

    pub fn set_pan(&mut self, pan: f32) {
        self.pan = pan.clamp(-1.0, 1.0);
    }

    pub fn pan(&self) -> f32 {
        self.pan
    }

    pub fn set_muted(&mut self, muted: bool) {
        self.muted = muted;
    }

    pub fn is_muted(&self) -> bool {
        self.muted
    }

    pub fn set_solo(&mut self, solo: bool) {
        self.solo = solo;
    }

    pub fn is_solo(&self) -> bool {
        self.solo
    }

    pub fn note_on(&mut self, note: MidiNote, velocity: Velocity) {
        self.instrument.note_on(note, velocity);
    }

    pub fn note_off(&mut self, note: MidiNote) {
        self.instrument.note_off(note);
    }

    pub fn all_notes_off(&mut self) {
        self.instrument.all_notes_off();
    }

    pub fn render(&mut self, sample_rate: f32, buffer: &mut [f32], any_solo: bool) {
        if self.muted || (any_solo && !self.solo) {
            return;
        }

        self.instrument.process(sample_rate, buffer);

        if self.volume != 1.0 {
            for sample in buffer.iter_mut() {
                *sample *= self.volume;
            }
        }

        if self.pan.abs() > f32::EPSILON {
            apply_pan(buffer, self.pan);
        }
    }
}

fn apply_pan(buffer: &mut [f32], pan: f32) {
    let left = ((1.0 - pan) * 0.5).sqrt();
    let right = ((1.0 + pan) * 0.5).sqrt();
    for (idx, sample) in buffer.iter_mut().enumerate() {
        let gain = if idx % 2 == 0 { left } else { right };
        *sample *= gain;
    }
}

pub struct Mixer {
    tracks: Vec<Track>,
    scratch: Vec<f32>,
}

impl Mixer {
    pub fn new() -> Self {
        Self {
            tracks: Vec::new(),
            scratch: Vec::new(),
        }
    }

    pub fn add_track(&mut self, name: impl Into<String>, instrument: InstrumentId) -> usize {
        assert!(
            self.tracks.len() < MAX_TRACKS,
            "maximum track count reached"
        );
        self.tracks.push(Track::new(name, instrument));
        self.tracks.len() - 1
    }

    pub fn track_count(&self) -> usize {
        self.tracks.len()
    }

    pub fn track(&self, index: usize) -> Option<&Track> {
        self.tracks.get(index)
    }

    pub fn track_mut(&mut self, index: usize) -> Option<&mut Track> {
        self.tracks.get_mut(index)
    }

    pub fn set_track_instrument(&mut self, index: usize, instrument: InstrumentId) -> bool {
        if let Some(track) = self.tracks.get_mut(index) {
            track.set_instrument(instrument);
            true
        } else {
            false
        }
    }

    pub fn render(&mut self, sample_rate: f32, output: &mut [f32]) {
        output.fill(0.0);
        if self.tracks.is_empty() {
            return;
        }

        let any_solo = self.tracks.iter().any(|track| track.is_solo());
        if self.scratch.len() != output.len() {
            self.scratch.resize(output.len(), 0.0);
        }

        for track in self.tracks.iter_mut() {
            self.scratch.fill(0.0);
            track.render(sample_rate, &mut self.scratch, any_solo);
            for (out, sample) in output.iter_mut().zip(self.scratch.iter()) {
                *out += *sample;
            }
        }

        for sample in output.iter_mut() {
            *sample = sample.clamp(-1.0, 1.0);
        }
    }
}

impl Default for Mixer {
    fn default() -> Self {
        Self::new()
    }
}

/// Shared mixer state used by the real-time audio callback.
pub type SharedMixer = Mutex<Mixer>;

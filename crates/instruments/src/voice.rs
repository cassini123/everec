use crate::note::midi_to_hz;
use crate::preset::{Adsr, InstrumentPreset, Waveform};

const MAX_LAYERS: usize = 3;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum EnvelopePhase {
    Idle,
    Attack,
    Decay,
    Sustain,
    Release,
}

#[derive(Debug, Clone, Copy)]
struct LayerState {
    phase: f32,
    frequency: f32,
    noise_seed: u32,
}

#[derive(Debug, Clone, Copy)]
pub struct Voice {
    active: bool,
    note: u8,
    velocity: f32,
    env_phase: EnvelopePhase,
    env_level: f32,
    layers: [LayerState; MAX_LAYERS],
    adsr: Adsr,
    preset: InstrumentPreset,
    drum_mode: Option<DrumKind>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum DrumKind {
    Kick,
    Snare,
    HiHat,
    Clap,
}

impl Voice {
    pub fn inactive() -> Self {
        Self {
            active: false,
            note: 0,
            velocity: 0.0,
            env_phase: EnvelopePhase::Idle,
            env_level: 0.0,
            layers: [LayerState {
                phase: 0.0,
                frequency: 440.0,
                noise_seed: 1,
            }; MAX_LAYERS],
            adsr: Adsr::PIANO,
            preset: InstrumentPreset::for_id(crate::catalog::InstrumentId::GrandPiano),
            drum_mode: None,
        }
    }

    pub fn start(&mut self, preset: InstrumentPreset, note: u8, velocity: f32) {
        self.active = true;
        self.note = note;
        self.velocity = velocity.clamp(0.0, 1.0);
        self.adsr = preset.adsr;
        self.preset = preset;
        self.env_phase = EnvelopePhase::Attack;
        self.env_level = 0.0;
        self.drum_mode = if preset.is_percussion {
            Some(drum_kind_for_note(note))
        } else {
            None
        };

        let base_hz = midi_to_hz(note);
        for (idx, layer) in self.layers.iter_mut().enumerate() {
            layer.phase = 0.0;
            layer.frequency = detuned_hz(base_hz, preset.layers[idx].detune_cents);
            layer.noise_seed = (note as u32).wrapping_mul(2654435761).wrapping_add(idx as u32 + 1);
        }
    }

    pub fn release(&mut self) {
        if self.active && self.env_phase != EnvelopePhase::Idle {
            self.env_phase = EnvelopePhase::Release;
        }
    }

    pub fn is_active(&self) -> bool {
        self.active
    }

    pub fn note(&self) -> u8 {
        self.note
    }

    pub fn render(&mut self, sample_rate: f32, output: &mut [f32]) {
        if !self.active {
            return;
        }

        let frame_count = output.len();
        for sample in output.iter_mut() {
            *sample += self.render_sample(sample_rate);
        }

        if self.env_phase == EnvelopePhase::Idle {
            self.active = false;
        }

        let _ = frame_count;
    }

    fn render_sample(&mut self, sample_rate: f32) -> f32 {
        let env = self.advance_envelope(sample_rate);
        if self.env_phase == EnvelopePhase::Idle {
            return 0.0;
        }

        let amplitude = env * self.velocity * self.preset.gain;
        if amplitude <= 0.000_01 {
            return 0.0;
        }

        let value = if let Some(drum) = self.drum_mode {
            self.render_drum(drum, sample_rate) * amplitude
        } else {
            let mut mixed = 0.0;
            for idx in 0..self.preset.layer_count as usize {
                let layer = self.preset.layers[idx];
                if layer.level <= 0.0 {
                    continue;
                }
                let state = &mut self.layers[idx];
                let osc = render_waveform(layer.waveform, state);
                mixed += osc * layer.level;
                state.phase += state.frequency / sample_rate;
                if state.phase >= 1.0 {
                    state.phase -= 1.0;
                }
            }
            mixed * amplitude
        };

        value.clamp(-1.0, 1.0)
    }

    fn render_drum(&mut self, drum: DrumKind, sample_rate: f32) -> f32 {
        let state = &mut self.layers[0];
        let sample = match drum {
            DrumKind::Kick => {
                let pitch = 120.0 * (-self.env_level * 8.0).exp() + 40.0;
                state.frequency = pitch;
                render_waveform(Waveform::Sine, state)
            }
            DrumKind::Snare => {
                let tone = render_waveform(Waveform::Triangle, state) * 0.35;
                let noise = render_waveform(Waveform::Noise, state) * 0.65;
                tone + noise
            }
            DrumKind::HiHat => render_waveform(Waveform::Noise, state) * 0.55,
            DrumKind::Clap => render_waveform(Waveform::Noise, state) * 0.7,
        };

        state.phase += state.frequency / sample_rate;
        if state.phase >= 1.0 {
            state.phase -= 1.0;
        }
        sample
    }

    fn advance_envelope(&mut self, sample_rate: f32) -> f32 {
        let dt = 1.0 / sample_rate;
        match self.env_phase {
            EnvelopePhase::Idle => 0.0,
            EnvelopePhase::Attack => {
                if self.adsr.attack <= 0.0 {
                    self.env_level = 1.0;
                    self.env_phase = EnvelopePhase::Decay;
                } else {
                    self.env_level += dt / self.adsr.attack;
                    if self.env_level >= 1.0 {
                        self.env_level = 1.0;
                        self.env_phase = EnvelopePhase::Decay;
                    }
                }
                self.env_level
            }
            EnvelopePhase::Decay => {
                if self.adsr.decay <= 0.0 {
                    self.env_level = self.adsr.sustain;
                    self.env_phase = EnvelopePhase::Sustain;
                } else {
                    self.env_level -= dt / self.adsr.decay * (1.0 - self.adsr.sustain);
                    if self.env_level <= self.adsr.sustain {
                        self.env_level = self.adsr.sustain;
                        self.env_phase = EnvelopePhase::Sustain;
                    }
                }
                self.env_level
            }
            EnvelopePhase::Sustain => self.env_level,
            EnvelopePhase::Release => {
                if self.adsr.release <= 0.0 {
                    self.env_level = 0.0;
                    self.env_phase = EnvelopePhase::Idle;
                } else {
                    self.env_level -= dt / self.adsr.release * self.env_level.max(0.001);
                    if self.env_level <= 0.001 {
                        self.env_level = 0.0;
                        self.env_phase = EnvelopePhase::Idle;
                    }
                }
                self.env_level
            }
        }
    }
}

fn detuned_hz(base: f32, cents: f32) -> f32 {
    base * 2.0_f32.powf(cents / 1200.0)
}

fn render_waveform(waveform: Waveform, state: &mut LayerState) -> f32 {
    match waveform {
        Waveform::Sine => (state.phase * std::f32::consts::TAU).sin(),
        Waveform::Triangle => {
            let value = state.phase * 2.0;
            if value < 1.0 {
                value * 2.0 - 1.0
            } else {
                3.0 - value * 2.0
            }
        }
        Waveform::Saw => state.phase * 2.0 - 1.0,
        Waveform::Square => {
            if state.phase < 0.5 {
                1.0
            } else {
                -1.0
            }
        }
        Waveform::Noise => {
            state.noise_seed = state.noise_seed.wrapping_mul(1664525).wrapping_add(1013904223);
            let normalized = (state.noise_seed >> 8) as f32 / 16_777_216.0;
            normalized * 2.0 - 1.0
        }
    }
}

fn drum_kind_for_note(note: u8) -> DrumKind {
    match note {
        36 => DrumKind::Kick,
        38 => DrumKind::Snare,
        42 | 44 | 46 => DrumKind::HiHat,
        39 => DrumKind::Clap,
        _ => DrumKind::HiHat,
    }
}

const MAX_VOICES: usize = 16;

pub struct InstrumentVoicePool {
    preset: InstrumentPreset,
    voices: [Voice; MAX_VOICES],
}

impl InstrumentVoicePool {
    pub fn new(preset: InstrumentPreset) -> Self {
        Self {
            preset,
            voices: [Voice::inactive(); MAX_VOICES],
        }
    }

    pub fn set_preset(&mut self, preset: InstrumentPreset) {
        self.preset = preset;
    }

    pub fn preset(&self) -> InstrumentPreset {
        self.preset
    }

    pub fn note_on(&mut self, note: u8, velocity: f32) {
        if !self.preset.is_percussion {
            if let Some(voice) = self
                .voices
                .iter_mut()
                .find(|voice| voice.is_active() && voice.note() == note)
            {
                voice.start(self.preset, note, velocity);
                return;
            }
        }

        if let Some(voice) = self.voices.iter_mut().find(|voice| !voice.is_active()) {
            voice.start(self.preset, note, velocity);
        } else {
            self.voices[0].start(self.preset, note, velocity);
        }
    }

    pub fn note_off(&mut self, note: u8) {
        if self.preset.is_percussion {
            return;
        }
        for voice in self.voices.iter_mut() {
            if voice.is_active() && voice.note() == note {
                voice.release();
            }
        }
    }

    pub fn all_notes_off(&mut self) {
        for voice in self.voices.iter_mut() {
            if voice.is_active() {
                voice.release();
            }
        }
    }

    pub fn render(&mut self, sample_rate: f32, output: &mut [f32]) {
        output.fill(0.0);
        for voice in self.voices.iter_mut() {
            voice.render(sample_rate, output);
        }
    }
}

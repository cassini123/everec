use crate::catalog::InstrumentId;

#[derive(Debug, Clone, Copy)]
pub enum Waveform {
    Sine,
    Triangle,
    Saw,
    Square,
    Noise,
}

#[derive(Debug, Clone, Copy)]
pub struct Adsr {
    pub attack: f32,
    pub decay: f32,
    pub sustain: f32,
    pub release: f32,
}

impl Adsr {
    pub const PIANO: Self = Self {
        attack: 0.002,
        decay: 0.35,
        sustain: 0.25,
        release: 0.25,
    };

    pub const EPIANO: Self = Self {
        attack: 0.001,
        decay: 0.5,
        sustain: 0.35,
        release: 0.3,
    };

    pub const BASS: Self = Self {
        attack: 0.005,
        decay: 0.15,
        sustain: 0.7,
        release: 0.12,
    };

    pub const LEAD: Self = Self {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.85,
        release: 0.08,
    };

    pub const PAD: Self = Self {
        attack: 0.4,
        decay: 0.3,
        sustain: 0.75,
        release: 0.8,
    };

    pub const STRINGS: Self = Self {
        attack: 0.25,
        decay: 0.2,
        sustain: 0.85,
        release: 0.5,
    };

    pub const ORGAN: Self = Self {
        attack: 0.01,
        decay: 0.05,
        sustain: 1.0,
        release: 0.05,
    };

    pub const PERCUSSION: Self = Self {
        attack: 0.001,
        decay: 0.08,
        sustain: 0.0,
        release: 0.05,
    };

    pub const GUITAR: Self = Self {
        attack: 0.003,
        decay: 0.45,
        sustain: 0.15,
        release: 0.35,
    };

    pub const SYNTH: Self = Self {
        attack: 0.02,
        decay: 0.2,
        sustain: 0.75,
        release: 0.25,
    };
}

#[derive(Debug, Clone, Copy)]
pub struct OscillatorLayer {
    pub waveform: Waveform,
    pub detune_cents: f32,
    pub level: f32,
}

#[derive(Debug, Clone, Copy)]
pub struct InstrumentPreset {
    pub id: InstrumentId,
    pub layers: [OscillatorLayer; 3],
    pub layer_count: u8,
    pub adsr: Adsr,
    pub gain: f32,
    pub is_percussion: bool,
}

impl InstrumentPreset {
    pub fn for_id(id: InstrumentId) -> Self {
        match id {
            InstrumentId::GrandPiano => Self {
                id,
                layers: [
                    OscillatorLayer {
                        waveform: Waveform::Triangle,
                        detune_cents: 0.0,
                        level: 0.55,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Sine,
                        detune_cents: 3.0,
                        level: 0.3,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Sine,
                        detune_cents: -4.0,
                        level: 0.25,
                    },
                ],
                layer_count: 3,
                adsr: Adsr::PIANO,
                gain: 0.85,
                is_percussion: false,
            },
            InstrumentId::ElectricPiano => Self {
                id,
                layers: [
                    OscillatorLayer {
                        waveform: Waveform::Sine,
                        detune_cents: 0.0,
                        level: 0.7,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Sine,
                        detune_cents: 7.0,
                        level: 0.35,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Triangle,
                        detune_cents: -2.0,
                        level: 0.2,
                    },
                ],
                layer_count: 3,
                adsr: Adsr::EPIANO,
                gain: 0.8,
                is_percussion: false,
            },
            InstrumentId::SynthBass => Self {
                id,
                layers: [
                    OscillatorLayer {
                        waveform: Waveform::Saw,
                        detune_cents: 0.0,
                        level: 0.75,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Square,
                        detune_cents: 0.0,
                        level: 0.15,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Sine,
                        detune_cents: 0.0,
                        level: 0.0,
                    },
                ],
                layer_count: 2,
                adsr: Adsr::BASS,
                gain: 0.9,
                is_percussion: false,
            },
            InstrumentId::SynthLead => Self {
                id,
                layers: [
                    OscillatorLayer {
                        waveform: Waveform::Saw,
                        detune_cents: 0.0,
                        level: 0.65,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Square,
                        detune_cents: 5.0,
                        level: 0.25,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Saw,
                        detune_cents: -5.0,
                        level: 0.2,
                    },
                ],
                layer_count: 3,
                adsr: Adsr::LEAD,
                gain: 0.75,
                is_percussion: false,
            },
            InstrumentId::WarmPad => Self {
                id,
                layers: [
                    OscillatorLayer {
                        waveform: Waveform::Sine,
                        detune_cents: 0.0,
                        level: 0.45,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Sine,
                        detune_cents: 8.0,
                        level: 0.35,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Triangle,
                        detune_cents: -6.0,
                        level: 0.25,
                    },
                ],
                layer_count: 3,
                adsr: Adsr::PAD,
                gain: 0.7,
                is_percussion: false,
            },
            InstrumentId::Strings => Self {
                id,
                layers: [
                    OscillatorLayer {
                        waveform: Waveform::Saw,
                        detune_cents: -4.0,
                        level: 0.35,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Saw,
                        detune_cents: 0.0,
                        level: 0.35,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Saw,
                        detune_cents: 4.0,
                        level: 0.35,
                    },
                ],
                layer_count: 3,
                adsr: Adsr::STRINGS,
                gain: 0.65,
                is_percussion: false,
            },
            InstrumentId::Organ => Self {
                id,
                layers: [
                    OscillatorLayer {
                        waveform: Waveform::Sine,
                        detune_cents: 0.0,
                        level: 0.5,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Sine,
                        detune_cents: 0.0,
                        level: 0.35,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Sine,
                        detune_cents: 12.0,
                        level: 0.2,
                    },
                ],
                layer_count: 3,
                adsr: Adsr::ORGAN,
                gain: 0.75,
                is_percussion: false,
            },
            InstrumentId::DrumKit => Self {
                id,
                layers: [
                    OscillatorLayer {
                        waveform: Waveform::Noise,
                        detune_cents: 0.0,
                        level: 1.0,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Sine,
                        detune_cents: 0.0,
                        level: 0.0,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Sine,
                        detune_cents: 0.0,
                        level: 0.0,
                    },
                ],
                layer_count: 1,
                adsr: Adsr::PERCUSSION,
                gain: 1.0,
                is_percussion: true,
            },
            InstrumentId::AcousticGuitar => Self {
                id,
                layers: [
                    OscillatorLayer {
                        waveform: Waveform::Triangle,
                        detune_cents: 0.0,
                        level: 0.55,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Saw,
                        detune_cents: 2.0,
                        level: 0.25,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Sine,
                        detune_cents: -3.0,
                        level: 0.15,
                    },
                ],
                layer_count: 3,
                adsr: Adsr::GUITAR,
                gain: 0.8,
                is_percussion: false,
            },
            InstrumentId::Synthesizer => Self {
                id,
                layers: [
                    OscillatorLayer {
                        waveform: Waveform::Saw,
                        detune_cents: 0.0,
                        level: 0.5,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Square,
                        detune_cents: 7.0,
                        level: 0.3,
                    },
                    OscillatorLayer {
                        waveform: Waveform::Saw,
                        detune_cents: -7.0,
                        level: 0.25,
                    },
                ],
                layer_count: 3,
                adsr: Adsr::SYNTH,
                gain: 0.78,
                is_percussion: false,
            },
        }
    }
}

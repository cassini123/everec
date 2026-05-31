use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InstrumentId {
    GrandPiano,
    ElectricPiano,
    SynthBass,
    SynthLead,
    WarmPad,
    Strings,
    Organ,
    DrumKit,
    AcousticGuitar,
    Synthesizer,
}

impl InstrumentId {
    pub fn all() -> &'static [InstrumentId] {
        &[
            InstrumentId::GrandPiano,
            InstrumentId::ElectricPiano,
            InstrumentId::SynthBass,
            InstrumentId::SynthLead,
            InstrumentId::WarmPad,
            InstrumentId::Strings,
            InstrumentId::Organ,
            InstrumentId::DrumKit,
            InstrumentId::AcousticGuitar,
            InstrumentId::Synthesizer,
        ]
    }

    pub fn from_slug(slug: &str) -> Option<InstrumentId> {
        match slug.to_lowercase().as_str() {
            "grand_piano" | "piano" => Some(InstrumentId::GrandPiano),
            "electric_piano" | "epiano" | "rhodes" => Some(InstrumentId::ElectricPiano),
            "synth_bass" | "bass" => Some(InstrumentId::SynthBass),
            "synth_lead" | "lead" => Some(InstrumentId::SynthLead),
            "warm_pad" | "pad" => Some(InstrumentId::WarmPad),
            "strings" => Some(InstrumentId::Strings),
            "organ" => Some(InstrumentId::Organ),
            "drum_kit" | "drums" | "drum" | "鼓" => Some(InstrumentId::DrumKit),
            "acoustic_guitar" | "guitar" | "吉他" => Some(InstrumentId::AcousticGuitar),
            "synthesizer" | "synth" | "合成器" => Some(InstrumentId::Synthesizer),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InstrumentCategory {
    Piano,
    Bass,
    Lead,
    Pad,
    Strings,
    Organ,
    Drums,
    Guitar,
    Synth,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct InstrumentDefinition {
    pub id: InstrumentId,
    pub name: &'static str,
    pub slug: &'static str,
    pub category: InstrumentCategory,
    pub description: &'static str,
}

pub fn catalog() -> &'static [InstrumentDefinition] {
    &[
        InstrumentDefinition {
            id: InstrumentId::GrandPiano,
            name: "Grand Piano",
            slug: "grand_piano",
            category: InstrumentCategory::Piano,
            description: "Bright acoustic piano with natural decay",
        },
        InstrumentDefinition {
            id: InstrumentId::ElectricPiano,
            name: "Electric Piano",
            slug: "electric_piano",
            category: InstrumentCategory::Piano,
            description: "Warm Rhodes-style electric piano",
        },
        InstrumentDefinition {
            id: InstrumentId::SynthBass,
            name: "Synth Bass",
            slug: "synth_bass",
            category: InstrumentCategory::Bass,
            description: "Punchy analog-style bass",
        },
        InstrumentDefinition {
            id: InstrumentId::SynthLead,
            name: "Synth Lead",
            slug: "synth_lead",
            category: InstrumentCategory::Lead,
            description: "Cutting monophonic lead synth",
        },
        InstrumentDefinition {
            id: InstrumentId::WarmPad,
            name: "Warm Pad",
            slug: "warm_pad",
            category: InstrumentCategory::Pad,
            description: "Slow-attack ambient pad",
        },
        InstrumentDefinition {
            id: InstrumentId::Strings,
            name: "Strings",
            slug: "strings",
            category: InstrumentCategory::Strings,
            description: "Lush ensemble strings",
        },
        InstrumentDefinition {
            id: InstrumentId::Organ,
            name: "Organ",
            slug: "organ",
            category: InstrumentCategory::Organ,
            description: "Classic drawbar organ",
        },
        InstrumentDefinition {
            id: InstrumentId::DrumKit,
            name: "Drums",
            slug: "drum_kit",
            category: InstrumentCategory::Drums,
            description: "鼓组 · kick, snare, hi-hat, clap",
        },
        InstrumentDefinition {
            id: InstrumentId::AcousticGuitar,
            name: "Guitar",
            slug: "acoustic_guitar",
            category: InstrumentCategory::Guitar,
            description: "木吉他 · 拨弦音色",
        },
        InstrumentDefinition {
            id: InstrumentId::Synthesizer,
            name: "Synthesizer",
            slug: "synthesizer",
            category: InstrumentCategory::Synth,
            description: "合成器 · 模拟电子音色",
        },
    ]
}

pub fn find(id: InstrumentId) -> Option<&'static InstrumentDefinition> {
    catalog().iter().find(|def| def.id == id)
}

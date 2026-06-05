use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum TimelineError {
    #[error("clip not found: {0}")]
    ClipNotFound(String),
    #[error("track not found: {0}")]
    TrackNotFound(usize),
    #[error("invalid time range")]
    InvalidRange,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TrackKind {
    Video,
    Audio,
    Subtitle,
    Overlay,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Clip {
    pub id: String,
    pub track_index: usize,
    pub media_id: String,
    pub start_ms: u64,
    pub duration_ms: u64,
    pub trim_in_ms: u64,
    pub trim_out_ms: u64,
    pub effect_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Track {
    pub index: usize,
    pub name: String,
    pub kind: TrackKind,
    pub muted: bool,
    pub locked: bool,
    pub clips: Vec<Clip>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EffectPreset {
    pub id: String,
    pub name: String,
    pub category: String,
    pub params: HashMap<String, f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StillFrame {
    pub id: String,
    pub media_id: String,
    pub timestamp_ms: u64,
    pub label: String,
    pub tags: Vec<String>,
    pub color_palette: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtitleCue {
    pub id: String,
    pub start_ms: u64,
    pub end_ms: u64,
    pub text: String,
    pub language: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaAsset {
    pub id: String,
    pub name: String,
    pub file_name: String,
    pub format: String,
    pub duration_ms: u64,
    pub width: u32,
    pub height: u32,
    pub tags: Vec<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub fps: u32,
    pub resolution: (u32, u32),
    pub duration_ms: u64,
    pub tracks: Vec<Track>,
    pub media: Vec<MediaAsset>,
    pub stills: Vec<StillFrame>,
    pub subtitles: Vec<SubtitleCue>,
    pub created_at: String,
    pub updated_at: String,
}

impl Project {
    pub fn new(name: impl Into<String>) -> Self {
        let now = chrono_now();
        Self {
            id: Uuid::new_v4().to_string(),
            name: name.into(),
            fps: 30,
            resolution: (1920, 1080),
            duration_ms: 0,
            tracks: vec![
                Track {
                    index: 0,
                    name: "主视频".into(),
                    kind: TrackKind::Video,
                    muted: false,
                    locked: false,
                    clips: Vec::new(),
                },
                Track {
                    index: 1,
                    name: "音频".into(),
                    kind: TrackKind::Audio,
                    muted: false,
                    locked: false,
                    clips: Vec::new(),
                },
                Track {
                    index: 2,
                    name: "字幕".into(),
                    kind: TrackKind::Subtitle,
                    muted: false,
                    locked: false,
                    clips: Vec::new(),
                },
            ],
            media: Vec::new(),
            stills: Vec::new(),
            subtitles: Vec::new(),
            created_at: now.clone(),
            updated_at: now,
        }
    }

    pub fn add_media(&mut self, asset: MediaAsset) {
        self.duration_ms = self.duration_ms.max(asset.duration_ms);
        self.media.push(asset);
        self.updated_at = chrono_now();
    }

    pub fn add_still(&mut self, still: StillFrame) {
        self.stills.push(still);
        self.updated_at = chrono_now();
    }

    pub fn add_subtitle(&mut self, cue: SubtitleCue) {
        self.subtitles.push(cue);
        self.updated_at = chrono_now();
    }

    pub fn add_clip(&mut self, clip: Clip) -> Result<(), TimelineError> {
        if clip.trim_out_ms <= clip.trim_in_ms {
            return Err(TimelineError::InvalidRange);
        }
        let track = self
            .tracks
            .iter_mut()
            .find(|t| t.index == clip.track_index)
            .ok_or(TimelineError::TrackNotFound(clip.track_index))?;
        track.clips.push(clip);
        self.updated_at = chrono_now();
        Ok(())
    }
}

pub fn default_effect_presets() -> Vec<EffectPreset> {
    vec![
        EffectPreset {
            id: "fade-in".into(),
            name: "渐显".into(),
            category: "transition".into(),
            params: [("duration_ms".into(), 500.0)].into(),
        },
        EffectPreset {
            id: "fade-out".into(),
            name: "渐隐".into(),
            category: "transition".into(),
            params: [("duration_ms".into(), 500.0)].into(),
        },
        EffectPreset {
            id: "highlight".into(),
            name: "高亮".into(),
            category: "emphasis".into(),
            params: [("intensity".into(), 0.6), ("radius".into(), 12.0)].into(),
        },
        EffectPreset {
            id: "zoom-in".into(),
            name: "推近".into(),
            category: "motion".into(),
            params: [("scale".into(), 1.15), ("duration_ms".into(), 800.0)].into(),
        },
        EffectPreset {
            id: "blur-bg".into(),
            name: "背景虚化".into(),
            category: "style".into(),
            params: [("blur".into(), 8.0)].into(),
        },
    ]
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "0".into())
}

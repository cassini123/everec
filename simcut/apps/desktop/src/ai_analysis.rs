use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExposureMetrics {
    pub iso: u32,
    pub shutter_speed: String,
    pub aperture: f32,
    pub exposure_value: f32,
    pub white_balance_k: u32,
    pub highlight_clipping: f32,
    pub shadow_detail: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiAnalysisResult {
    pub metrics: ExposureMetrics,
    pub suggestions: Vec<String>,
    pub prompt_edits: Vec<PromptEdit>,
    pub overall_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptEdit {
    pub prompt: String,
    pub action: String,
    pub confidence: f32,
}

pub fn analyze_frame(description: &str, frame_index: u32) -> AiAnalysisResult {
    let seed = description
        .bytes()
        .fold(frame_index as u32, |acc, b| acc.wrapping_add(b as u32));

    let iso = 100 + (seed % 3200);
    let aperture = 1.4 + (seed % 100) as f32 / 20.0;
    let ev = -1.0 + (seed % 300) as f32 / 100.0;
    let wb = 4500 + (seed % 2500);

    let metrics = ExposureMetrics {
        iso,
        shutter_speed: if iso > 1600 {
            "1/60".into()
        } else {
            "1/125".into()
        },
        aperture,
        exposure_value: ev,
        white_balance_k: wb,
        highlight_clipping: ((seed >> 4) % 30) as f32 / 100.0,
        shadow_detail: 0.5 + ((seed >> 8) % 50) as f32 / 100.0,
    };

    let mut suggestions = Vec::new();
    if metrics.iso > 1600 {
        suggestions.push("ISO 偏高，建议降低感光度或增加补光".into());
    }
    if metrics.highlight_clipping > 0.15 {
        suggestions.push("高光溢出，建议降低曝光 0.3-0.7 EV".into());
    }
    if metrics.exposure_value < -0.5 {
        suggestions.push("画面偏暗，建议提升曝光或提亮阴影".into());
    }
    if metrics.exposure_value > 0.5 {
        suggestions.push("画面偏亮，建议压暗高光保留细节".into());
    }
    if wb < 5000 {
        suggestions.push("色温偏冷，可尝试暖调 LUT 或调整白平衡".into());
    }
    if suggestions.is_empty() {
        suggestions.push("曝光均衡，可直接剪辑".into());
    }

    let prompt_edits = vec![
        PromptEdit {
            prompt: "让画面更电影感".into(),
            action: "apply_cinematic_lut + slight_contrast_boost".into(),
            confidence: 0.82,
        },
        PromptEdit {
            prompt: "提亮人物面部".into(),
            action: "raise_shadows + skin_tone_mask".into(),
            confidence: 0.78,
        },
        PromptEdit {
            prompt: "加快节奏剪短前 2 秒".into(),
            action: "trim_start 2000ms + add_jump_cut".into(),
            confidence: 0.91,
        },
    ];

    let overall_score = (1.0
        - metrics.highlight_clipping
        - (metrics.iso as f32 / 6400.0) * 0.3
        + metrics.shadow_detail * 0.2)
        .clamp(0.0, 1.0);

    AiAnalysisResult {
        metrics,
        suggestions,
        prompt_edits,
        overall_score,
    }
}

pub fn apply_prompt_edit(prompt: &str) -> String {
    let lower = prompt.to_lowercase();
    if lower.contains("渐显") || lower.contains("fade in") {
        "已应用渐显特效（500ms）".into()
    } else if lower.contains("渐隐") || lower.contains("fade out") {
        "已应用渐隐特效（500ms）".into()
    } else if lower.contains("高亮") || lower.contains("highlight") {
        "已应用高亮强调特效".into()
    } else if lower.contains("剪短") || lower.contains("trim") {
        "已根据 Prompt 裁剪片段".into()
    } else if lower.contains("lut") || lower.contains("色彩") || lower.contains("color") {
        "已应用自适应 LUT".into()
    } else if lower.contains("字幕") || lower.contains("subtitle") {
        "已生成多语言字幕轨道".into()
    } else {
        format!("已解析 Prompt「{prompt}」并加入编辑队列")
    }
}

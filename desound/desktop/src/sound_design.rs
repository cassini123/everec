use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StyleMatch {
    pub name: String,
    pub name_zh: String,
    pub similarity: f32,
    pub tags: Vec<String>,
    pub reference: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SoundDesignResult {
    pub keywords: Vec<String>,
    pub mood: String,
    pub similar_styles: Vec<StyleMatch>,
    pub suggestions: Vec<String>,
    pub source: String,
}

const STYLES: &[(&str, &str, &[&str], &str)] = &[
    (
        "Blade Runner 2049",
        "银翼杀手 2049",
        &["synth", "ambient", "reverb", "dark", "drone"],
        "Hans Zimmer · atmospheric",
    ),
    (
        "Ghibli Nature",
        "吉卜力自然系",
        &["organic", "wind", "piano", "gentle", "nature"],
        "Joe Hisaishi · soft orchestral",
    ),
    (
        "A24 Horror",
        "A24 恐怖片",
        &["tension", "silence", "foley", "horror", "minimal"],
        "Hereditary · negative space",
    ),
    (
        "Cyberpunk Neon",
        "赛博朋克霓虹",
        &["electronic", "bass", "city", "night", "cyber"],
        "Cyberpunk 2077 · synthwave",
    ),
    (
        "Documentary Intimate",
        "纪录片亲密感",
        &["voiceover", "warm", "narrative", "documentary", "voice"],
        "Planet Earth · narration",
    ),
    (
        "Wong Kar-wai",
        "王家卫",
        &["melancholy", "jazz", "lonely", "slow", "rain"],
        "In the Mood for Love",
    ),
];

fn extract_keywords(text: &str) -> Vec<String> {
    let lower = text.to_lowercase();
    let dict = [
        "雨", "脚步", "城市", "夜晚", "恐怖", "温暖", "电子", "钢琴", "配音", "预告", "纪录片",
        "赛博", "复古", "紧张", "ambient", "rain", "footstep", "city", "night", "horror", "warm",
        "synth", "piano", "voice", "trailer", "documentary", "cyber", "vintage", "lonely",
    ];
    let mut found: Vec<String> = dict
        .iter()
        .filter(|d| lower.contains(&d.to_lowercase()))
        .map(|d| d.to_string())
        .collect();

    for token in lower.split(|c: char| !c.is_alphanumeric() && c != '_') {
        if token.len() >= 3 && !found.iter().any(|f| f == token) {
            found.push(token.to_string());
        }
    }
    found.truncate(12);
    found
}

fn match_styles(keywords: &[String]) -> Vec<StyleMatch> {
    let lower: Vec<String> = keywords.iter().map(|k| k.to_lowercase()).collect();
    let mut results: Vec<StyleMatch> = STYLES
        .iter()
        .map(|(name, name_zh, tags, reference)| {
            let mut score = 0f32;
            for tag in *tags {
                if lower.iter().any(|k| k.contains(tag) || tag.contains(k.as_str())) {
                    score += 1.0;
                }
            }
            let sim = (score / tags.len() as f32).min(1.0);
            StyleMatch {
                name: name.to_string(),
                name_zh: name_zh.to_string(),
                similarity: sim,
                tags: tags.iter().map(|t| t.to_string()).collect(),
                reference: reference.to_string(),
            }
        })
        .filter(|s| s.similarity > 0.15)
        .collect();

    results.sort_by(|a, b| b.similarity.partial_cmp(&a.similarity).unwrap());
    results.truncate(5);
    results
}

pub fn analyze_local(description: &str) -> SoundDesignResult {
    let keywords = extract_keywords(description);
    let mood = if keywords.iter().any(|k| k.contains("horror") || k.contains("恐怖")) {
        "tense / dark".into()
    } else if keywords.iter().any(|k| k.contains("warm") || k.contains("温暖")) {
        "warm / intimate".into()
    } else if keywords.iter().any(|k| k.contains("rain") || k.contains("雨")) {
        "melancholy / atmospheric".into()
    } else {
        "neutral / exploratory".into()
    };

    SoundDesignResult {
        keywords: keywords.clone(),
        mood,
        similar_styles: match_styles(&keywords),
        suggestions: vec![
            "从素材库导入参考音频建立 mood board".into(),
            "在拟声模块中匹配环境音预设".into(),
            "调整响度轨至 -14 LUFS 作为流媒体参考".into(),
        ],
        source: "local".into(),
    }
}

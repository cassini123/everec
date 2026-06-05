use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColorSwatch {
    pub hex: String,
    pub weight: f32,
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColorSystem {
    pub name: String,
    pub description: String,
    pub palette: Vec<ColorSwatch>,
    pub temperature: f32,
    pub contrast: f32,
    pub saturation: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LutPreset {
    pub id: String,
    pub name: String,
    pub source: String,
    pub color_system: ColorSystem,
    pub lut_cube: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColorAnalysisResult {
    pub dominant_colors: Vec<ColorSwatch>,
    pub color_system: ColorSystem,
    pub suggested_lut: LutPreset,
    pub mood_tags: Vec<String>,
}

/// Analyze image colors from raw RGB samples (simplified k-means style clustering).
pub fn analyze_from_pixels(pixels: &[(u8, u8, u8)]) -> ColorAnalysisResult {
    let mut buckets: Vec<(u32, u32, u32, usize)> = Vec::new();

    for &(r, g, b) in pixels {
        let qr = (r as u32 / 64) * 64;
        let qg = (g as u32 / 64) * 64;
        let qb = (b as u32 / 64) * 64;
        if let Some(bucket) = buckets.iter_mut().find(|(br, bg, bb, _)| *br == qr && *bg == qg && *bb == qb) {
            bucket.3 += 1;
        } else {
            buckets.push((qr, qg, qb, 1));
        }
    }

    buckets.sort_by(|a, b| b.3.cmp(&a.3));
    let total: usize = pixels.len().max(1);
    let dominant: Vec<ColorSwatch> = buckets
        .iter()
        .take(5)
        .map(|(r, g, b, count)| ColorSwatch {
            hex: format!("#{:02x}{:02x}{:02x}", r, g, b),
            weight: *count as f32 / total as f32,
            label: classify_color(*r as u8, *g as u8, *b as u8),
        })
        .collect();

    let avg_r: f32 = pixels.iter().map(|(r, _, _)| *r as f32).sum::<f32>() / total as f32;
    let avg_g: f32 = pixels.iter().map(|(_, g, _)| *g as f32).sum::<f32>() / total as f32;
    let avg_b: f32 = pixels.iter().map(|(_, _, b)| *b as f32).sum::<f32>() / total as f32;

    let temperature = ((avg_r - avg_b) / 255.0).clamp(-1.0, 1.0);
    let contrast = {
        let lum: Vec<f32> = pixels
            .iter()
            .map(|(r, g, b)| 0.299 * *r as f32 + 0.587 * *g as f32 + 0.114 * *b as f32)
            .collect();
        let max = lum.iter().cloned().fold(0.0f32, f32::max);
        let min = lum.iter().cloned().fold(255.0f32, f32::min);
        (max - min) / 255.0
    };
    let saturation = {
        let mut sat_sum = 0.0;
        for &(r, g, b) in pixels {
            let rf = r as f32 / 255.0;
            let gf = g as f32 / 255.0;
            let bf = b as f32 / 255.0;
            let max = rf.max(gf).max(bf);
            let min = rf.min(gf).min(bf);
            sat_sum += if max > 0.0 { (max - min) / max } else { 0.0 };
        }
        sat_sum / total as f32
    };

    let system_name = if temperature > 0.15 {
        "暖调电影感"
    } else if temperature < -0.15 {
        "冷调清冷感"
    } else if saturation < 0.25 {
        "低饱和文艺"
    } else {
        "自然写实"
    };

    let color_system = ColorSystem {
        name: system_name.into(),
        description: format!(
            "色温 {:.0}K 倾向，对比度 {:.0}%，饱和度 {:.0}%",
            6500.0 + temperature * 2000.0,
            contrast * 100.0,
            saturation * 100.0
        ),
        palette: dominant.clone(),
        temperature,
        contrast,
        saturation,
    };

    let mood_tags = derive_mood_tags(temperature, contrast, saturation);

    let lut = LutPreset {
        id: format!("lut-{}", uuid_simple()),
        name: format!("{system_name} 自适应 LUT"),
        source: "photo-analysis".into(),
        color_system: color_system.clone(),
        lut_cube: generate_lut_cube(&dominant, temperature, contrast, saturation),
    };

    ColorAnalysisResult {
        dominant_colors: dominant,
        color_system,
        suggested_lut: lut,
        mood_tags,
    }
}

/// Placeholder for file-based analysis — reads file metadata and returns heuristic result.
pub fn analyze_image_path(path: &Path) -> ColorAnalysisResult {
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("reference");

    let hash = stem.bytes().fold(0u32, |acc, b| acc.wrapping_add(b as u32));
    let r = ((hash >> 16) & 0xFF) as u8;
    let g = ((hash >> 8) & 0xFF) as u8;
    let b = (hash & 0xFF) as u8;

    let mut pixels = Vec::new();
    for i in 0..256 {
        let t = i as f32 / 255.0;
        pixels.push((
            (r as f32 * (1.0 - t) + 255.0 * t) as u8,
            (g as f32 * (1.0 - t) + 128.0 * t) as u8,
            (b as f32 * (1.0 - t) + 64.0 * t) as u8,
        ));
    }
    analyze_from_pixels(&pixels)
}

fn classify_color(r: u8, g: u8, b: u8) -> String {
    if r > 200 && g > 200 && b > 200 {
        "高光".into()
    } else if r < 40 && g < 40 && b < 40 {
        "暗部".into()
    } else if r > g && r > b {
        "暖色".into()
    } else if b > r && b > g {
        "冷色".into()
    } else if g > r && g > b {
        "自然".into()
    } else {
        "中性".into()
    }
}

fn derive_mood_tags(temp: f32, contrast: f32, sat: f32) -> Vec<String> {
    let mut tags = Vec::new();
    if temp > 0.15 {
        tags.push("温暖".into());
    }
    if temp < -0.15 {
        tags.push("清冷".into());
    }
    if contrast > 0.5 {
        tags.push("戏剧".into());
    }
    if sat < 0.3 {
        tags.push("文艺".into());
    }
    if sat > 0.5 {
        tags.push("鲜活".into());
    }
    if tags.is_empty() {
        tags.push("自然".into());
    }
    tags
}

fn generate_lut_cube(
    palette: &[ColorSwatch],
    temperature: f32,
    contrast: f32,
    saturation: f32,
) -> String {
    let mut cube = String::from("TITLE \"Simcut Adaptive LUT\"\nLUT_3D_SIZE 17\n\n");
    for b in 0..17 {
        for g in 0..17 {
            for r in 0..17 {
                let rf = r as f32 / 16.0;
                let gf = g as f32 / 16.0;
                let bf = b as f32 / 16.0;
                let (mut rr, mut gg, mut bb) = (rf, gf, bf);

                rr += temperature * 0.08;
                bb -= temperature * 0.08;
                let mid = 0.5;
                rr = mid + (rr - mid) * (1.0 + contrast * 0.3);
                gg = mid + (gg - mid) * (1.0 + contrast * 0.3);
                bb = mid + (bb - mid) * (1.0 + contrast * 0.3);

                if let Some(primary) = palette.first() {
                    let pr = u8::from_str_radix(&primary.hex[1..3], 16).unwrap_or(128) as f32 / 255.0;
                    let pg = u8::from_str_radix(&primary.hex[3..5], 16).unwrap_or(128) as f32 / 255.0;
                    let pb = u8::from_str_radix(&primary.hex[5..7], 16).unwrap_or(128) as f32 / 255.0;
                    let blend = saturation * 0.15;
                    rr = rr * (1.0 - blend) + pr * blend;
                    gg = gg * (1.0 - blend) + pg * blend;
                    bb = bb * (1.0 - blend) + pb * blend;
                }

                cube.push_str(&format!(
                    "{:.6} {:.6} {:.6}\n",
                    rr.clamp(0.0, 1.0),
                    gg.clamp(0.0, 1.0),
                    bb.clamp(0.0, 1.0)
                ));
            }
        }
    }
    cube
}

fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| format!("{:x}", d.as_nanos()))
        .unwrap_or_else(|_| "0".into())
}

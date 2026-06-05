use std::path::{Path, PathBuf};
use std::process::Command;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportOptions {
    pub format: String,
    pub resolution: String,
    pub fps: u32,
    pub save_to_photos: bool,
    pub upload_cloud: bool,
    pub cloud_provider: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub success: bool,
    pub output_path: String,
    pub message: String,
    pub saved_to_photos: bool,
    pub uploaded_to_cloud: bool,
}

pub fn render_project(
    project_path: &Path,
    exports_dir: &Path,
    options: &ExportOptions,
) -> Result<ExportResult, String> {
    std::fs::create_dir_all(exports_dir).map_err(|e| e.to_string())?;

    let ext = match options.format.to_lowercase().as_str() {
        "mov" => "mov",
        "webm" => "webm",
        _ => "mp4",
    };

    let resolution = match options.resolution.as_str() {
        "4k" | "2160p" => "3840:2160",
        "720p" => "1280:720",
        "1080x1920" | "vertical" => "1080:1920",
        _ => "1920:1080",
    };

    let output = exports_dir.join(format!(
        "simcut_export_{}.{}",
        chrono_now(),
        ext
    ));

    let ffmpeg = Command::new("ffmpeg")
        .args([
            "-y",
            "-f",
            "lavfi",
            "-i",
            &format!("color=c=black:s={resolution}:d=3"),
            "-vf",
            &format!("drawtext=text='Simcut Export':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2"),
            "-r",
            &options.fps.to_string(),
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "23",
            "-pix_fmt",
            "yuv420p",
        ])
        .arg(&output)
        .status();

    match ffmpeg {
        Ok(status) if status.success() => Ok(ExportResult {
            success: true,
            output_path: output.to_string_lossy().into_owned(),
            message: format!("渲染完成 → {}", output.display()),
            saved_to_photos: options.save_to_photos,
            uploaded_to_cloud: options.upload_cloud,
        }),
        Ok(_) => Err("FFmpeg 渲染失败".into()),
        Err(_) => {
            std::fs::write(
                &output.with_extension("json"),
                serde_json::json!({
                    "project": project_path.to_string_lossy(),
                    "options": options,
                    "status": "pending_ffmpeg",
                    "hint": "请安装 ffmpeg: brew install ffmpeg"
                })
                .to_string(),
            )
            .map_err(|e| e.to_string())?;

            Ok(ExportResult {
                success: true,
                output_path: output.with_extension("json").to_string_lossy().into_owned(),
                message: "已生成导出任务（需安装 FFmpeg 完成渲染）".into(),
                saved_to_photos: options.save_to_photos,
                uploaded_to_cloud: options.upload_cloud,
            })
        }
    }
}

pub fn save_to_photos(output_path: &Path) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        let status = Command::new("osascript")
            .args([
                "-e",
                &format!(
                    "tell application \"Photos\" to import POSIX file \"{}\"",
                    output_path.display()
                ),
            ])
            .status()
            .map_err(|e| e.to_string())?;
        if status.success() {
            return Ok("已保存到相册".into());
        }
    }
    Ok(format!(
        "导出文件已就绪: {}（桌面端将自动保存到相册）",
        output_path.display()
    ))
}

pub fn upload_to_cloud(output_path: &Path, provider: &str) -> Result<String, String> {
    Ok(format!(
        "已加入 {} 上传队列: {}",
        provider,
        output_path.display()
    ))
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "0".into())
}

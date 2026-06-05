use std::path::{Path, PathBuf};
use std::process::Command;

fn find_yt_dlp() -> Option<PathBuf> {
    for candidate in [
        "yt-dlp",
        "/usr/local/bin/yt-dlp",
        "/usr/bin/yt-dlp",
        "/home/ubuntu/.local/bin/yt-dlp",
    ] {
        if Command::new(candidate)
            .arg("--version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
        {
            return Some(PathBuf::from(candidate));
        }
    }
    None
}

fn fs_create_dir(dir: &Path) -> Result<(), String> {
    std::fs::create_dir_all(dir).map_err(|e| e.to_string())
}

fn find_newest_audio(dir: &Path) -> Option<PathBuf> {
    let exts = ["mp3", "m4a", "aac", "wav", "flac", "ogg", "opus"];
    let mut files: Vec<PathBuf> = std::fs::read_dir(dir)
        .ok()?
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| {
            p.is_file()
                && p.extension()
                    .and_then(|e| e.to_str())
                    .map(|e| exts.contains(&e.to_lowercase().as_str()))
                    .unwrap_or(false)
        })
        .collect();
    files.sort_by_key(|p| {
        std::fs::metadata(p)
            .and_then(|m| m.modified())
            .unwrap_or(std::time::SystemTime::UNIX_EPOCH)
    });
    files.pop()
}

pub fn download_with_yt_dlp(url: &str, dest_dir: &Path) -> Result<PathBuf, String> {
    let yt_dlp = find_yt_dlp().ok_or("未找到 yt-dlp，请安装: pip install yt-dlp 或 brew install yt-dlp")?;
    fs_create_dir(dest_dir)?;
    let template = dest_dir.join("download.%(ext)s");
    let output = Command::new(&yt_dlp)
        .args([
            "-x",
            "--audio-format",
            "mp3",
            "--audio-quality",
            "0",
            "-o",
            &template.to_string_lossy(),
            "--no-playlist",
            url,
        ])
        .output()
        .map_err(|e| format!("yt-dlp 执行失败: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("音频下载失败: {stderr}"));
    }

    find_newest_audio(dest_dir).ok_or("下载完成但未找到音频文件".into())
}

pub fn check_yt_dlp_available() -> bool {
    find_yt_dlp().is_some()
}

pub fn download_http(url: &str, dest: &Path, referer: Option<&str>) -> Result<(), String> {
    fs_create_dir(dest.parent().unwrap_or(dest))?;
    let mut cmd = Command::new("curl");
    cmd.args([
        "-L",
        "-s",
        "-f",
        "-o",
        &dest.to_string_lossy(),
        url,
        "-H",
        "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    ]);
    if let Some(r) = referer {
        cmd.args(["-H", &format!("Referer: {r}")]);
    }
    let output = cmd.output().map_err(|e| format!("curl 执行失败: {e}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("下载失败: {stderr}"));
    }
    if !dest.exists() || dest.metadata().map(|m| m.len()).unwrap_or(0) == 0 {
        return Err("下载失败: 文件为空".into());
    }
    Ok(())
}

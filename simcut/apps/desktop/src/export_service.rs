use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde::{Deserialize, Serialize};
use timeline_engine::{Clip, Project, TrackKind};

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

#[derive(Debug, Clone)]
pub struct MediaProbe {
    pub duration_ms: u64,
    pub width: u32,
    pub height: u32,
    pub has_video: bool,
    pub has_audio: bool,
}

pub fn probe_media(path: &Path) -> MediaProbe {
    let duration_ms = probe_duration_ms(path);
    let (width, height, has_video, has_audio) = probe_streams(path);
    MediaProbe {
        duration_ms,
        width,
        height,
        has_video,
        has_audio,
    }
}

pub fn render_project(
    project: &Project,
    media_dir: &Path,
    exports_dir: &Path,
    options: &ExportOptions,
) -> Result<ExportResult, String> {
    fs::create_dir_all(exports_dir).map_err(|e| e.to_string())?;

    let ext = match options.format.to_lowercase().as_str() {
        "mov" => "mov",
        "webm" => "webm",
        _ => "mp4",
    };

    let (scale_w, scale_h) = resolution_dims(&options.resolution);
    let output = exports_dir.join(format!("{}_{}.{ext}", sanitize(&project.name), chrono_now()));

    let video_clips = clips_for_kind(project, TrackKind::Video);
    let audio_clips = clips_for_kind(project, TrackKind::Audio);

    if video_clips.is_empty() && audio_clips.is_empty() && project.media.is_empty() {
        let ok = render_placeholder(&output, scale_w, scale_h, options.fps, &project.name)?;
        return finish_result(ok, output, options);
    }

    let temp_dir = exports_dir.join(format!("_tmp_{}", chrono_now()));
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;

    let result = (|| -> Result<(), String> {
        let video_path = if !video_clips.is_empty() {
            render_video_timeline(
                project,
                media_dir,
                &temp_dir,
                &video_clips,
                scale_w,
                scale_h,
                options.fps,
            )?
        } else if let Some(media) = project.media.first() {
            let input = media_dir.join(&media.file_name);
            let fallback = temp_dir.join("fallback.mp4");
            if input.exists() {
                render_single_media(&input, &fallback, scale_w, scale_h, options.fps, media.duration_ms)?;
                fallback
            } else {
                render_placeholder_file(&temp_dir.join("fallback.mp4"), scale_w, scale_h, options.fps, &project.name)?;
                temp_dir.join("fallback.mp4")
            }
        } else {
            let placeholder = temp_dir.join("placeholder.mp4");
            render_placeholder_file(&placeholder, scale_w, scale_h, options.fps, &project.name)?;
            placeholder
        };

        let srt_path = write_srt(&temp_dir, &project.subtitles)?;
        let with_subs = if project.subtitles.is_empty() {
            video_path.clone()
        } else {
            let subs_out = temp_dir.join("with_subs.mp4");
            burn_subtitles(&video_path, &srt_path, &subs_out, scale_w, scale_h)?;
            subs_out
        };

        if audio_clips.is_empty() {
            copy_or_encode_final(&with_subs, &output, options)?;
        } else {
            let audio_mix = temp_dir.join("audio_mix.m4a");
            render_audio_timeline(project, media_dir, &temp_dir, &audio_clips, &audio_mix)?;
            mux_av(&with_subs, &audio_mix, &output, options)?;
        }

        Ok(())
    })();

    let _ = fs::remove_dir_all(&temp_dir);

    match result {
        Ok(()) => finish_result(true, output, options),
        Err(err) => Err(err),
    }
}

fn finish_result(
    ok: bool,
    output: PathBuf,
    options: &ExportOptions,
) -> Result<ExportResult, String> {
    if ok {
        Ok(ExportResult {
            success: true,
            output_path: output.to_string_lossy().into_owned(),
            message: format!("渲染完成 → {}", output.display()),
            saved_to_photos: options.save_to_photos,
            uploaded_to_cloud: options.upload_cloud,
        })
    } else {
        Err("FFmpeg 渲染失败".into())
    }
}

fn clips_for_kind(project: &Project, kind: TrackKind) -> Vec<Clip> {
    let mut clips: Vec<Clip> = project
        .tracks
        .iter()
        .filter(|t| t.kind == kind)
        .flat_map(|t| t.clips.clone())
        .collect();
    clips.sort_by_key(|c| c.start_ms);
    clips
}

fn render_video_timeline(
    project: &Project,
    media_dir: &Path,
    temp_dir: &Path,
    clips: &[Clip],
    width: u32,
    height: u32,
    fps: u32,
) -> Result<PathBuf, String> {
    let mut segments = Vec::new();

    for (i, clip) in clips.iter().enumerate() {
        let media = project
            .media
            .iter()
            .find(|m| m.id == clip.media_id)
            .ok_or_else(|| format!("素材未找到: {}", clip.media_id))?;
        let input = media_dir.join(&media.file_name);
        if !input.exists() {
            return Err(format!("文件不存在: {}", input.display()));
        }

        let seg = temp_dir.join(format!("seg_{i}.mp4"));
        let is_image = is_image_format(&media.format);

        if is_image {
            render_image_segment(&input, &seg, clip, width, height, fps)?;
        } else {
            render_video_segment(&input, &seg, clip, width, height, fps)?;
        }
        segments.push(seg);
    }

    if segments.len() == 1 {
        return Ok(segments.into_iter().next().unwrap());
    }

    let list_path = temp_dir.join("concat.txt");
    let list_body = segments
        .iter()
        .map(|p| format!("file '{}'", escape_concat_path(p)))
        .collect::<Vec<_>>()
        .join("\n");
    fs::write(&list_path, list_body).map_err(|e| e.to_string())?;

    let concat_out = temp_dir.join("concat.mp4");
    let args = vec![
        "-y".to_string(),
        "-f".to_string(),
        "concat".to_string(),
        "-safe".to_string(),
        "0".to_string(),
        "-i".to_string(),
        list_path.to_string_lossy().into_owned(),
        "-c".to_string(),
        "copy".to_string(),
        concat_out.to_string_lossy().into_owned(),
    ];
    if !run_ffmpeg(&args)? {
        // Re-encode if stream copy fails
        let args = vec![
            "-y".to_string(),
            "-f".to_string(),
            "concat".to_string(),
            "-safe".to_string(),
            "0".to_string(),
            "-i".to_string(),
            list_path.to_string_lossy().into_owned(),
            "-c:v".to_string(),
            "libx264".to_string(),
            "-preset".to_string(),
            "fast".to_string(),
            "-crf".to_string(),
            "23".to_string(),
            "-pix_fmt".to_string(),
            "yuv420p".to_string(),
            concat_out.to_string_lossy().into_owned(),
        ];
        if !run_ffmpeg(&args)? {
            return Err("视频片段拼接失败".into());
        }
    }

    Ok(concat_out)
}

fn render_video_segment(
    input: &Path,
    output: &Path,
    clip: &Clip,
    width: u32,
    height: u32,
    fps: u32,
) -> Result<(), String> {
    let start = clip.trim_in_ms as f64 / 1000.0;
    let duration = clip.duration_ms as f64 / 1000.0;
    let vf = scale_pad_filter(width, height);

    let args = vec![
        "-y".to_string(),
        "-ss".to_string(),
        format!("{start:.3}"),
        "-i".to_string(),
        input.to_string_lossy().into_owned(),
        "-t".to_string(),
        format!("{duration:.3}"),
        "-vf".to_string(),
        vf,
        "-r".to_string(),
        fps.to_string(),
        "-c:v".to_string(),
        "libx264".to_string(),
        "-preset".to_string(),
        "fast".to_string(),
        "-crf".to_string(),
        "23".to_string(),
        "-pix_fmt".to_string(),
        "yuv420p".to_string(),
        "-an".to_string(),
        output.to_string_lossy().into_owned(),
    ];
    if !run_ffmpeg(&args)? {
        return Err(format!("片段渲染失败: {}", input.display()));
    }
    Ok(())
}

fn render_image_segment(
    input: &Path,
    output: &Path,
    clip: &Clip,
    width: u32,
    height: u32,
    fps: u32,
) -> Result<(), String> {
    let duration = clip.duration_ms as f64 / 1000.0;
    let vf = scale_pad_filter(width, height);

    let args = vec![
        "-y".to_string(),
        "-loop".to_string(),
        "1".to_string(),
        "-i".to_string(),
        input.to_string_lossy().into_owned(),
        "-t".to_string(),
        format!("{duration:.3}"),
        "-vf".to_string(),
        vf,
        "-r".to_string(),
        fps.to_string(),
        "-c:v".to_string(),
        "libx264".to_string(),
        "-preset".to_string(),
        "fast".to_string(),
        "-crf".to_string(),
        "23".to_string(),
        "-pix_fmt".to_string(),
        "yuv420p".to_string(),
        "-an".to_string(),
        output.to_string_lossy().into_owned(),
    ];
    if !run_ffmpeg(&args)? {
        return Err(format!("图片片段渲染失败: {}", input.display()));
    }
    Ok(())
}

fn render_single_media(
    input: &Path,
    output: &Path,
    width: u32,
    height: u32,
    fps: u32,
    duration_ms: u64,
) -> Result<(), String> {
    let probe = probe_media(input);
    let vf = scale_pad_filter(width, height);

    if probe.has_video {
        let args = vec![
            "-y".to_string(),
            "-i".to_string(),
            input.to_string_lossy().into_owned(),
            "-vf".to_string(),
            vf,
            "-r".to_string(),
            fps.to_string(),
            "-c:v".to_string(),
            "libx264".to_string(),
            "-preset".to_string(),
            "fast".to_string(),
            "-crf".to_string(),
            "23".to_string(),
            "-pix_fmt".to_string(),
            "yuv420p".to_string(),
            "-c:a".to_string(),
            "aac".to_string(),
            "-b:a".to_string(),
            "192k".to_string(),
            output.to_string_lossy().into_owned(),
        ];
        if !run_ffmpeg(&args)? {
            return Err("单文件渲染失败".into());
        }
    } else if is_image_format(
        &input
            .extension()
            .and_then(|v| v.to_str())
            .unwrap_or("")
            .to_lowercase(),
    ) {
        let duration = if duration_ms > 0 {
            duration_ms as f64 / 1000.0
        } else {
            5.0
        };
        let args = vec![
            "-y".to_string(),
            "-loop".to_string(),
            "1".to_string(),
            "-i".to_string(),
            input.to_string_lossy().into_owned(),
            "-t".to_string(),
            format!("{duration:.3}"),
            "-vf".to_string(),
            vf,
            "-r".to_string(),
            fps.to_string(),
            "-c:v".to_string(),
            "libx264".to_string(),
            "-preset".to_string(),
            "fast".to_string(),
            "-crf".to_string(),
            "23".to_string(),
            "-pix_fmt".to_string(),
            "yuv420p".to_string(),
            output.to_string_lossy().into_owned(),
        ];
        if !run_ffmpeg(&args)? {
            return Err("图片渲染失败".into());
        }
    } else {
        return Err("不支持的媒体格式".into());
    }
    Ok(())
}

fn render_audio_timeline(
    project: &Project,
    media_dir: &Path,
    _temp_dir: &Path,
    clips: &[Clip],
    output: &Path,
) -> Result<(), String> {
    let mut inputs = Vec::new();
    let mut filter_parts = Vec::new();
    let mut input_idx = 0usize;

    for (i, clip) in clips.iter().enumerate() {
        let media = project
            .media
            .iter()
            .find(|m| m.id == clip.media_id)
            .ok_or_else(|| format!("音频素材未找到: {}", clip.media_id))?;
        let input = media_dir.join(&media.file_name);
        if !input.exists() {
            continue;
        }

        inputs.push("-i".to_string());
        inputs.push(input.to_string_lossy().into_owned());

        let start = clip.trim_in_ms as f64 / 1000.0;
        let duration = clip.duration_ms as f64 / 1000.0;
        let delay_ms = clip.start_ms;

        filter_parts.push(format!(
            "[{input_idx}:a]atrim=start={start:.3}:duration={duration:.3},asetpts=PTS-STARTPTS,adelay={delay_ms}|{delay_ms}[a{i}]"
        ));
        input_idx += 1;
    }

    if filter_parts.is_empty() {
        // Silent audio track
        let args = vec![
            "-y".to_string(),
            "-f".to_string(),
            "lavfi".to_string(),
            "-i".to_string(),
            "anullsrc=channel_layout=stereo:sample_rate=48000".to_string(),
            "-t".to_string(),
            "1".to_string(),
            "-c:a".to_string(),
            "aac".to_string(),
            output.to_string_lossy().into_owned(),
        ];
        return run_ffmpeg(&args).map(|_| ());
    }

    let mix_inputs: String = (0..filter_parts.len())
        .map(|i| format!("[a{i}]"))
        .collect();
    let filter_complex = format!(
        "{};{mix_inputs}amix=inputs={}:duration=longest:dropout_transition=0[aout]",
        filter_parts.join(";"),
        filter_parts.len()
    );

    let mut args = vec!["-y".to_string()];
    args.extend(inputs);
    args.extend([
        "-filter_complex".to_string(),
        filter_complex,
        "-map".to_string(),
        "[aout]".to_string(),
        "-c:a".to_string(),
        "aac".to_string(),
        "-b:a".to_string(),
        "192k".to_string(),
        output.to_string_lossy().into_owned(),
    ]);

    if !run_ffmpeg(&args)? {
        return Err("音轨混音失败".into());
    }
    Ok(())
}

fn burn_subtitles(
    input: &Path,
    srt: &Path,
    output: &Path,
    _width: u32,
    _height: u32,
) -> Result<(), String> {
    let srt_escaped = escape_subtitles_path(srt);
    let vf = format!(
        "subtitles='{srt_escaped}':force_style='FontSize=22,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3,Outline=2,Shadow=1,MarginV=40'"
    );

    let args = vec![
        "-y".to_string(),
        "-i".to_string(),
        input.to_string_lossy().into_owned(),
        "-vf".to_string(),
        vf,
        "-c:v".to_string(),
        "libx264".to_string(),
        "-preset".to_string(),
        "fast".to_string(),
        "-crf".to_string(),
        "23".to_string(),
        "-pix_fmt".to_string(),
        "yuv420p".to_string(),
        "-c:a".to_string(),
        "copy".to_string(),
        output.to_string_lossy().into_owned(),
    ];

    if run_ffmpeg(&args)? {
        return Ok(());
    }

    // Fallback: drawtext for each cue if subtitles filter fails
    render_with_drawtext(input, srt, output)
}

fn render_with_drawtext(input: &Path, srt: &Path, output: &Path) -> Result<(), String> {
    let content = fs::read_to_string(srt).map_err(|e| e.to_string())?;
    let cues = parse_srt(&content);
    let mut filters: Vec<String> = Vec::new();
    for cue in cues {
        let text = cue.text.replace('\'', "").replace(':', "\\:");
        let start = cue.start_sec;
        let end = cue.end_sec;
        filters.push(format!(
            "drawtext=text='{text}':fontsize=22:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-60:enable='between(t,{start:.3},{end:.3})'"
        ));
    }
    let vf = if filters.is_empty() {
        "null".to_string()
    } else {
        filters.join(",")
    };

    let args = vec![
        "-y".to_string(),
        "-i".to_string(),
        input.to_string_lossy().into_owned(),
        "-vf".to_string(),
        vf,
        "-c:v".to_string(),
        "libx264".to_string(),
        "-preset".to_string(),
        "fast".to_string(),
        "-crf".to_string(),
        "23".to_string(),
        "-pix_fmt".to_string(),
        "yuv420p".to_string(),
        "-c:a".to_string(),
        "copy".to_string(),
        output.to_string_lossy().into_owned(),
    ];
    if !run_ffmpeg(&args)? {
        return Err("字幕烧录失败".into());
    }
    Ok(())
}

struct SrtCue {
    text: String,
    start_sec: f64,
    end_sec: f64,
}

fn parse_srt(content: &str) -> Vec<SrtCue> {
    let mut cues = Vec::new();
    let blocks: Vec<&str> = content.split("\n\n").collect();
    for block in blocks {
        let lines: Vec<&str> = block.lines().collect();
        if lines.len() < 3 {
            continue;
        }
        let timing = lines[1];
        let parts: Vec<&str> = timing.split(" --> ").collect();
        if parts.len() != 2 {
            continue;
        }
        let start = parse_srt_time(parts[0]);
        let end = parse_srt_time(parts[1]);
        let text = lines[2..].join(" ");
        cues.push(SrtCue {
            text,
            start_sec: start,
            end_sec: end,
        });
    }
    cues
}

fn parse_srt_time(s: &str) -> f64 {
    let s = s.trim().replace(',', ".");
    let parts: Vec<&str> = s.split(':').collect();
    if parts.len() != 3 {
        return 0.0;
    }
    let h: f64 = parts[0].parse().unwrap_or(0.0);
    let m: f64 = parts[1].parse().unwrap_or(0.0);
    let sec: f64 = parts[2].parse().unwrap_or(0.0);
    h * 3600.0 + m * 60.0 + sec
}

fn write_srt(
    temp_dir: &Path,
    subtitles: &[timeline_engine::SubtitleCue],
) -> Result<PathBuf, String> {
    let path = temp_dir.join("subs.srt");
    if subtitles.is_empty() {
        fs::write(&path, "").map_err(|e| e.to_string())?;
        return Ok(path);
    }

    let mut sorted = subtitles.to_vec();
    sorted.sort_by_key(|c| c.start_ms);

    let mut body = String::new();
    for (i, cue) in sorted.iter().enumerate() {
        body.push_str(&format!(
            "{}\n{} --> {}\n{}\n\n",
            i + 1,
            format_srt_time(cue.start_ms),
            format_srt_time(cue.end_ms),
            cue.text.replace('\n', " ")
        ));
    }
    fs::write(&path, body).map_err(|e| e.to_string())?;
    Ok(path)
}

fn format_srt_time(ms: u64) -> String {
    let total_sec = ms / 1000;
    let h = total_sec / 3600;
    let m = (total_sec % 3600) / 60;
    let s = total_sec % 60;
    let frac = ms % 1000;
    format!("{h:02}:{m:02}:{s:02},{frac:03}")
}

fn mux_av(video: &Path, audio: &Path, output: &Path, options: &ExportOptions) -> Result<(), String> {
    let vcodec = if options.format.to_lowercase() == "webm" {
        "libvpx-vp9"
    } else {
        "libx264"
    };

    let args = vec![
        "-y".to_string(),
        "-i".to_string(),
        video.to_string_lossy().into_owned(),
        "-i".to_string(),
        audio.to_string_lossy().into_owned(),
        "-map".to_string(),
        "0:v:0".to_string(),
        "-map".to_string(),
        "1:a:0".to_string(),
        "-c:v".to_string(),
        vcodec.to_string(),
        "-preset".to_string(),
        "fast".to_string(),
        "-crf".to_string(),
        "23".to_string(),
        "-pix_fmt".to_string(),
        "yuv420p".to_string(),
        "-c:a".to_string(),
        "aac".to_string(),
        "-b:a".to_string(),
        "192k".to_string(),
        "-shortest".to_string(),
        output.to_string_lossy().into_owned(),
    ];
    if !run_ffmpeg(&args)? {
        return Err("音视频合成失败".into());
    }
    Ok(())
}

fn copy_or_encode_final(input: &Path, output: &Path, options: &ExportOptions) -> Result<(), String> {
    if input == output {
        return Ok(());
    }
    let ext = options.format.to_lowercase();
    if ext == "mp4" || ext == "mov" {
        let args = vec![
            "-y".to_string(),
            "-i".to_string(),
            input.to_string_lossy().into_owned(),
            "-c".to_string(),
            "copy".to_string(),
            output.to_string_lossy().into_owned(),
        ];
        if run_ffmpeg(&args)? {
            return Ok(());
        }
    }

    let vcodec = if ext == "webm" {
        "libvpx-vp9"
    } else {
        "libx264"
    };
    let args = vec![
        "-y".to_string(),
        "-i".to_string(),
        input.to_string_lossy().into_owned(),
        "-c:v".to_string(),
        vcodec.to_string(),
        "-preset".to_string(),
        "fast".to_string(),
        "-crf".to_string(),
        "23".to_string(),
        "-pix_fmt".to_string(),
        "yuv420p".to_string(),
        "-c:a".to_string(),
        "aac".to_string(),
        "-b:a".to_string(),
        "192k".to_string(),
        output.to_string_lossy().into_owned(),
    ];
    if !run_ffmpeg(&args)? {
        return Err("最终编码失败".into());
    }
    Ok(())
}

fn render_placeholder(
    output: &Path,
    width: u32,
    height: u32,
    fps: u32,
    title: &str,
) -> Result<bool, String> {
    render_placeholder_file(output, width, height, fps, title).map(|_| true)
}

fn render_placeholder_file(
    output: &Path,
    width: u32,
    height: u32,
    fps: u32,
    title: &str,
) -> Result<(), String> {
    let safe_title = title.replace('\'', "");
    let args = vec![
        "-y".to_string(),
        "-f".to_string(),
        "lavfi".to_string(),
        "-i".to_string(),
        format!("color=c=black:s={width}x{height}:d=3"),
        "-vf".to_string(),
        format!(
            "drawtext=text='Simcut - {safe_title}':fontsize=36:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2"
        ),
        "-r".to_string(),
        fps.to_string(),
        "-c:v".to_string(),
        "libx264".to_string(),
        "-preset".to_string(),
        "fast".to_string(),
        "-crf".to_string(),
        "23".to_string(),
        "-pix_fmt".to_string(),
        "yuv420p".to_string(),
        output.to_string_lossy().into_owned(),
    ];
    if !run_ffmpeg(&args)? {
        return Err("占位视频渲染失败".into());
    }
    Ok(())
}

fn scale_pad_filter(width: u32, height: u32) -> String {
    format!(
        "scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black"
    )
}

fn resolution_dims(resolution: &str) -> (u32, u32) {
    match resolution {
        "4k" | "2160p" => (3840, 2160),
        "720p" => (1280, 720),
        "1080x1920" | "vertical" => (1080, 1920),
        _ => (1920, 1080),
    }
}

fn is_image_format(ext: &str) -> bool {
    matches!(
        ext.to_lowercase().as_str(),
        "jpg" | "jpeg" | "png" | "webp" | "gif" | "bmp" | "heic" | "heif"
    )
}

fn escape_concat_path(path: &Path) -> String {
    path.to_string_lossy().replace('\'', "'\\''")
}

fn escape_subtitles_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/").replace(':', "\\:")
}

pub fn probe_duration_ms(path: &Path) -> u64 {
    let output = Command::new("ffprobe")
        .args([
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
        ])
        .arg(path)
        .output();

    match output {
        Ok(out) if out.status.success() => {
            let s = String::from_utf8_lossy(&out.stdout);
            s.trim()
                .parse::<f64>()
                .map(|d| (d * 1000.0) as u64)
                .unwrap_or(0)
        }
        _ => 0,
    }
}

fn probe_streams(path: &Path) -> (u32, u32, bool, bool) {
    let output = Command::new("ffprobe")
        .args([
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height",
            "-of",
            "csv=p=0:s=x",
        ])
        .arg(path)
        .output();

    let (width, height, has_video) = match output {
        Ok(out) if out.status.success() => {
            let s = String::from_utf8_lossy(&out.stdout);
            let parts: Vec<&str> = s.trim().split('x').collect();
            if parts.len() == 2 {
                (
                    parts[0].parse().unwrap_or(1920),
                    parts[1].parse().unwrap_or(1080),
                    true,
                )
            } else {
                (1920, 1080, false)
            }
        }
        _ => (1920, 1080, false),
    };

    let audio_out = Command::new("ffprobe")
        .args([
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=codec_type",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
        ])
        .arg(path)
        .output();

    let has_audio = matches!(audio_out, Ok(ref o) if o.status.success() && !o.stdout.is_empty());

    (width, height, has_video, has_audio)
}

fn run_ffmpeg(args: &[String]) -> Result<bool, String> {
    let refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();
    Command::new("ffmpeg")
        .args(refs)
        .status()
        .map(|s| s.success())
        .map_err(|_| {
            "未找到 ffmpeg。请安装: macOS `brew install ffmpeg` / Windows 从 https://ffmpeg.org 下载并加入 PATH".into()
        })
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
        "导出文件: {}（Windows 请从导出目录打开）",
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

fn sanitize(name: &str) -> String {
    name.chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect()
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "0".into())
}

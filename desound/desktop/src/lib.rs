mod audio_service;
mod library_fetch;
mod sound_design;

use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use audio_service::{instrument_slug, resolve_instrument, AudioRequest, AudioService};
use instruments::{catalog, InstrumentCategory, InstrumentDefinition};
use serde::{Deserialize, Serialize};
use library_fetch::{download_http, download_with_yt_dlp};
use sound_design::analyze_local;
use tauri::{Manager, State};
use uuid::Uuid;

pub struct AppState {
    pub audio: AudioService,
    pub library_dir: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstrumentInfo {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub category: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackInfo {
    pub index: usize,
    pub name: String,
    pub instrument: String,
    pub volume: f32,
    pub pan: f32,
    pub muted: bool,
    pub solo: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SoundAsset {
    pub id: String,
    pub name: String,
    pub file_name: String,
    pub format: String,
    pub duration_ms: u32,
    pub tags: Vec<String>,
    pub category: String,
    pub created_at: String,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LibraryManifest {
    version: u32,
    sounds: Vec<SoundAsset>,
}

fn category_label(category: InstrumentCategory) -> &'static str {
    match category {
        InstrumentCategory::Piano => "Piano",
        InstrumentCategory::Bass => "Bass",
        InstrumentCategory::Lead => "Lead",
        InstrumentCategory::Pad => "Pad",
        InstrumentCategory::Strings => "Strings",
        InstrumentCategory::Organ => "Organ",
        InstrumentCategory::Drums => "Drums",
        InstrumentCategory::Guitar => "Guitar",
        InstrumentCategory::Synth => "Synth",
    }
}

fn instrument_to_info(def: &InstrumentDefinition) -> InstrumentInfo {
    InstrumentInfo {
        id: def.slug.to_string(),
        name: def.name.to_string(),
        slug: def.slug.to_string(),
        category: category_label(def.category).to_string(),
        description: def.description.to_string(),
    }
}

fn manifest_path(dir: &Path) -> PathBuf {
    dir.join("library.json")
}

fn ensure_library(dir: &Path) -> Result<(), String> {
    fs::create_dir_all(dir).map_err(|err| err.to_string())?;
    fs::create_dir_all(dir.join("sounds")).map_err(|err| err.to_string())?;
    let path = manifest_path(dir);
    if !path.exists() {
        let manifest = LibraryManifest {
            version: 1,
            sounds: Vec::new(),
        };
        let json = serde_json::to_string_pretty(&manifest).map_err(|err| err.to_string())?;
        fs::write(path, json).map_err(|err| err.to_string())?;
    }
    Ok(())
}

fn read_manifest(dir: &Path) -> Result<LibraryManifest, String> {
    ensure_library(dir)?;
    let raw = fs::read_to_string(manifest_path(dir)).map_err(|err| err.to_string())?;
    serde_json::from_str(&raw).map_err(|err| err.to_string())
}

fn write_manifest(dir: &Path, manifest: &LibraryManifest) -> Result<(), String> {
    let json = serde_json::to_string_pretty(manifest).map_err(|err| err.to_string())?;
    fs::write(manifest_path(dir), json).map_err(|err| err.to_string())
}

fn find_sound<'a>(manifest: &'a LibraryManifest, id: &str) -> Result<&'a SoundAsset, String> {
    manifest
        .sounds
        .iter()
        .find(|s| s.id == id)
        .ok_or_else(|| "sound not found".into())
}

fn ffmpeg_convert(input: &Path, output: &Path, format: &str) -> Result<(), String> {
    let status = Command::new("ffmpeg")
        .args(["-y", "-i"])
        .arg(input)
        .arg(output)
        .status()
        .map_err(|_| "未找到 ffmpeg，请安装: brew install ffmpeg".to_string())?;

    if status.success() {
        Ok(())
    } else {
        Err(format!("ffmpeg 转换 {format} 失败"))
    }
}

#[tauri::command]
fn list_instruments() -> Vec<InstrumentInfo> {
    catalog().iter().map(instrument_to_info).collect()
}

#[tauri::command]
fn init_audio(state: State<'_, AppState>) -> Result<(), String> {
    state.audio.init()
}

#[tauri::command]
fn list_tracks(state: State<'_, AppState>) -> Result<Vec<TrackInfo>, String> {
    Ok(state
        .audio
        .list_tracks()?
        .into_iter()
        .map(
            |(index, name, instrument, volume, pan, muted, solo)| TrackInfo {
                index,
                name,
                instrument: instrument_slug(instrument),
                volume,
                pan,
                muted,
                solo,
            },
        )
        .collect())
}

#[tauri::command]
fn add_track(
    state: State<'_, AppState>,
    name: String,
    instrument: String,
) -> Result<usize, String> {
    let instrument_id = resolve_instrument(&instrument)?;
    state.audio.add_track(name, instrument_id)
}

#[tauri::command]
fn set_track_instrument(
    state: State<'_, AppState>,
    track: usize,
    instrument: String,
) -> Result<(), String> {
    let instrument_id = resolve_instrument(&instrument)?;
    state
        .audio
        .send(AudioRequest::SelectInstrument {
            track,
            instrument: instrument_id,
        })
}

#[tauri::command]
fn set_track_volume(state: State<'_, AppState>, track: usize, volume: f32) -> Result<(), String> {
    state
        .audio
        .send(AudioRequest::SetVolume {
            track,
            volume: volume.clamp(0.0, 1.0),
        })
}

#[tauri::command]
fn set_track_loudness(
    state: State<'_, AppState>,
    track: usize,
    gain_db: f32,
) -> Result<(), String> {
    let volume = 10f32.powf(gain_db / 20.0).clamp(0.0, 1.0);
    state
        .audio
        .send(AudioRequest::SetVolume { track, volume })
}

#[tauri::command]
fn note_on(
    state: State<'_, AppState>,
    track: usize,
    note: u8,
    velocity: f32,
) -> Result<(), String> {
    state
        .audio
        .send(AudioRequest::NoteOn {
            track,
            note,
            velocity,
        })
}

#[tauri::command]
fn note_off(state: State<'_, AppState>, track: usize, note: u8) -> Result<(), String> {
    state.audio.send(AudioRequest::NoteOff { track, note })
}

#[tauri::command]
fn all_notes_off(state: State<'_, AppState>, track: Option<usize>) -> Result<(), String> {
    state.audio.send(AudioRequest::AllNotesOff { track })
}

#[tauri::command]
fn list_library_sounds(state: State<'_, AppState>) -> Result<Vec<SoundAsset>, String> {
    let manifest = read_manifest(&state.library_dir)?;
    Ok(manifest.sounds)
}

#[tauri::command]
fn import_sound(
    state: State<'_, AppState>,
    source_path: String,
    name: Option<String>,
    tags: Option<Vec<String>>,
    category: Option<String>,
) -> Result<SoundAsset, String> {
    ensure_library(&state.library_dir)?;

    let source = PathBuf::from(&source_path);
    if !source.exists() {
        return Err(format!("file not found: {source_path}"));
    }

    let ext = source
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("wav")
        .to_lowercase();

    let id = Uuid::new_v4().to_string();
    let file_name = format!("{id}.{ext}");
    let dest = state.library_dir.join("sounds").join(&file_name);
    fs::copy(&source, &dest).map_err(|err| err.to_string())?;

    let display_name = name.unwrap_or_else(|| {
        source
            .file_stem()
            .and_then(|value| value.to_str())
            .unwrap_or("Untitled")
            .to_string()
    });

    let asset = SoundAsset {
        id: id.clone(),
        name: display_name,
        file_name,
        format: ext,
        duration_ms: 0,
        tags: tags.unwrap_or_default(),
        category: category.unwrap_or_else(|| "imported".into()),
        created_at: chrono_now(),
        source: "import".into(),
    };

    let mut manifest = read_manifest(&state.library_dir)?;
    manifest.sounds.push(asset.clone());
    write_manifest(&state.library_dir, &manifest)?;
    Ok(asset)
}

#[tauri::command]
fn save_foley_sound(
    state: State<'_, AppState>,
    name: String,
    preset_id: String,
    tags: Option<Vec<String>>,
) -> Result<SoundAsset, String> {
    ensure_library(&state.library_dir)?;

    let id = Uuid::new_v4().to_string();
    let meta = serde_json::json!({
        "presetId": preset_id,
        "exportedAt": chrono_now(),
    });
    let file_name = format!("{id}.foley.json");
    fs::write(
        state.library_dir.join("sounds").join(&file_name),
        serde_json::to_string_pretty(&meta).map_err(|err| err.to_string())?,
    )
    .map_err(|err| err.to_string())?;

    let asset = SoundAsset {
        id,
        name,
        file_name,
        format: "foley".into(),
        duration_ms: 0,
        tags: tags.unwrap_or_else(|| vec!["foley".into(), preset_id.clone()]),
        category: "foley".into(),
        created_at: chrono_now(),
        source: "foley".into(),
    };

    let mut manifest = read_manifest(&state.library_dir)?;
    manifest.sounds.push(asset.clone());
    write_manifest(&state.library_dir, &manifest)?;
    Ok(asset)
}

#[tauri::command]
fn delete_sound(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let mut manifest = read_manifest(&state.library_dir)?;
    let Some(index) = manifest.sounds.iter().position(|item| item.id == id) else {
        return Err("sound not found".into());
    };
    let asset = manifest.sounds.remove(index);
    let path = state.library_dir.join("sounds").join(&asset.file_name);
    if path.exists() {
        fs::remove_file(path).map_err(|err| err.to_string())?;
    }
    write_manifest(&state.library_dir, &manifest)?;
    Ok(())
}

#[tauri::command]
fn export_sound(
    state: State<'_, AppState>,
    sound_id: String,
    format: String,
    dest_path: String,
) -> Result<String, String> {
    let manifest = read_manifest(&state.library_dir)?;
    let asset = find_sound(&manifest, &sound_id)?;
    let source = state.library_dir.join("sounds").join(&asset.file_name);

    if !source.exists() {
        return Err("源文件不存在".into());
    }

    let dest = PathBuf::from(&dest_path);
    let target_ext = format.to_lowercase();
    let source_ext = asset.format.to_lowercase();

    if source_ext == target_ext || (target_ext == "wav" && ["wav", "wave"].contains(&source_ext.as_str())) {
        fs::copy(&source, &dest).map_err(|err| err.to_string())?;
        return Ok(format!("导出成功 → {}", dest.display()));
    }

    if ["mp3", "flac", "aac", "wav"].contains(&target_ext.as_str()) {
        ffmpeg_convert(&source, &dest, &target_ext)?;
        return Ok(format!("导出成功 ({target_ext}) → {}", dest.display()));
    }

    fs::copy(&source, &dest).map_err(|err| err.to_string())?;
    Ok(format!("导出成功 → {}", dest.display()))
}

#[tauri::command]
fn analyze_sound_design(description: String) -> sound_design::SoundDesignResult {
    analyze_local(&description)
}

#[tauri::command]
fn get_library_dir(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state.library_dir.to_string_lossy().into_owned())
}

#[tauri::command]
fn import_from_http_url(
    state: State<'_, AppState>,
    url: String,
    name: Option<String>,
    tags: Option<Vec<String>>,
    source_label: Option<String>,
    referer: Option<String>,
    ext: Option<String>,
) -> Result<SoundAsset, String> {
    let temp_dir = state.library_dir.join("temp");
    std::fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;
    let ext = ext
        .as_deref()
        .map(|value| value.trim_start_matches('.').to_ascii_lowercase())
        .filter(|value| value.chars().all(|ch| ch.is_ascii_alphanumeric()))
        .or_else(|| {
            if url.contains(".m4a") {
                Some("m4a".into())
            } else if url.contains(".wav") {
                Some("wav".into())
            } else if url.contains(".ogg") {
                Some("ogg".into())
            } else if url.contains(".flac") {
                Some("flac".into())
            } else {
                None
            }
        })
        .unwrap_or_else(|| "mp3".into());
    let temp_file = temp_dir.join(format!("download_{}.{}", uuid::Uuid::new_v4(), ext));
    download_http(&url, &temp_file, referer.as_deref())?;
    let mut tag_list = tags.unwrap_or_default();
    let category = if tag_list.iter().any(|t| t == "foley") {
        "foley".into()
    } else {
        if !tag_list.contains(&"bgm".to_string()) {
            tag_list.push("bgm".into());
        }
        "music".into()
    };
    let result = import_sound_internal(
        &state.library_dir,
        &temp_file,
        name,
        Some(tag_list),
        Some(category),
        source_label.unwrap_or_else(|| "download".into()),
    );
    let _ = std::fs::remove_file(&temp_file);
    result
}

#[tauri::command]
fn download_media_with_ytdlp(
    state: State<'_, AppState>,
    url: String,
    name: Option<String>,
    tags: Option<Vec<String>>,
    source_label: Option<String>,
) -> Result<SoundAsset, String> {
    let temp_dir = state.library_dir.join("temp");
    let downloaded = download_with_yt_dlp(&url, &temp_dir)?;
    let display_name = name.unwrap_or_else(|| {
        downloaded
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("BGM")
            .to_string()
    });
    let mut tag_list = tags.unwrap_or_default();
    if !tag_list.contains(&"bgm".to_string()) {
        tag_list.push("bgm".into());
    }
    let result = import_sound_internal(
        &state.library_dir,
        &downloaded,
        Some(display_name),
        Some(tag_list),
        Some("music".into()),
        source_label.unwrap_or_else(|| "link".into()),
    );
    let _ = std::fs::remove_dir_all(&temp_dir);
    result
}

#[tauri::command]
fn import_downloaded_file(
    state: State<'_, AppState>,
    source_path: String,
    name: Option<String>,
    tags: Option<Vec<String>>,
    source_label: Option<String>,
) -> Result<SoundAsset, String> {
    let source = PathBuf::from(&source_path);
    let mut tag_list = tags.unwrap_or_default();
    if !tag_list.contains(&"bgm".to_string()) {
        tag_list.push("bgm".into());
    }
    import_sound_internal(
        &state.library_dir,
        &source,
        name,
        Some(tag_list),
        Some("music".into()),
        source_label.unwrap_or_else(|| "search".into()),
    )
}

#[tauri::command]
fn save_temp_audio(
    state: State<'_, AppState>,
    filename: String,
    data: Vec<u8>,
) -> Result<String, String> {
    let temp_dir = state.library_dir.join("temp");
    std::fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;
    let safe_name: String = filename
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' || c == '.' {
                c
            } else {
                '_'
            }
        })
        .collect();
    let path = temp_dir.join(safe_name);
    std::fs::write(&path, data).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
fn delete_temp_file(path: String) -> Result<(), String> {
    let p = PathBuf::from(path);
    if p.exists() {
        std::fs::remove_file(p).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn check_ytdlp() -> bool {
    library_fetch::check_yt_dlp_available()
}

fn import_sound_internal(
    library_dir: &Path,
    source: &Path,
    name: Option<String>,
    tags: Option<Vec<String>>,
    category: Option<String>,
    source_label: String,
) -> Result<SoundAsset, String> {
    ensure_library(library_dir)?;

    if !source.exists() {
        return Err(format!("file not found: {}", source.display()));
    }

    let ext = source
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("mp3")
        .to_lowercase();

    let id = Uuid::new_v4().to_string();
    let file_name = format!("{id}.{ext}");
    let dest = library_dir.join("sounds").join(&file_name);
    fs::copy(source, &dest).map_err(|err| err.to_string())?;

    let display_name = name.unwrap_or_else(|| {
        source
            .file_stem()
            .and_then(|value| value.to_str())
            .unwrap_or("Untitled")
            .to_string()
    });

    let asset = SoundAsset {
        id: id.clone(),
        name: display_name,
        file_name,
        format: ext,
        duration_ms: 0,
        tags: tags.unwrap_or_default(),
        category: category.unwrap_or_else(|| "music".into()),
        created_at: chrono_now(),
        source: source_label,
    };

    let mut manifest = read_manifest(library_dir)?;
    manifest.sounds.push(asset.clone());
    write_manifest(library_dir, &manifest)?;
    Ok(asset)
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    secs.to_string()
}

pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter("desound=info,audio_engine=info")
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let library_dir = app
                .path()
                .app_data_dir()
                .map_err(|err| err.to_string())?
                .join("library");
            if let Err(err) = ensure_library(&library_dir) {
                tracing::warn!("library init: {err}");
            }
            let audio = AudioService::start().map_err(|err| err.to_string())?;
            app.manage(AppState {
                audio,
                library_dir,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_instruments,
            init_audio,
            list_tracks,
            add_track,
            set_track_instrument,
            set_track_volume,
            set_track_loudness,
            note_on,
            note_off,
            all_notes_off,
            list_library_sounds,
            import_sound,
            save_foley_sound,
            delete_sound,
            export_sound,
            analyze_sound_design,
            get_library_dir,
            download_media_with_ytdlp,
            import_from_http_url,
            import_downloaded_file,
            save_temp_audio,
            delete_temp_file,
            check_ytdlp,
        ])
        .run(tauri::generate_context!())
        .expect("error while running desound");
}

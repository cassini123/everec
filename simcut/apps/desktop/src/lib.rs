mod ai_analysis;
mod export_service;
mod project_service;

use std::path::PathBuf;

use color_engine::{analyze_image_path, ColorAnalysisResult};
use export_service::{render_project, save_to_photos, upload_to_cloud, ExportOptions, ExportResult};
use project_service::{ProjectService, ProjectSummary};
use timeline_engine::{
    default_effect_presets, EffectPreset, Project, StillFrame, SubtitleCue,
};
use ai_analysis::{analyze_frame, apply_prompt_edit, AiAnalysisResult};
use tauri::{Manager, State};

pub struct AppState {
    pub projects: ProjectService,
}

#[tauri::command]
fn list_projects(state: State<'_, AppState>) -> Result<Vec<ProjectSummary>, String> {
    state.projects.list_projects()
}

#[tauri::command]
fn create_project(state: State<'_, AppState>, name: String) -> Result<Project, String> {
    state.projects.create_project(name)
}

#[tauri::command]
fn load_project(state: State<'_, AppState>, id: String) -> Result<Project, String> {
    state.projects.load_project(&id)
}

#[tauri::command]
fn save_project(state: State<'_, AppState>, project: Project) -> Result<(), String> {
    state.projects.save_project(&project)
}

#[tauri::command]
fn import_media(
    state: State<'_, AppState>,
    project_id: String,
    source_path: String,
    name: Option<String>,
    tags: Option<Vec<String>>,
) -> Result<timeline_engine::MediaAsset, String> {
    state.projects.import_media(
        &project_id,
        &PathBuf::from(source_path),
        name,
        tags,
    )
}

#[tauri::command]
fn list_effect_presets() -> Vec<EffectPreset> {
    default_effect_presets()
}

#[tauri::command]
fn add_still_frame(
    state: State<'_, AppState>,
    project_id: String,
    media_id: String,
    timestamp_ms: u64,
    label: String,
    tags: Vec<String>,
    color_palette: Vec<String>,
) -> Result<StillFrame, String> {
    state.projects.add_still(
        &project_id,
        media_id,
        timestamp_ms,
        label,
        tags,
        color_palette,
    )
}

#[tauri::command]
fn analyze_color_from_photo(source_path: String) -> ColorAnalysisResult {
    analyze_image_path(&PathBuf::from(source_path))
}

#[tauri::command]
fn save_lut_preset(
    state: State<'_, AppState>,
    lut_cube: String,
    name: String,
) -> Result<String, String> {
    state.projects.ensure()?;
    let path = state
        .projects
        .luts_dir()
        .join(format!("{}.cube", sanitize_filename(&name)));
    std::fs::write(&path, lut_cube).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
fn recognize_subtitles(
    state: State<'_, AppState>,
    project_id: String,
    language: String,
    media_id: Option<String>,
) -> Result<Vec<SubtitleCue>, String> {
    let cues = generate_subtitle_cues(&language, media_id.as_deref());
    state.projects.add_subtitles(&project_id, cues.clone())?;
    Ok(cues)
}

#[tauri::command]
fn analyze_frame_ai(description: String, frame_index: u32) -> AiAnalysisResult {
    analyze_frame(&description, frame_index)
}

#[tauri::command]
fn apply_prompt_edit_command(prompt: String) -> String {
    apply_prompt_edit(&prompt)
}

#[tauri::command]
fn export_project(
    state: State<'_, AppState>,
    project_id: String,
    options: ExportOptions,
) -> Result<ExportResult, String> {
    let project = state.projects.load_project(&project_id)?;
    let result = render_project(
        &project,
        &state.projects.root.join("media"),
        &state.projects.exports_dir(),
        &options,
    )?;

    let mut message = result.message.clone();
    if options.save_to_photos {
        if let Ok(msg) = save_to_photos(PathBuf::from(&result.output_path).as_path()) {
            message.push_str(&format!(" | {msg}"));
        }
    }
    if options.upload_cloud {
        let provider = options.cloud_provider.as_deref().unwrap_or("网盘");
        if let Ok(msg) = upload_to_cloud(
            PathBuf::from(&result.output_path).as_path(),
            provider,
        ) {
            message.push_str(&format!(" | {msg}"));
        }
    }

    Ok(ExportResult {
        message,
        ..result
    })
}

#[tauri::command]
fn get_projects_dir(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state.projects.root.to_string_lossy().into_owned())
}

fn generate_subtitle_cues(language: &str, media_id: Option<&str>) -> Vec<SubtitleCue> {
    let lang_label = match language {
        "zh" | "zh-CN" => "中文",
        "en" => "English",
        "ja" => "日本語",
        "ko" => "한국어",
        _ => language,
    };

    let samples: &[(&str, u64, u64)] = match language {
        "en" => &[
            ("Welcome to Simcut", 0, 2000),
            ("Lightweight editing for short-form", 2000, 4500),
            ("Export and share instantly", 4500, 7000),
        ],
        "ja" => &[
            ("Simcutへようこそ", 0, 2000),
            ("短編向けの軽量編集", 2000, 4500),
            ("すぐに書き出して共有", 4500, 7000),
        ],
        "ko" => &[
            ("Simcut에 오신 것을 환영합니다", 0, 2000),
            ("숏폼을 위한 경량 편집", 2000, 4500),
            ("바로보내고 공유하세요", 4500, 7000),
        ],
        _ => &[
            ("欢迎使用 Simcut", 0, 2000),
            ("超短篇轻量剪辑工具", 2000, 4500),
            ("导出渲染，一键交付", 4500, 7000),
        ],
    };

    samples
        .iter()
        .map(|(text, start, end)| SubtitleCue {
            id: uuid::Uuid::new_v4().to_string(),
            start_ms: *start,
            end_ms: *end,
            text: format!("[{lang_label}] {text}"),
            language: language.into(),
            media_id: media_id.map(str::to_string),
        })
        .collect()
}

fn sanitize_filename(name: &str) -> String {
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

pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter("simcut=info,timeline_engine=info")
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let root = app
                .path()
                .app_data_dir()
                .map_err(|err| err.to_string())?
                .join("simcut");
            let service = ProjectService::new(root);
            if let Err(err) = service.ensure() {
                tracing::warn!("project init: {err}");
            }
            app.manage(AppState { projects: service });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_projects,
            create_project,
            load_project,
            save_project,
            import_media,
            list_effect_presets,
            add_still_frame,
            analyze_color_from_photo,
            save_lut_preset,
            recognize_subtitles,
            analyze_frame_ai,
            apply_prompt_edit_command,
            export_project,
            get_projects_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running simcut");
}

use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use crate::export_service::probe_duration_ms;
use timeline_engine::{MediaAsset, Project, StillFrame, SubtitleCue};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProjectManifest {
    version: u32,
    projects: Vec<ProjectSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSummary {
    pub id: String,
    pub name: String,
    pub duration_ms: u64,
    pub media_count: usize,
    pub updated_at: String,
}

pub struct ProjectService {
    pub root: PathBuf,
}

impl ProjectService {
    pub fn new(root: PathBuf) -> Self {
        Self { root }
    }

    pub fn ensure(&self) -> Result<(), String> {
        fs::create_dir_all(&self.root).map_err(|e| e.to_string())?;
        fs::create_dir_all(self.root.join("projects")).map_err(|e| e.to_string())?;
        fs::create_dir_all(self.root.join("media")).map_err(|e| e.to_string())?;
        fs::create_dir_all(self.root.join("stills")).map_err(|e| e.to_string())?;
        fs::create_dir_all(self.root.join("luts")).map_err(|e| e.to_string())?;
        fs::create_dir_all(self.root.join("exports")).map_err(|e| e.to_string())?;
        let manifest_path = self.root.join("projects.json");
        if !manifest_path.exists() {
            let manifest = ProjectManifest {
                version: 1,
                projects: Vec::new(),
            };
            fs::write(
                &manifest_path,
                serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())?,
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn list_projects(&self) -> Result<Vec<ProjectSummary>, String> {
        self.ensure()?;
        let manifest = self.read_manifest()?;
        Ok(manifest.projects)
    }

    pub fn create_project(&self, name: String) -> Result<Project, String> {
        self.ensure()?;
        let project = Project::new(name);
        self.save_project(&project)?;
        let mut manifest = self.read_manifest()?;
        manifest.projects.push(ProjectSummary {
            id: project.id.clone(),
            name: project.name.clone(),
            duration_ms: project.duration_ms,
            media_count: project.media.len(),
            updated_at: project.updated_at.clone(),
        });
        self.write_manifest(&manifest)?;
        Ok(project)
    }

    pub fn load_project(&self, id: &str) -> Result<Project, String> {
        let path = self.project_path(id);
        if !path.exists() {
            return Err(format!("project not found: {id}"));
        }
        let raw = fs::read_to_string(path).map_err(|e| e.to_string())?;
        serde_json::from_str(&raw).map_err(|e| e.to_string())
    }

    pub fn save_project(&self, project: &Project) -> Result<(), String> {
        self.ensure()?;
        let path = self.project_path(&project.id);
        let json = serde_json::to_string_pretty(project).map_err(|e| e.to_string())?;
        fs::write(path, json).map_err(|e| e.to_string())?;

        let mut manifest = self.read_manifest()?;
        if let Some(summary) = manifest.projects.iter_mut().find(|p| p.id == project.id) {
            summary.name = project.name.clone();
            summary.duration_ms = project.duration_ms;
            summary.media_count = project.media.len();
            summary.updated_at = project.updated_at.clone();
        }
        self.write_manifest(&manifest)?;
        Ok(())
    }

    pub fn import_media(
        &self,
        project_id: &str,
        source_path: &Path,
        name: Option<String>,
        tags: Option<Vec<String>>,
    ) -> Result<MediaAsset, String> {
        if !source_path.exists() {
            return Err(format!("file not found: {}", source_path.display()));
        }

        let ext = source_path
            .extension()
            .and_then(|v| v.to_str())
            .unwrap_or("mp4")
            .to_lowercase();

        let id = Uuid::new_v4().to_string();
        let file_name = format!("{id}.{ext}");
        let dest = self.root.join("media").join(&file_name);
        fs::copy(source_path, &dest).map_err(|e| e.to_string())?;

        let display_name = name.unwrap_or_else(|| {
            source_path
                .file_stem()
                .and_then(|v| v.to_str())
                .unwrap_or("Untitled")
                .to_string()
        });

        let duration_ms = probe_duration_ms(&dest);

        let asset = MediaAsset {
            id: id.clone(),
            name: display_name,
            file_name,
            format: ext,
            duration_ms,
            width: 1920,
            height: 1080,
            tags: tags.unwrap_or_default(),
            created_at: chrono_now(),
        };

        let mut project = self.load_project(project_id)?;

        if duration_ms > 0 {
            let clip = timeline_engine::Clip {
                id: Uuid::new_v4().to_string(),
                track_index: 0,
                media_id: id.clone(),
                start_ms: 0,
                duration_ms,
                trim_in_ms: 0,
                trim_out_ms: duration_ms,
                effect_ids: Vec::new(),
            };
            let _ = project.add_clip(clip);
        }

        project.add_media(asset.clone());
        self.save_project(&project)?;
        Ok(asset)
    }

    pub fn add_still(
        &self,
        project_id: &str,
        media_id: String,
        timestamp_ms: u64,
        label: String,
        tags: Vec<String>,
        color_palette: Vec<String>,
    ) -> Result<StillFrame, String> {
        let still = StillFrame {
            id: Uuid::new_v4().to_string(),
            media_id,
            timestamp_ms,
            label,
            tags,
            color_palette,
        };
        let mut project = self.load_project(project_id)?;
        project.add_still(still.clone());
        self.save_project(&project)?;
        Ok(still)
    }

    pub fn add_subtitles(
        &self,
        project_id: &str,
        cues: Vec<SubtitleCue>,
    ) -> Result<Vec<SubtitleCue>, String> {
        let mut project = self.load_project(project_id)?;
        for cue in &cues {
            project.add_subtitle(cue.clone());
        }
        self.save_project(&project)?;
        Ok(cues)
    }

    pub fn media_path(&self, file_name: &str) -> PathBuf {
        self.root.join("media").join(file_name)
    }

    pub fn exports_dir(&self) -> PathBuf {
        self.root.join("exports")
    }

    pub fn luts_dir(&self) -> PathBuf {
        self.root.join("luts")
    }

    fn project_path(&self, id: &str) -> PathBuf {
        self.root.join("projects").join(format!("{id}.json"))
    }

    fn read_manifest(&self) -> Result<ProjectManifest, String> {
        let raw = fs::read_to_string(self.root.join("projects.json")).map_err(|e| e.to_string())?;
        serde_json::from_str(&raw).map_err(|e| e.to_string())
    }

    fn write_manifest(&self, manifest: &ProjectManifest) -> Result<(), String> {
        fs::write(
            self.root.join("projects.json"),
            serde_json::to_string_pretty(manifest).map_err(|e| e.to_string())?,
        )
        .map_err(|e| e.to_string())
    }
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "0".into())
}

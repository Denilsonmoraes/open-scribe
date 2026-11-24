use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Serialize)]
pub struct SavedProjectFile {
    pub id: String,
    pub json: String,
}

fn sanitize_id(raw: &str) -> Result<String, String> {
    let cleaned: String = raw
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_')
        .collect();
    if cleaned.is_empty() {
        return Err("ID de projeto inválido.".to_string());
    }
    Ok(cleaned)
}

fn sanitize_filename(raw: &str) -> String {
    let cleaned: String = raw
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.' {
                c
            } else {
                '_'
            }
        })
        .collect();
    if cleaned.trim_matches('.').is_empty() {
        "openscribe-video.mp4".to_string()
    } else {
        cleaned
    }
}

fn projects_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Falha ao obter diretório do app: {e}"))?;
    let dir = base.join("projects");
    fs::create_dir_all(&dir).map_err(|e| format!("Falha ao criar pasta projects: {e}"))?;
    Ok(dir)
}

#[tauri::command]
fn save_project_file(app: AppHandle, id: String, json: String) -> Result<String, String> {
    let safe_id = sanitize_id(&id)?;
    let path = projects_dir(&app)?.join(format!("{safe_id}.openscribe.json"));
    fs::write(&path, json).map_err(|e| format!("Erro ao gravar projeto: {e}"))?;
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
fn list_saved_projects(app: AppHandle) -> Result<Vec<SavedProjectFile>, String> {
    let dir = projects_dir(&app)?;
    let mut out = Vec::new();
    let entries = fs::read_dir(&dir).map_err(|e| format!("Erro ao listar projetos: {e}"))?;
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let Some(name) = path.file_name().and_then(|n| n.to_str()) else {
            continue;
        };
        if let Some(id) = name.strip_suffix(".openscribe.json") {
            if let Ok(json) = fs::read_to_string(&path) {
                out.push(SavedProjectFile {
                    id: id.to_string(),
                    json,
                });
            }
        }
    }
    Ok(out)
}

#[tauri::command]
fn load_project_file(app: AppHandle, id: String) -> Result<String, String> {
    let safe_id = sanitize_id(&id)?;
    let path = projects_dir(&app)?.join(format!("{safe_id}.openscribe.json"));
    fs::read_to_string(&path).map_err(|e| format!("Projeto não encontrado: {e}"))
}

#[tauri::command]
fn delete_project_file(app: AppHandle, id: String) -> Result<(), String> {
    let safe_id = sanitize_id(&id)?;
    let path = projects_dir(&app)?.join(format!("{safe_id}.openscribe.json"));
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Erro ao excluir projeto: {e}"))?;
    }
    Ok(())
}

#[tauri::command]
fn save_exported_video(app: AppHandle, filename: String, bytes: Vec<u8>) -> Result<String, String> {
    let safe_name = sanitize_filename(&filename);
    let base_dir = app
        .path()
        .download_dir()
        .or_else(|_| app.path().app_data_dir())
        .map_err(|e| format!("Falha ao localizar pasta de destino: {e}"))?;
    fs::create_dir_all(&base_dir).map_err(|e| format!("Erro ao preparar pasta de saída: {e}"))?;
    let mut dest = base_dir.join(&safe_name);
    if dest.exists() {
        let stem = dest
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("video")
            .to_string();
        let ext = dest
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("mp4")
            .to_string();
        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        dest = base_dir.join(format!("{stem}_{ts}.{ext}"));
    }
    fs::write(&dest, bytes).map_err(|e| format!("Erro ao salvar vídeo exportado: {e}"))?;
    Ok(dest.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_project_file,
            list_saved_projects,
            load_project_file,
            delete_project_file,
            save_exported_video
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao iniciar OpenScribe Studio");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sanitizes_project_ids_safely() {
        assert_eq!(sanitize_id("../etc/passwd").unwrap(), "etcpasswd");
        assert_eq!(sanitize_id("demo-openscribe_1").unwrap(), "demo-openscribe_1");
        assert!(sanitize_id("...///").is_err());
    }

    #[test]
    fn sanitizes_filenames_safely() {
        assert_eq!(sanitize_filename("Meu Video: Final!.mp4"), "Meu_Video__Final_.mp4");
        assert_eq!(sanitize_filename("..."), "openscribe-video.mp4");
    }
}

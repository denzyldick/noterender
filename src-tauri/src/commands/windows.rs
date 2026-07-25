use serde::Serialize;
use tauri::Manager;

#[derive(Debug, Clone, Serialize)]
pub struct MonitorInfo {
    pub name: String,
    pub size: (u32, u32),
    pub position: (i32, i32),
    pub is_primary: bool,
    pub scale_factor: f64,
}

#[tauri::command]
pub fn get_monitors(app: tauri::AppHandle) -> Result<Vec<MonitorInfo>, String> {
    let primary = app.primary_monitor().map_err(|e| e.to_string())?;
    let available = app.available_monitors().map_err(|e| e.to_string())?;

    let mut monitors = Vec::new();

    if let Some(ref p) = primary {
        monitors.push(MonitorInfo {
            name: p.name().cloned().unwrap_or_default(),
            size: (p.size().width, p.size().height),
            position: (p.position().x, p.position().y),
            is_primary: true,
            scale_factor: p.scale_factor(),
        });
    }

    for monitor in available {
        let is_primary = primary.as_ref().map(|p| {
            p.position() == monitor.position() && p.size() == monitor.size()
        }).unwrap_or(false);

        if is_primary {
            continue;
        }

        monitors.push(MonitorInfo {
            name: monitor.name().cloned().unwrap_or_default(),
            size: (monitor.size().width, monitor.size().height),
            position: (monitor.position().x, monitor.position().y),
            is_primary: false,
            scale_factor: monitor.scale_factor(),
        });
    }

    Ok(monitors)
}

#[tauri::command]
pub async fn spawn_visualizer(
    app: tauri::AppHandle,
    monitor_index: usize,
) -> Result<(), String> {
    let monitors = get_monitors(app.clone())?;
    let monitor = monitors
        .get(monitor_index)
        .ok_or_else(|| format!("Monitor index {} out of range (have {})", monitor_index, monitors.len()))?;

    if let Some(win) = app.get_webview_window("visualizer") {
        let _ = win.close();
    }

    let width = monitor.size.0;
    let height = monitor.size.1;
    let x = monitor.position.0;
    let y = monitor.position.1;

    let _visualizer = tauri::WebviewWindowBuilder::new(
        &app,
        "visualizer",
        tauri::WebviewUrl::App("index.html#/visualizer".into()),
    )
    .title("Noterender - Visualizer")
    .inner_size(width as f64, height as f64)
    .position(x as f64, y as f64)
    .resizable(false)
    .decorations(false)
    .skip_taskbar(true)
    .always_on_top(true)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn close_visualizer(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("visualizer") {
        win.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn is_visualizer_open(app: tauri::AppHandle) -> Result<bool, String> {
    Ok(app.get_webview_window("visualizer").is_some())
}

#[tauri::command]
pub async fn toggle_visualizer_fullscreen(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("visualizer") {
        if win.is_fullscreen().map_err(|e| e.to_string())? {
            win.set_fullscreen(false).map_err(|e| e.to_string())?;
            win.set_decorations(false).map_err(|e| e.to_string())?;
        } else {
            win.set_fullscreen(true).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

mod commands;

use parking_lot::Mutex;
use std::sync::Arc;

pub struct FftState {
    pub buffer: Arc<Mutex<Vec<f32>>>,
}

impl FftState {
    pub fn new() -> Self {
        Self {
            buffer: Arc::new(Mutex::new(vec![0.0; 256])),
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(FftState::new())
        .invoke_handler(tauri::generate_handler![
            commands::windows::get_monitors,
            commands::windows::spawn_visualizer,
            commands::windows::close_visualizer,
            commands::windows::is_visualizer_open,
            commands::windows::toggle_visualizer_fullscreen,
            commands::audio::get_audio_output_devices,
            commands::audio::start_system_audio_capture,
            commands::audio::stop_system_audio_capture,
            commands::audio::get_current_fft,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

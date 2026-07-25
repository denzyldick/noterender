mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::windows::get_monitors,
            commands::windows::spawn_visualizer,
            commands::windows::close_visualizer,
            commands::windows::is_visualizer_open,
            commands::windows::toggle_visualizer_fullscreen,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

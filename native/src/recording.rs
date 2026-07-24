use bevy::prelude::*;
use bevy::render::view::screenshot::{Screenshot, ScreenshotCaptured};
use std::io::Write;
use std::process::{Child, Command, Stdio};
use std::sync::mpsc;

#[derive(Resource)]
pub struct RecordingState {
    pub recording: bool,
    pub frame_tx: Option<mpsc::SyncSender<Vec<u8>>>,
    pub ffmpeg: Option<Child>,
    pub width: u32,
    pub height: u32,
}

impl Default for RecordingState {
    fn default() -> Self {
        Self {
            recording: false,
            frame_tx: None,
            ffmpeg: None,
            width: 0,
            height: 0,
        }
    }
}

pub struct RecordingPlugin;

impl Plugin for RecordingPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<RecordingState>()
            .add_systems(Update, (capture_frame_system, poll_ffmpeg_system));
    }
}

fn capture_frame_system(
    mut commands: Commands,
    mut state: ResMut<RecordingState>,
    windows: Query<&Window>,
    window_entities: Res<crate::windows::WindowEntities>,
) {
    if !state.recording {
        return;
    }

    if let Ok(window) = windows.get(window_entities.visualizer) {
        let (w, h) = (window.physical_width(), window.physical_height());
        if w == 0 || h == 0 {
            return;
        }
        state.width = w;
        state.height = h;

        let tx = state.frame_tx.clone();
        commands
            .spawn(Screenshot::window(window_entities.visualizer))
            .observe(move |trigger: Trigger<ScreenshotCaptured>| {
                let image = trigger.event().0.clone();
                let data = image.data;
                if let Some(tx) = &tx {
                    if tx.try_send(data).is_err() {
                        eprintln!("Recording: frame dropped (buffer full)");
                    }
                }
            });
    }
}

fn poll_ffmpeg_system(mut state: ResMut<RecordingState>) {
    if !state.recording {
        return;
    }

    if let Some(ref mut ffmpeg) = state.ffmpeg {
        match ffmpeg.try_wait() {
            Ok(Some(status)) => {
                eprintln!("ffmpeg exited with: {}", status);
                state.recording = false;
                state.ffmpeg = None;
                state.frame_tx = None;
            }
            Ok(None) => {}
            Err(e) => {
                eprintln!("ffmpeg error: {}", e);
                state.recording = false;
                state.ffmpeg = None;
                state.frame_tx = None;
            }
        }
    }
}

pub fn start_recording(state: &mut RecordingState) {
    if state.recording {
        return;
    }

    let w = state.width;
    let h = state.height;
    if w == 0 || h == 0 {
        eprintln!("Recording: invalid dimensions {}x{}", w, h);
        return;
    }

    let filename = format!("noterender_{}.mp4", chrono_timestamp());

    eprintln!("Starting recording: {} ({}x{} @ 30fps)", filename, w, h);

    let mut cmd = Command::new("ffmpeg");
    cmd.arg("-y")
        .arg("-f")
        .arg("rawvideo")
        .arg("-pixel_format")
        .arg("rgba")
        .arg("-video_size")
        .arg(format!("{}x{}", w, h))
        .arg("-framerate")
        .arg("30")
        .arg("-i")
        .arg("pipe:0")
        .arg("-c:v")
        .arg("libx264")
        .arg("-pix_fmt")
        .arg("yuv420p")
        .arg("-preset")
        .arg("ultrafast")
        .arg("-crf")
        .arg("18")
        .arg(&filename);

    match cmd.stdin(Stdio::piped()).stderr(Stdio::piped()).spawn() {
        Ok(mut child) => {
            let stdin = child.stdin.take().unwrap();
            let (tx, rx) = mpsc::sync_channel::<Vec<u8>>(8);

            std::thread::spawn(move || {
                let mut stdin = stdin;
                while let Ok(frame) = rx.recv() {
                    if stdin.write_all(&frame).is_err() {
                        eprintln!("Recording: failed to write frame to ffmpeg");
                        break;
                    }
                }
                drop(stdin);
            });

            state.recording = true;
            state.ffmpeg = Some(child);
            state.frame_tx = Some(tx);
            eprintln!("Recording started -> {}", filename);
        }
        Err(e) => {
            eprintln!("Failed to start ffmpeg: {}", e);
            eprintln!("Make sure ffmpeg is installed and in PATH");
        }
    }
}

pub fn stop_recording(state: &mut RecordingState) {
    if !state.recording {
        return;
    }

    eprintln!("Stopping recording...");
    state.recording = false;
    state.frame_tx = None;

    if let Some(mut ffmpeg) = state.ffmpeg.take() {
        drop(ffmpeg.stdin.take());
        match ffmpeg.wait() {
            Ok(status) => {
                eprintln!("ffmpeg finished: {}", status);
            }
            Err(e) => {
                eprintln!("ffmpeg wait error: {}", e);
            }
        }
    }

    eprintln!("Recording saved");
}

fn chrono_timestamp() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}", now.as_secs())
}

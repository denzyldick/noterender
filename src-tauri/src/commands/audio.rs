use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::SampleFormat;
use parking_lot::Mutex;
use rustfft::{FftPlanner, num_complex::Complex};
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use crate::FftState;

const FFT_SIZE: usize = 512;
const SMOOTHING: f32 = 0.7;

#[derive(Debug, Clone, Serialize)]
pub struct AudioDeviceInfo {
    pub name: String,
    pub is_default: bool,
    pub sample_rate: u32,
    pub channels: u16,
}

struct StreamGuard {
    stream: Option<cpal::Stream>,
}

unsafe impl Send for StreamGuard {}
unsafe impl Sync for StreamGuard {}

static STREAM_GUARD: once_cell::sync::Lazy<Mutex<StreamGuard>> =
    once_cell::sync::Lazy::new(|| Mutex::new(StreamGuard { stream: None }));

fn find_loopback_device(host: &cpal::Host) -> Option<cpal::Device> {
    for device in host.input_devices().ok()? {
        if let Ok(name) = device.name() {
            let lower = name.to_lowercase();
            if lower.contains("loopback")
                || lower.contains("monitor")
                || lower.contains("stereo mix")
                || lower.contains("what u hear")
                || lower.contains("what you hear")
            {
                return Some(device);
            }
        }
    }
    None
}

fn compute_fft(samples: &[f32], output: &mut Vec<f32>) {
    let mut planner = FftPlanner::<f32>::new();
    let fft = planner.plan_fft_forward(FFT_SIZE);

    let mut buffer: Vec<Complex<f32>> = samples
        .iter()
        .take(FFT_SIZE)
        .map(|&s| Complex { re: s, im: 0.0 })
        .collect();

    if buffer.len() < FFT_SIZE {
        buffer.resize(FFT_SIZE, Complex { re: 0.0, im: 0.0 });
    }

    fft.process(&mut buffer);

    let bin_count = FFT_SIZE / 2;
    output.clear();
    for i in 0..bin_count {
        let magnitude = (buffer[i].re * buffer[i].re + buffer[i].im * buffer[i].im).sqrt();
        let normalized = (magnitude / FFT_SIZE as f32).min(1.0);
        let db = 20.0 * normalized.max(1e-10).log10();
        let mapped = ((db + 80.0) / 80.0).clamp(0.0, 1.0);
        output.push(mapped);
    }
}

#[tauri::command]
pub fn get_audio_output_devices() -> Result<Vec<AudioDeviceInfo>, String> {
    let host = cpal::default_host();
    let default_name = host
        .default_output_device()
        .and_then(|d| d.name().ok())
        .unwrap_or_default();

    let mut devices = Vec::new();

    for device in host.output_devices().map_err(|e| e.to_string())? {
        let name = device.name().unwrap_or_default();
        let is_default = name == default_name;
        let config = device.default_output_config().ok();
        devices.push(AudioDeviceInfo {
            name,
            is_default,
            sample_rate: config.as_ref().map(|c| c.sample_rate().0).unwrap_or(44100),
            channels: config.as_ref().map(|c| c.channels()).unwrap_or(2),
        });
    }

    Ok(devices)
}

#[tauri::command]
pub async fn start_system_audio_capture(
    app: AppHandle,
    fft_state: State<'_, FftState>,
) -> Result<(), String> {
    {
        let guard = STREAM_GUARD.lock();
        if guard.stream.is_some() {
            return Ok(());
        }
    }

    let host = cpal::default_host();

    let device = find_loopback_device(&host).or_else(|| host.default_input_device());

    let device = device.ok_or_else(|| {
        "No loopback audio device found. On Linux, ensure PulseAudio/PipeWire is running. \
         On macOS, install BlackHole and select it as a capture device."
            .to_string()
    })?;

    let config = device
        .default_input_config()
        .map_err(|e| e.to_string())?;

    let channels = config.channels() as usize;
    let fft_buffer = fft_state.buffer.clone();
    let app_handle = app.clone();
    let mut sample_accumulator: Vec<f32> = Vec::with_capacity(FFT_SIZE);
    let mut smoothed = vec![0.0f32; FFT_SIZE / 2];

    let stream = match config.sample_format() {
        SampleFormat::F32 => {
            device.build_input_stream(
                &config.into(),
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    let mono: Vec<f32> = data
                        .chunks(channels)
                        .map(|frame| frame.iter().sum::<f32>() / channels as f32)
                        .collect();

                    sample_accumulator.extend_from_slice(&mono);

                    while sample_accumulator.len() >= FFT_SIZE {
                        let chunk: Vec<f32> = sample_accumulator.drain(..FFT_SIZE).collect();
                        let mut fft_output = vec![0.0f32; FFT_SIZE / 2];
                        compute_fft(&chunk, &mut fft_output);

                        let mut buf = fft_buffer.lock();
                        for (i, &val) in fft_output.iter().enumerate() {
                            if i < smoothed.len() {
                                smoothed[i] = SMOOTHING * smoothed[i] + (1.0 - SMOOTHING) * val;
                                if i < buf.len() {
                                    buf[i] = smoothed[i];
                                }
                            }
                        }
                    }

                    let buf = fft_buffer.lock();
                    let _ = app_handle.emit("audio-fft", buf.clone());
                },
                |err| eprintln!("Audio capture error: {err}"),
                None,
            )
        }
        SampleFormat::I16 => {
            device.build_input_stream(
                &config.into(),
                move |data: &[i16], _: &cpal::InputCallbackInfo| {
                    let mono: Vec<f32> = data
                        .chunks(channels)
                        .map(|frame| {
                            frame.iter().map(|&s| s as f32 / i16::MAX as f32).sum::<f32>()
                                / channels as f32
                        })
                        .collect();

                    sample_accumulator.extend_from_slice(&mono);

                    while sample_accumulator.len() >= FFT_SIZE {
                        let chunk: Vec<f32> = sample_accumulator.drain(..FFT_SIZE).collect();
                        let mut fft_output = vec![0.0f32; FFT_SIZE / 2];
                        compute_fft(&chunk, &mut fft_output);

                        let mut buf = fft_buffer.lock();
                        for (i, &val) in fft_output.iter().enumerate() {
                            if i < smoothed.len() {
                                smoothed[i] = SMOOTHING * smoothed[i] + (1.0 - SMOOTHING) * val;
                                if i < buf.len() {
                                    buf[i] = smoothed[i];
                                }
                            }
                        }
                    }

                    let buf = fft_buffer.lock();
                    let _ = app_handle.emit("audio-fft", buf.clone());
                },
                |err| eprintln!("Audio capture error: {err}"),
                None,
            )
        }
        fmt => {
            return Err(format!("Unsupported sample format: {fmt:?}"));
        }
    }
    .map_err(|e| e.to_string())?;

    stream.play().map_err(|e| e.to_string())?;

    {
        let mut guard = STREAM_GUARD.lock();
        guard.stream = Some(stream);
    }

    Ok(())
}

#[tauri::command]
pub async fn stop_system_audio_capture() -> Result<(), String> {
    let mut guard = STREAM_GUARD.lock();
    guard.stream = None;
    Ok(())
}

#[tauri::command]
pub fn get_current_fft(fft_state: State<'_, FftState>) -> Result<Vec<f32>, String> {
    Ok(fft_state.buffer.lock().clone())
}

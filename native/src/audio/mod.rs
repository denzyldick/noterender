use bevy::prelude::*;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use crossbeam_channel::{Receiver, Sender};
use std::thread;

use crate::config::Config;

pub struct AudioPlugin;

impl Plugin for AudioPlugin {
    fn build(&self, app: &mut App) {
        let fft_size = 512;
        let (tx, rx) = crossbeam_channel::unbounded();
        let state = AudioState::new(fft_size);
        app.insert_resource(state);
        app.insert_resource(AudioChannel(rx));
        app.add_systems(Update, update_audio);

        if std::env::var_os("NOTERENDER_HEADLESS").is_none() {
            thread::spawn(move || {
                start_capture(tx);
            });
        }
    }
}

#[derive(Resource)]
pub struct AudioState {
    pub fft: Vec<f32>,
    pub bass: f32,
    pub punch_bass: f32,
    pub treble: f32,
    pub smoothed_bass: f32,
    pub fft_size: usize,
}

impl AudioState {
    pub fn new(fft_size: usize) -> Self {
        Self {
            fft: vec![0.0; fft_size / 2],
            bass: 0.0,
            punch_bass: 0.0,
            treble: 0.0,
            smoothed_bass: 0.0,
            fft_size,
        }
    }
}

#[derive(Resource)]
pub struct AudioChannel(pub Receiver<Vec<f32>>);

fn update_audio(mut state: ResMut<AudioState>, channel: Res<AudioChannel>, config: Res<Config>) {
    while let Ok(samples) = channel.0.try_recv() {
        let half = state.fft_size / 2;
        let n = state.fft_size as f32;

        let mut buffer = vec![0.0_f32; state.fft_size];
        let copy_len = samples.len().min(state.fft_size);
        for i in 0..copy_len {
            buffer[i] = samples[i];
        }

        let mut real = vec![0.0_f32; half];
        let mut imag = vec![0.0_f32; half];

        for k in 0..half {
            let mut sum_re = 0.0;
            let mut sum_im = 0.0;
            for t in 0..state.fft_size {
                let angle = -2.0 * std::f32::consts::PI * k as f32 * t as f32 / n;
                let val = buffer[t];
                sum_re += val * angle.cos();
                sum_im += val * angle.sin();
            }
            real[k] = sum_re / n;
            imag[k] = sum_im / n;
        }

        let smoothing = config.sensitivity.fft_smoothing.clamp(0.0, 0.99);
        for i in 0..half.min(state.fft.len()) {
            let magnitude = (real[i] * real[i] + imag[i] * imag[i]).sqrt().min(1.0);
            state.fft[i] = state.fft[i] * smoothing + magnitude * (1.0 - smoothing);
        }

        let len = state.fft.len();
        if len > 0 {
            let bass_end = (10).min(len);
            let mut bass_sum = 0.0;
            for i in 0..bass_end {
                bass_sum += state.fft[i];
            }
            let mut bass = bass_sum / bass_end as f32;
            bass *= config.sensitivity.bass_boost.max(0.0);
            state.bass = bass.min(1.0);
            state.punch_bass = state.bass.powf(1.5);

            let treble_start = len.saturating_sub(20);
            let treble_count = (len - treble_start).max(1);
            let mut treble_sum = 0.0;
            for i in treble_start..len {
                treble_sum += state.fft[i];
            }
            state.treble = treble_sum / treble_count as f32;

            state.smoothed_bass += (state.bass - state.smoothed_bass) * 0.15;
        }
    }
}

fn start_capture(tx: Sender<Vec<f32>>) {
    let host = cpal::default_host();
    let device = match host.default_input_device() {
        Some(d) => d,
        None => {
            eprintln!("No audio input device found");
            return;
        }
    };
    let config = match device.default_input_config() {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Audio config error: {}", e);
            return;
        }
    };
    let channels = config.channels() as usize;
    let err_fn = |e: cpal::StreamError| eprintln!("Audio stream error: {}", e);

    let stream_config = config.config();
    let result: Result<cpal::Stream, cpal::BuildStreamError> = match config.sample_format() {
        cpal::SampleFormat::F32 => {
            let tx = tx.clone();
            device.build_input_stream(
                &stream_config,
                move |d: &[f32], _| {
                    let mut s = Vec::with_capacity(d.len() / channels);
                    for chunk in d.chunks(channels) {
                        if let Some(&v) = chunk.first() {
                            s.push(v);
                        }
                    }
                    let _ = tx.send(s);
                },
                err_fn,
                None,
            )
        }
        cpal::SampleFormat::I16 => {
            let tx = tx.clone();
            device.build_input_stream(
                &stream_config,
                move |d: &[i16], _| {
                    let mut s = Vec::with_capacity(d.len() / channels);
                    for chunk in d.chunks(channels) {
                        if let Some(&v) = chunk.first() {
                            s.push(v as f32 / 32768.0);
                        }
                    }
                    let _ = tx.send(s);
                },
                err_fn,
                None,
            )
        }
        cpal::SampleFormat::U16 => {
            let tx = tx.clone();
            device.build_input_stream(
                &stream_config,
                move |d: &[u16], _| {
                    let mut s = Vec::with_capacity(d.len() / channels);
                    for chunk in d.chunks(channels) {
                        if let Some(&v) = chunk.first() {
                            s.push(v as f32 / 65535.0);
                        }
                    }
                    let _ = tx.send(s);
                },
                err_fn,
                None,
            )
        }
        _ => return,
    };

    if let Ok(stream) = result {
        let _ = stream.play();
        println!("Audio capture started");
        loop {
            thread::sleep(std::time::Duration::from_secs(60));
        }
    }
}

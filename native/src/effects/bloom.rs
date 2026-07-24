use bevy::core_pipeline::bloom::Bloom;
use bevy::prelude::*;

use crate::audio::AudioState;
use crate::camera::MainCameraMarker;
use crate::config::Config;

#[derive(Resource, Default)]
pub struct BloomState {
    pub intensity: f32,
}

pub fn bloom_system(
    mut state: ResMut<BloomState>,
    audio: Res<AudioState>,
    config: Res<Config>,
    mut cameras: Query<&mut Bloom, With<MainCameraMarker>>,
) {
    if !config.active_effects.iter().any(|e| e == "bloom") {
        state.intensity = 0.0;
    } else {
        state.intensity = (0.3 + audio.bass * 0.7).min(1.0);
    }

    for mut bloom in &mut cameras {
        bloom.intensity = state.intensity;
    }
}

use bevy::prelude::*;

use crate::audio::AudioState;
use crate::components::lights::BaseIntensity;
use crate::config::Config;

#[derive(Resource, Default)]
pub struct BloomState {
    pub intensity: f32,
}

pub fn bloom_system(
    mut state: ResMut<BloomState>,
    audio: Res<AudioState>,
    config: Res<Config>,
    mut lights: Query<(&mut PointLight, &BaseIntensity)>,
) {
    if !config.active_effects.iter().any(|e| e == "bloom") {
        state.intensity = 0.0;
    } else {
        state.intensity = (0.6 + audio.bass * 1.2).min(3.0);
    }

    for (mut light, base) in &mut lights {
        light.intensity = base.0 * (1.0 + state.intensity);
    }
}

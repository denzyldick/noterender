use bevy::prelude::*;

use crate::config::Config;

#[derive(Resource, Default)]
pub struct VignetteState {
    pub strength: f32,
}

pub fn vignette_system(
    mut state: ResMut<VignetteState>,
    config: Res<Config>,
    mut clear_color: ResMut<ClearColor>,
) {
    if !config.active_effects.iter().any(|e| e == "vignette") {
        state.strength = 0.0;
        return;
    }

    state.strength = 0.16;
    clear_color.0 = Color::srgb(
        0.02 * (1.0 - state.strength),
        0.02 * (1.0 - state.strength),
        0.04 * (1.0 - state.strength),
    );
}

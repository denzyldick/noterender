mod bloom;
mod grid;
mod scene;
mod thunder;
mod vignette;

use bevy::prelude::*;
use bloom::*;
use grid::*;
use scene::*;
use thunder::*;
use vignette::*;

pub struct EffectsPlugin;

impl Plugin for EffectsPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<ThunderState>()
            .init_resource::<GridState>()
            .init_resource::<BloomState>()
            .init_resource::<SceneEffectsState>()
            .init_resource::<VignetteState>()
            .add_systems(
                Update,
                (
                    thunder_system,
                    grid_system,
                    bloom_system,
                    scene_effects_system,
                    vignette_system,
                ),
            );
    }
}

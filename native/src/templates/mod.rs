pub mod advanced;
pub mod common;
pub mod solaris;
pub mod terrain;
pub mod trap;

use bevy::prelude::*;

pub struct TemplatePlugin;

impl Plugin for TemplatePlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(
            Update,
            (
                trap::trap_render_system,
                solaris::solaris_render_system,
                terrain::terrain_render_system,
                advanced::render_system,
            ),
        );
    }
}

#[derive(Component)]
pub struct TemplateMarker;

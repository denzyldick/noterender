use bevy::prelude::*;

use crate::audio::AudioState;
use crate::config::Config;

#[derive(Resource, Default)]
pub struct ThunderState {
    pub flash_entity: Option<Entity>,
    pub remaining: f32,
    pub prev_bass: f32,
}

pub fn thunder_system(
    mut state: ResMut<ThunderState>,
    audio: Res<AudioState>,
    config: Res<Config>,
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    time: Res<Time>,
    flash_query: Query<Entity>,
) {
    if !config.active_effects.contains(&"thunder".to_string()) {
        if let Some(e) = state.flash_entity.take() {
            if flash_query.get(e).is_ok() {
                commands.entity(e).despawn();
            }
        }
        state.remaining = 0.0;
        return;
    }

    let bass = audio.bass;
    let dt = time.delta_secs_f64() as f32;
    state.remaining -= dt;

    if state.remaining <= 0.0 {
        if let Some(e) = state.flash_entity.take() {
            if flash_query.get(e).is_ok() {
                commands.entity(e).despawn();
            }
        }
    }

    if bass > 0.6 && state.prev_bass <= 0.6 && state.flash_entity.is_none() {
        let e = commands
            .spawn((
                Mesh3d(meshes.add(Cuboid::from_size(Vec3::new(2000.0, 1.0, 2000.0)))),
                MeshMaterial3d(materials.add(StandardMaterial {
                    base_color: Color::srgb(1.0, 0.8, 0.4),
                    unlit: true,
                    ..default()
                })),
                Transform::from_xyz(0.0, 0.0, 0.0),
            ))
            .id();
        state.flash_entity = Some(e);
        state.remaining = 0.12;
    }

    state.prev_bass = bass;
}

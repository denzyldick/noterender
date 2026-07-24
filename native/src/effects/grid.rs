use bevy::prelude::*;

use crate::audio::AudioState;
use crate::config::Config;
use crate::templates::TemplateMarker;

#[derive(Resource, Default)]
pub struct GridState {
    pub opacity: f32,
    pub entities: Vec<Entity>,
    pub material: Option<Handle<StandardMaterial>>,
}

pub fn grid_system(
    mut state: ResMut<GridState>,
    audio: Res<AudioState>,
    config: Res<Config>,
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    query: Query<Entity>,
) {
    let active = config.active_effects.iter().any(|e| e == "grid");
    if !active {
        state.opacity = 0.0;
        if !state.entities.is_empty() {
            for e in state.entities.drain(..) {
                if query.get(e).is_ok() {
                    commands.entity(e).despawn_recursive();
                }
            }
        }
        return;
    }

    if state.entities.is_empty() {
        let material = materials.add(StandardMaterial {
            base_color: Color::srgba(0.35, 0.85, 1.0, 0.15),
            unlit: true,
            alpha_mode: AlphaMode::Blend,
            ..default()
        });
        let line_mesh = meshes.add(Cuboid::from_size(Vec3::new(1.0, 1.0, 1.0)));
        for i in -12..=12 {
            let x = i as f32 * 45.0;
            let line_x = commands
                .spawn((
                    Mesh3d(line_mesh.clone()),
                    MeshMaterial3d(material.clone()),
                    Transform::from_xyz(x, -110.0, 0.0)
                        .with_scale(Vec3::new(1.0, 1.0, 1200.0)),
                    TemplateMarker,
                ))
                .id();
            let z = i as f32 * 45.0;
            let line_z = commands
                .spawn((
                    Mesh3d(line_mesh.clone()),
                    MeshMaterial3d(material.clone()),
                    Transform::from_xyz(0.0, -110.0, z)
                        .with_scale(Vec3::new(1200.0, 1.0, 1.0)),
                    TemplateMarker,
                ))
                .id();
            state.entities.push(line_x);
            state.entities.push(line_z);
        }
        state.material = Some(material);
    }

    state.opacity = (audio.bass * 0.5).max(0.05);
    if let Some(handle) = &state.material {
        if let Some(mat) = materials.get_mut(handle) {
            mat.base_color = Color::srgba(0.35, 0.85, 1.0, state.opacity * 0.35);
        }
    }
}

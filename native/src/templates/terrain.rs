use bevy::prelude::*;
use bevy::render::mesh::{Indices, PrimitiveTopology};
use bevy::render::render_asset::RenderAssetUsages;
use rand::Rng;

use crate::audio::AudioState;
use crate::config::Config;
use crate::templates::TemplateMarker;

#[derive(Resource)]
pub struct TerrainState {
    pub t: f32,
    pub ground: Entity,
    pub ground_mat: Handle<StandardMaterial>,
    pub sun: Entity,
    pub sun_mat: Handle<StandardMaterial>,
}

pub fn init(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    config: &Config,
) {
    let (pr, pg, pb) = (
        config.colors.r / 255.0,
        config.colors.g / 255.0,
        config.colors.b / 255.0,
    );
    let (lr, lg, lb) = (
        config.light.r / 255.0,
        config.light.g / 255.0,
        config.light.b / 255.0,
    );
    let template = &config.templates.terrain;

    let subdivisions = 100;
    let size = 1000.0;
    let step = size / subdivisions as f32;
    let mut pos = Vec::new();
    let mut indices = Vec::new();
    let mut normals = Vec::new();
    let mut uvs = Vec::new();

    for z in 0..=subdivisions {
        for x in 0..=subdivisions {
            let px = -size / 2.0 + x as f32 * step;
            let pz = -size / 2.0 + z as f32 * step;
            let py = (rand::thread_rng().gen::<f32>() - 0.5) * template.roughness;
            pos.push([px, py, pz]);
            normals.push([0.0, 1.0, 0.0]);
            uvs.push([
                x as f32 / subdivisions as f32,
                z as f32 / subdivisions as f32,
            ]);
        }
    }
    for z in 0..subdivisions {
        for x in 0..subdivisions {
            let tl = z * (subdivisions + 1) + x;
            let tr = tl + 1;
            let bl = (z + 1) * (subdivisions + 1) + x;
            let br = bl + 1;
            indices.extend_from_slice(&[
                tl as u32, bl as u32, tr as u32, tr as u32, bl as u32, br as u32,
            ]);
        }
    }

    let mut mesh = Mesh::new(
        PrimitiveTopology::TriangleList,
        RenderAssetUsages::default(),
    );
    mesh.insert_attribute(Mesh::ATTRIBUTE_POSITION, pos);
    mesh.insert_attribute(Mesh::ATTRIBUTE_NORMAL, normals);
    mesh.insert_attribute(Mesh::ATTRIBUTE_UV_0, uvs);
    mesh.insert_indices(Indices::U32(indices));
    let ground_mesh = meshes.add(mesh);

    let ground_mat = materials.add(StandardMaterial {
        base_color: Color::srgb(pr * 0.5, pg * 0.5, pb * 0.5),
        unlit: true,
        ..default()
    });
    let ground = commands
        .spawn((
            Mesh3d(ground_mesh),
            MeshMaterial3d(ground_mat.clone()),
            Transform::from_xyz(0.0, -100.0, 0.0),
            TemplateMarker,
        ))
        .id();

    let sun_mat = materials.add(StandardMaterial {
        base_color: Color::srgb(lr * 0.8, lg * 0.8, lb * 0.8),
        unlit: true,
        ..default()
    });
    let sun = commands
        .spawn((
            Mesh3d(meshes.add(Sphere::new(50.0).mesh().ico(8).unwrap())),
            MeshMaterial3d(sun_mat.clone()),
            Transform::from_xyz(0.0, 300.0, -500.0),
            TemplateMarker,
        ))
        .id();

    commands.insert_resource(TerrainState {
        t: 0.0,
        ground,
        ground_mat,
        sun,
        sun_mat,
    });
}

pub fn terrain_render_system(
    state: Option<ResMut<TerrainState>>,
    audio: Res<AudioState>,
    config: Res<Config>,
    _time: Res<Time>,
    mut transforms: Query<&mut Transform>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    let mut state = match state {
        Some(s) => s,
        None => return,
    };

    state.t += 0.01;
    let bass = audio.bass;
    let treble = audio.treble;
    let (pr, pg, pb) = (
        config.colors.r / 255.0,
        config.colors.g / 255.0,
        config.colors.b / 255.0,
    );
    let (lr, lg, lb) = (
        config.light.r / 255.0,
        config.light.g / 255.0,
        config.light.b / 255.0,
    );
    let template = &config.templates.terrain;

    if let Ok(mut t) = transforms.get_mut(state.ground) {
        t.translation.z = (state.t * 100.0) % 200.0 - 100.0;
        t.translation.y = -100.0 + bass * (template.roughness * 0.5);
    }
    if let Some(mat) = materials.get_mut(&state.ground_mat) {
        mat.base_color = Color::srgb(
            pr * (0.3 + treble * 0.7),
            pg * (0.3 + treble * 0.7),
            pb * (0.3 + treble * 0.7),
        );
    }
    if let Ok(mut t) = transforms.get_mut(state.sun) {
        t.scale = Vec3::splat(1.0 + bass * 0.3);
    }
    if let Some(mat) = materials.get_mut(&state.sun_mat) {
        mat.base_color = Color::srgb(lr * (0.5 + bass), lg * (0.5 + bass), lb * (0.5 + bass));
    }
}

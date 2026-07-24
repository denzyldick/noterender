use bevy::prelude::*;
use rand::Rng;

use crate::audio::AudioState;
use crate::camera::MainCameraMarker;
use crate::config::Config;
use crate::templates::TemplateMarker;

#[derive(Resource, Default)]
pub struct SceneEffectsState {
    smoke: Vec<Entity>,
    birds: Vec<Entity>,
    fireflies: Vec<Entity>,
    rain: Vec<Entity>,
    shockwave: Option<Entity>,
    lasers: Vec<Entity>,
    dust: Vec<Entity>,
    crystals: Vec<Entity>,
    glitch_phase: f32,
}

pub fn scene_effects_system(
    mut state: ResMut<SceneEffectsState>,
    audio: Res<AudioState>,
    config: Res<Config>,
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    mut transforms: Query<&mut Transform, Without<MainCameraMarker>>,
    mut clear_color: ResMut<ClearColor>,
    mut camera: Query<&mut Transform, With<MainCameraMarker>>,
    query: Query<Entity>,
) {
    sync_set(
        &mut state.smoke,
        "smoke",
        40,
        &config,
        &mut commands,
        &mut meshes,
        &mut materials,
        |commands, meshes, materials| spawn_smoke(commands, meshes, materials),
        &query,
    );
    sync_set(
        &mut state.birds,
        "birds",
        10,
        &config,
        &mut commands,
        &mut meshes,
        &mut materials,
        |commands, meshes, materials| spawn_birds(commands, meshes, materials),
        &query,
    );
    sync_set(
        &mut state.fireflies,
        "fireflies",
        60,
        &config,
        &mut commands,
        &mut meshes,
        &mut materials,
        |commands, meshes, materials| spawn_fireflies(commands, meshes, materials),
        &query,
    );
    sync_set(
        &mut state.rain,
        "rain",
        180,
        &config,
        &mut commands,
        &mut meshes,
        &mut materials,
        |commands, meshes, materials| spawn_rain(commands, meshes, materials),
        &query,
    );
    sync_one(
        &mut state.shockwave,
        "shockwave",
        &config,
        &mut commands,
        &mut meshes,
        &mut materials,
        |commands, meshes, materials| spawn_shockwave(commands, meshes, materials),
        &query,
    );
    sync_set(
        &mut state.lasers,
        "lasers",
        8,
        &config,
        &mut commands,
        &mut meshes,
        &mut materials,
        |commands, meshes, materials| spawn_lasers(commands, meshes, materials),
        &query,
    );
    sync_set(
        &mut state.dust,
        "dust",
        120,
        &config,
        &mut commands,
        &mut meshes,
        &mut materials,
        |commands, meshes, materials| spawn_dust(commands, meshes, materials),
        &query,
    );
    sync_set(
        &mut state.crystals,
        "crystals",
        32,
        &config,
        &mut commands,
        &mut meshes,
        &mut materials,
        |commands, meshes, materials| spawn_crystals(commands, meshes, materials),
        &query,
    );

    let bass = audio.bass * config.sensitivity.bass_boost.max(0.0);
    let treble = audio.treble;

    update_smoke(&state.smoke, bass, &mut transforms, &query);
    update_birds(
        &state.birds,
        bass,
        &mut transforms,
        &query,
        state.glitch_phase,
    );
    update_fireflies(&state.fireflies, bass, treble, &mut transforms, &query);
    update_rain(&state.rain, bass, &mut transforms, &query);
    update_shockwave(state.shockwave, bass, &mut transforms, &query);
    update_lasers(&state.lasers, bass, &mut transforms, &query);
    update_dust(&state.dust, bass, &mut transforms, &query);
    update_crystals(&state.crystals, bass, treble, &mut transforms, &query);

    state.glitch_phase += 0.02 + bass * 0.08;
    if config.active_effects.iter().any(|e| e == "glitch") {
        clear_color.0 = Color::srgb(
            0.02 + (state.glitch_phase * 0.7).sin() * 0.01,
            0.02 + (state.glitch_phase * 1.3).cos() * 0.01,
            0.04 + (state.glitch_phase * 0.9).sin() * 0.01,
        );
        if let Ok(mut cam) = camera.get_single_mut() {
            cam.translation.x += (state.glitch_phase * 4.0).sin() * 0.2;
            cam.translation.y += (state.glitch_phase * 5.0).cos() * 0.2;
        }
    }
}

fn sync_set<F>(
    entities: &mut Vec<Entity>,
    effect: &str,
    count: usize,
    config: &Config,
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    spawn: F,
    query: &Query<Entity>,
) where
    F: Fn(&mut Commands, &mut Assets<Mesh>, &mut Assets<StandardMaterial>) -> Vec<Entity>,
{
    let active = config.active_effects.iter().any(|e| e == effect);
    if active && entities.is_empty() {
        *entities = spawn(commands, meshes, materials);
        if entities.len() > count {
            entities.truncate(count);
        }
    } else if !active && !entities.is_empty() {
        despawn_all(commands, entities, query);
    }
}

fn sync_one<F>(
    entity: &mut Option<Entity>,
    effect: &str,
    config: &Config,
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    spawn: F,
    query: &Query<Entity>,
) where
    F: Fn(&mut Commands, &mut Assets<Mesh>, &mut Assets<StandardMaterial>) -> Entity,
{
    let active = config.active_effects.iter().any(|e| e == effect);
    if active && entity.is_none() {
        *entity = Some(spawn(commands, meshes, materials));
    } else if !active {
        if let Some(e) = entity.take() {
            if query.get(e).is_ok() {
                commands.entity(e).despawn_recursive();
            }
        }
    }
}

fn despawn_all(commands: &mut Commands, entities: &mut Vec<Entity>, query: &Query<Entity>) {
    for e in entities.drain(..) {
        if query.get(e).is_ok() {
            commands.entity(e).despawn_recursive();
        }
    }
}

fn spawn_smoke(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
) -> Vec<Entity> {
    let mesh = meshes.add(Sphere::new(1.0).mesh().ico(2).unwrap());
    let material = materials.add(StandardMaterial {
        base_color: Color::srgba(0.8, 0.8, 0.9, 0.12),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });
    let mut out = Vec::new();
    let mut rng = rand::thread_rng();
    for _ in 0..40 {
        let e = commands
            .spawn((
                Mesh3d(mesh.clone()),
                MeshMaterial3d(material.clone()),
                Transform::from_xyz(
                    (rng.gen::<f32>() - 0.5) * 800.0,
                    -20.0 + rng.gen::<f32>() * 220.0,
                    (rng.gen::<f32>() - 0.5) * 800.0,
                )
                .with_scale(Vec3::splat(18.0 + rng.gen::<f32>() * 36.0)),
                TemplateMarker,
            ))
            .id();
        out.push(e);
    }
    out
}

fn spawn_birds(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
) -> Vec<Entity> {
    let mesh = meshes.add(Cuboid::from_size(Vec3::new(12.0, 2.0, 6.0)));
    let material = materials.add(StandardMaterial {
        base_color: Color::srgb(0.95, 0.95, 0.9),
        unlit: true,
        ..default()
    });
    let mut out = Vec::new();
    for i in 0..10 {
        let e = commands
            .spawn((
                Mesh3d(mesh.clone()),
                MeshMaterial3d(material.clone()),
                Transform::from_xyz(
                    (i as f32 - 5.0) * 80.0,
                    180.0 + i as f32 * 14.0,
                    -200.0 + i as f32 * 40.0,
                ),
                TemplateMarker,
            ))
            .id();
        out.push(e);
    }
    out
}

fn spawn_fireflies(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
) -> Vec<Entity> {
    let mesh = meshes.add(Sphere::new(1.0).mesh().ico(2).unwrap());
    let material = materials.add(StandardMaterial {
        base_color: Color::srgb(1.0, 0.95, 0.6),
        emissive: Color::srgb(1.0, 0.95, 0.6).into(),
        unlit: true,
        ..default()
    });
    let mut out = Vec::new();
    let mut rng = rand::thread_rng();
    for _ in 0..60 {
        let e = commands
            .spawn((
                Mesh3d(mesh.clone()),
                MeshMaterial3d(material.clone()),
                Transform::from_xyz(
                    (rng.gen::<f32>() - 0.5) * 700.0,
                    20.0 + rng.gen::<f32>() * 250.0,
                    (rng.gen::<f32>() - 0.5) * 700.0,
                )
                .with_scale(Vec3::splat(2.0 + rng.gen::<f32>() * 4.0)),
                TemplateMarker,
            ))
            .id();
        out.push(e);
    }
    out
}

fn spawn_rain(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
) -> Vec<Entity> {
    let mesh = meshes.add(Cuboid::from_size(Vec3::new(1.0, 20.0, 1.0)));
    let material = materials.add(StandardMaterial {
        base_color: Color::srgba(0.6, 0.7, 1.0, 0.55),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });
    let mut out = Vec::new();
    let mut rng = rand::thread_rng();
    for _ in 0..180 {
        let e = commands
            .spawn((
                Mesh3d(mesh.clone()),
                MeshMaterial3d(material.clone()),
                Transform::from_xyz(
                    (rng.gen::<f32>() - 0.5) * 1000.0,
                    300.0 + rng.gen::<f32>() * 500.0,
                    (rng.gen::<f32>() - 0.5) * 1000.0,
                ),
                TemplateMarker,
            ))
            .id();
        out.push(e);
    }
    out
}

fn spawn_shockwave(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
) -> Entity {
    let material = materials.add(StandardMaterial {
        base_color: Color::srgba(1.0, 1.0, 1.0, 0.35),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });
    commands
        .spawn((
            Mesh3d(meshes.add(Circle::new(80.0))),
            MeshMaterial3d(material),
            Transform::from_xyz(0.0, 0.0, 0.0),
            TemplateMarker,
        ))
        .id()
}

fn spawn_lasers(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
) -> Vec<Entity> {
    let mesh = meshes.add(Cuboid::from_size(Vec3::new(6.0, 6.0, 240.0)));
    let material = materials.add(StandardMaterial {
        base_color: Color::srgb(0.2, 1.0, 1.0),
        emissive: Color::srgb(0.2, 1.0, 1.0).into(),
        unlit: true,
        ..default()
    });
    let mut out = Vec::new();
    for i in 0..8 {
        let e = commands
            .spawn((
                Mesh3d(mesh.clone()),
                MeshMaterial3d(material.clone()),
                Transform::from_xyz(0.0, -40.0 + i as f32 * 12.0, 0.0)
                    .with_rotation(Quat::from_rotation_y(i as f32 * 0.5)),
                TemplateMarker,
            ))
            .id();
        out.push(e);
    }
    out
}

fn spawn_dust(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
) -> Vec<Entity> {
    let mesh = meshes.add(Cuboid::from_size(Vec3::splat(1.0)));
    let material = materials.add(StandardMaterial {
        base_color: Color::srgb(0.95, 0.95, 0.95),
        unlit: true,
        ..default()
    });
    let mut out = Vec::new();
    let mut rng = rand::thread_rng();
    for _ in 0..120 {
        let e = commands
            .spawn((
                Mesh3d(mesh.clone()),
                MeshMaterial3d(material.clone()),
                Transform::from_xyz(
                    (rng.gen::<f32>() - 0.5) * 1300.0,
                    (rng.gen::<f32>() - 0.5) * 700.0,
                    rng.gen::<f32>() * 900.0,
                ),
                TemplateMarker,
            ))
            .id();
        out.push(e);
    }
    out
}

fn spawn_crystals(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
) -> Vec<Entity> {
    let mesh = meshes.add(Cuboid::from_size(Vec3::new(10.0, 42.0, 10.0)));
    let material = materials.add(StandardMaterial {
        base_color: Color::srgb(0.7, 0.95, 1.0),
        emissive: Color::srgb(0.7, 0.95, 1.0).into(),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });
    let mut out = Vec::new();
    let mut rng = rand::thread_rng();
    for _ in 0..32 {
        let e = commands
            .spawn((
                Mesh3d(mesh.clone()),
                MeshMaterial3d(material.clone()),
                Transform::from_xyz(
                    (rng.gen::<f32>() - 0.5) * 500.0,
                    -40.0 + rng.gen::<f32>() * 160.0,
                    (rng.gen::<f32>() - 0.5) * 500.0,
                )
                .with_rotation(Quat::from_euler(
                    EulerRot::XYZ,
                    rng.gen::<f32>() * 2.0,
                    rng.gen::<f32>() * 2.0,
                    rng.gen::<f32>() * 2.0,
                )),
                TemplateMarker,
            ))
            .id();
        out.push(e);
    }
    out
}

fn update_smoke(
    entities: &[Entity],
    bass: f32,
    transforms: &mut Query<&mut Transform, Without<MainCameraMarker>>,
    query: &Query<Entity>,
) {
    let mut rng = rand::thread_rng();
    for &e in entities {
        if query.get(e).is_ok() {
            if let Ok(mut t) = transforms.get_mut(e) {
                t.translation.y += 0.15 + bass * 0.3;
                t.translation.x += (rng.gen::<f32>() - 0.5) * 0.6;
                t.translation.z += (rng.gen::<f32>() - 0.5) * 0.6;
                if t.translation.y > 280.0 {
                    t.translation.y = -40.0;
                }
            }
        }
    }
}

fn update_birds(
    entities: &[Entity],
    bass: f32,
    transforms: &mut Query<&mut Transform, Without<MainCameraMarker>>,
    query: &Query<Entity>,
    phase: f32,
) {
    for (i, &e) in entities.iter().enumerate() {
        if query.get(e).is_ok() {
            if let Ok(mut t) = transforms.get_mut(e) {
                let f = phase + i as f32 * 0.2;
                t.translation.x = f.cos() * (200.0 + bass * 50.0);
                t.translation.z = f.sin() * (180.0 + bass * 30.0);
                t.translation.y = 160.0 + (f * 1.7).sin() * 35.0;
                t.rotation = Quat::from_rotation_y(f + std::f32::consts::FRAC_PI_2);
            }
        }
    }
}

fn update_fireflies(
    entities: &[Entity],
    bass: f32,
    treble: f32,
    transforms: &mut Query<&mut Transform, Without<MainCameraMarker>>,
    query: &Query<Entity>,
) {
    for (i, &e) in entities.iter().enumerate() {
        if query.get(e).is_ok() {
            if let Ok(mut t) = transforms.get_mut(e) {
                let phase = (i as f32 * 0.23) + bass * 2.0 + treble;
                t.translation.x += phase.sin() * 0.8;
                t.translation.y += phase.cos() * 0.5;
                t.translation.z += (phase * 1.7).sin() * 0.8;
            }
        }
    }
}

fn update_rain(
    entities: &[Entity],
    bass: f32,
    transforms: &mut Query<&mut Transform, Without<MainCameraMarker>>,
    query: &Query<Entity>,
) {
    for &e in entities {
        if query.get(e).is_ok() {
            if let Ok(mut t) = transforms.get_mut(e) {
                t.translation.y -= 12.0 + bass * 25.0;
                if t.translation.y < -80.0 {
                    t.translation.y = 450.0;
                }
            }
        }
    }
}

fn update_shockwave(
    shockwave: Option<Entity>,
    bass: f32,
    transforms: &mut Query<&mut Transform, Without<MainCameraMarker>>,
    query: &Query<Entity>,
) {
    if let Some(e) = shockwave {
        if query.get(e).is_ok() {
            if let Ok(mut t) = transforms.get_mut(e) {
                let scale = 1.0 + bass * 4.0;
                t.scale = Vec3::splat(scale);
                t.rotation = Quat::from_rotation_x(std::f32::consts::FRAC_PI_2);
            }
        }
    }
}

fn update_lasers(
    entities: &[Entity],
    bass: f32,
    transforms: &mut Query<&mut Transform, Without<MainCameraMarker>>,
    query: &Query<Entity>,
) {
    for (i, &e) in entities.iter().enumerate() {
        if query.get(e).is_ok() {
            if let Ok(mut t) = transforms.get_mut(e) {
                let phase = i as f32 * 0.4 + bass * 3.0;
                t.rotation = Quat::from_euler(EulerRot::XYZ, phase * 0.2, phase * 0.8, phase);
                t.translation.y = -30.0 + (phase * 1.6).sin() * 24.0;
            }
        }
    }
}

fn update_dust(
    entities: &[Entity],
    bass: f32,
    transforms: &mut Query<&mut Transform, Without<MainCameraMarker>>,
    query: &Query<Entity>,
) {
    let mut rng = rand::thread_rng();
    for &e in entities {
        if query.get(e).is_ok() {
            if let Ok(mut t) = transforms.get_mut(e) {
                t.translation.x += (rng.gen::<f32>() - 0.5) * 0.2 + bass * 0.1;
                t.translation.y += (rng.gen::<f32>() - 0.5) * 0.2;
                if t.translation.z < -200.0 {
                    t.translation.z = 900.0;
                }
                t.translation.z -= 1.0 + bass * 4.0;
            }
        }
    }
}

fn update_crystals(
    entities: &[Entity],
    bass: f32,
    treble: f32,
    transforms: &mut Query<&mut Transform, Without<MainCameraMarker>>,
    query: &Query<Entity>,
) {
    for (i, &e) in entities.iter().enumerate() {
        if query.get(e).is_ok() {
            if let Ok(mut t) = transforms.get_mut(e) {
                t.rotation = Quat::from_euler(
                    EulerRot::XYZ,
                    bass * 0.5 + i as f32 * 0.1,
                    treble * 0.6 + i as f32 * 0.08,
                    bass * 0.3,
                );
                t.translation.y += (bass + treble) * 0.2;
            }
        }
    }
}

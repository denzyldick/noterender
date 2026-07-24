use bevy::prelude::*;
use rand::Rng;

use crate::audio::AudioState;
use crate::config::Config;
use crate::templates::common::*;
use crate::templates::TemplateMarker;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AdvancedKind {
    Infinity,
    Tunnel,
    City,
    Nebulacore,
    Aether,
    Monolith,
    Prism,
    Flora,
    Clouds,
    Aurora,
    Cathedral,
    Oscillate,
    Reactor,
}

#[derive(Resource)]
pub struct AdvancedState {
    pub kind: AdvancedKind,
    pub t: f32,
}

pub fn kind_from_name(name: &str) -> Option<AdvancedKind> {
    match name {
        "infinity" => Some(AdvancedKind::Infinity),
        "tunnel" => Some(AdvancedKind::Tunnel),
        "city" => Some(AdvancedKind::City),
        "nebulacore" => Some(AdvancedKind::Nebulacore),
        "aether" => Some(AdvancedKind::Aether),
        "monolith" => Some(AdvancedKind::Monolith),
        "prism" => Some(AdvancedKind::Prism),
        "flora" => Some(AdvancedKind::Flora),
        "clouds" => Some(AdvancedKind::Clouds),
        "aurora" => Some(AdvancedKind::Aurora),
        "cathedral" => Some(AdvancedKind::Cathedral),
        "oscillate" => Some(AdvancedKind::Oscillate),
        "reactor" => Some(AdvancedKind::Reactor),
        _ => None,
    }
}

pub fn init(
    name: &str,
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    config: &Config,
) {
    let kind = match kind_from_name(name) {
        Some(kind) => kind,
        None => return,
    };

    let (pr, pg, pb) = primary_rgb(config);
    let (lr, lg, lb) = accent_rgb(config);

    match kind {
        AdvancedKind::Infinity => {
            init_infinity(commands, meshes, materials, pr, pg, pb, lr, lg, lb)
        }
        AdvancedKind::Tunnel => init_tunnel(commands, meshes, materials, pr, pg, pb, lr, lg, lb),
        AdvancedKind::City => init_city(commands, meshes, materials, pr, pg, pb, lr, lg, lb),
        AdvancedKind::Nebulacore => {
            init_nebulacore(commands, meshes, materials, pr, pg, pb, lr, lg, lb)
        }
        AdvancedKind::Aether => init_aether(commands, meshes, materials, pr, pg, pb, lr, lg, lb),
        AdvancedKind::Monolith => {
            init_monolith(commands, meshes, materials, pr, pg, pb, lr, lg, lb)
        }
        AdvancedKind::Prism => init_prism(commands, meshes, materials, pr, pg, pb, lr, lg, lb),
        AdvancedKind::Flora => init_flora(commands, meshes, materials, pr, pg, pb, lr, lg, lb),
        AdvancedKind::Clouds => init_clouds(commands, meshes, materials, pr, pg, pb, lr, lg, lb),
        AdvancedKind::Aurora => init_aurora(commands, meshes, materials, pr, pg, pb, lr, lg, lb),
        AdvancedKind::Cathedral => {
            init_cathedral(commands, meshes, materials, pr, pg, pb, lr, lg, lb)
        }
        AdvancedKind::Oscillate => {
            init_oscillate(commands, meshes, materials, pr, pg, pb, lr, lg, lb)
        }
        AdvancedKind::Reactor => init_reactor(commands, meshes, materials, pr, pg, pb, lr, lg, lb),
    }

    commands.insert_resource(AdvancedState { kind, t: 0.0 });
}

fn spawn_marker(commands: &mut Commands, entity: Entity) {
    commands.entity(entity).insert(TemplateMarker);
}

fn init_infinity(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    pr: f32,
    pg: f32,
    pb: f32,
    lr: f32,
    lg: f32,
    lb: f32,
) {
    let ring_mesh = meshes.add(Cuboid::from_size(Vec3::new(400.0, 4.0, 20.0)));
    let ring_material = materials.add(StandardMaterial {
        base_color: Color::srgb(pr, pg, pb),
        unlit: true,
        ..default()
    });
    for i in 0..40 {
        let z = i as f32 * 40.0;
        let a = (i as f32 * 0.16).sin();
        let b = (i as f32 * 0.07).cos();
        let e = commands
            .spawn((
                Mesh3d(ring_mesh.clone()),
                MeshMaterial3d(ring_material.clone()),
                Transform::from_xyz(a * 30.0, b * 30.0, z)
                    .with_rotation(Quat::from_rotation_z(i as f32 * 0.09)),
            ))
            .id();
        spawn_marker(commands, e);
    }

    let star_mesh = meshes.add(Cuboid::from_size(Vec3::splat(2.0)));
    let star_material = materials.add(StandardMaterial {
        base_color: Color::srgb(lr, lg, lb),
        unlit: true,
        ..default()
    });
    for _ in 0..700 {
        let mut rng = rand::thread_rng();
        let angle = rng.gen::<f32>() * std::f32::consts::TAU;
        let radius = 200.0 + rng.gen::<f32>() * 900.0;
        let e = commands
            .spawn((
                Mesh3d(star_mesh.clone()),
                MeshMaterial3d(star_material.clone()),
                Transform::from_xyz(
                    angle.cos() * radius,
                    angle.sin() * radius,
                    rng.gen::<f32>() * 2000.0,
                ),
            ))
            .id();
        spawn_marker(commands, e);
    }
}

fn init_tunnel(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    pr: f32,
    pg: f32,
    pb: f32,
    lr: f32,
    lg: f32,
    lb: f32,
) {
    let box_mesh = meshes.add(Cuboid::from_size(Vec3::new(16.0, 16.0, 64.0)));
    let mat = materials.add(StandardMaterial {
        base_color: Color::srgb(pr, pg, pb),
        unlit: true,
        ..default()
    });
    let accent = materials.add(StandardMaterial {
        base_color: Color::srgb(lr, lg, lb),
        unlit: true,
        ..default()
    });
    let tunnel = 500.0;
    for section in 0..24 {
        let z = section as f32 * 90.0;
        for side in 0..4 {
            for slot in 0..6 {
                let offset = (slot as f32 - 2.5) * 90.0;
                let (x, y, rot) = match side {
                    0 => (offset, tunnel * 0.5, 0.0),
                    1 => (offset, -tunnel * 0.5, 0.0),
                    2 => (-tunnel * 0.5, offset, std::f32::consts::FRAC_PI_2),
                    _ => (tunnel * 0.5, offset, std::f32::consts::FRAC_PI_2),
                };
                let e = commands
                    .spawn((
                        Mesh3d(box_mesh.clone()),
                        MeshMaterial3d(if slot % 2 == 0 {
                            mat.clone()
                        } else {
                            accent.clone()
                        }),
                        Transform::from_xyz(x, y, z)
                            .with_rotation(Quat::from_rotation_z(rot)),
                    ))
                    .id();
                spawn_marker(commands, e);
            }
        }
    }

    let line_mesh = meshes.add(Cuboid::from_size(Vec3::new(2.0, 2.0, 4000.0)));
    for &(x, y) in &[
        (520.0, 520.0),
        (-520.0, 520.0),
        (520.0, -520.0),
        (-520.0, -520.0),
    ] {
        let e = commands
            .spawn((
                Mesh3d(line_mesh.clone()),
                MeshMaterial3d(materials.add(StandardMaterial {
                    base_color: Color::srgb(lr, lg, lb),
                    unlit: true,
                    ..default()
                })),
                Transform::from_xyz(x, y, 1500.0),
            ))
            .id();
        spawn_marker(commands, e);
    }
}

fn init_city(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    pr: f32,
    pg: f32,
    pb: f32,
    lr: f32,
    lg: f32,
    lb: f32,
) {
    let base = materials.add(StandardMaterial {
        base_color: Color::srgb(pr * 0.4, pg * 0.4, pb * 0.4),
        unlit: true,
        ..default()
    });
    let top = materials.add(StandardMaterial {
        base_color: Color::srgb(lr, lg, lb),
        unlit: true,
        ..default()
    });
    let building_mesh = meshes.add(Cuboid::from_size(Vec3::splat(1.0)));
    let mut rng = rand::thread_rng();
    for x in -12..=12 {
        for z in -12..=12 {
            let h = 20.0 + rng.gen::<f32>() * 220.0;
            let e = commands
                .spawn((
                    Mesh3d(building_mesh.clone()),
                    MeshMaterial3d(if (x + z) % 3 == 0 {
                        top.clone()
                    } else {
                        base.clone()
                    }),
                    Transform::from_xyz(
                        x as f32 * 40.0,
                        h * 0.5 - 120.0,
                        z as f32 * 40.0,
                    )
                    .with_scale(Vec3::new(20.0, h, 20.0)),
                ))
                .id();
            spawn_marker(commands, e);
        }
    }
}

fn init_nebulacore(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    pr: f32,
    pg: f32,
    pb: f32,
    lr: f32,
    lg: f32,
    lb: f32,
) {
    let core = materials.add(StandardMaterial {
        base_color: Color::srgb(pr, pg, pb),
        emissive: Color::srgb(pr, pg, pb).into(),
        unlit: true,
        ..default()
    });
    let ring = materials.add(StandardMaterial {
        base_color: Color::srgb(lr, lg, lb),
        emissive: Color::srgb(lr, lg, lb).into(),
        unlit: true,
        ..default()
    });
    let sphere_mesh = meshes.add(Sphere::new(1.0).mesh().ico(4).unwrap());
    let center = commands
        .spawn((
            Mesh3d(meshes.add(Sphere::new(80.0).mesh().ico(6).unwrap())),
            MeshMaterial3d(core.clone()),
            Transform::from_xyz(0.0, 0.0, 0.0),
        ))
        .id();
    spawn_marker(commands, center);
    for i in 0..8 {
        let radius = 160.0 + i as f32 * 35.0;
        let e = commands
            .spawn((
                Mesh3d(meshes.add(Cuboid::from_size(Vec3::new(radius * 2.0, 4.0, 4.0)))),
                MeshMaterial3d(ring.clone()),
                Transform::from_rotation(Quat::from_rotation_x(i as f32 * 0.35)),
            ))
            .id();
        spawn_marker(commands, e);
    }
    for _ in 0..220 {
        let mut rng = rand::thread_rng();
        let angle = rng.gen::<f32>() * std::f32::consts::TAU;
        let radius = 120.0 + rng.gen::<f32>() * 260.0;
        let e = commands
            .spawn((
                Mesh3d(sphere_mesh.clone()),
                MeshMaterial3d(ring.clone()),
                Transform::from_xyz(
                    angle.cos() * radius,
                    (rng.gen::<f32>() - 0.5) * 120.0,
                    angle.sin() * radius,
                )
                .with_scale(Vec3::splat(2.0 + rng.gen::<f32>() * 4.0)),
            ))
            .id();
        spawn_marker(commands, e);
    }
}

fn init_aether(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    pr: f32,
    pg: f32,
    pb: f32,
    lr: f32,
    lg: f32,
    lb: f32,
) {
    let knot = commands
        .spawn((
            Mesh3d(meshes.add(Cuboid::from_size(Vec3::new(220.0, 2.0, 220.0)))),
            MeshMaterial3d(materials.add(StandardMaterial {
                base_color: Color::srgb(pr, pg, pb),
                unlit: true,
                alpha_mode: AlphaMode::Blend,
                ..default()
            })),
            Transform::from_xyz(0.0, 0.0, 0.0).with_rotation(Quat::from_rotation_y(0.6)),
        ))
        .id();
    spawn_marker(commands, knot);

    let particle_mesh = meshes.add(Cuboid::from_size(Vec3::splat(2.0)));
    let particle_mat = materials.add(StandardMaterial {
        base_color: Color::srgb(lr, lg, lb),
        unlit: true,
        ..default()
    });
    let mut rng = rand::thread_rng();
    for _ in 0..250 {
        let angle = rng.gen::<f32>() * std::f32::consts::TAU;
        let dist = 120.0 + rng.gen::<f32>() * 120.0;
        let e = commands
            .spawn((
                Mesh3d(particle_mesh.clone()),
                MeshMaterial3d(particle_mat.clone()),
                Transform::from_xyz(
                    angle.cos() * dist,
                    (rng.gen::<f32>() - 0.5) * 100.0,
                    angle.sin() * dist,
                ),
            ))
            .id();
        spawn_marker(commands, e);
    }
}

fn init_monolith(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    pr: f32,
    pg: f32,
    pb: f32,
    lr: f32,
    lg: f32,
    lb: f32,
) {
    let cube_mesh = meshes.add(Cuboid::from_size(Vec3::splat(1.0)));
    let dark = materials.add(StandardMaterial {
        base_color: Color::srgb(pr * 0.2, pg * 0.2, pb * 0.2),
        unlit: true,
        ..default()
    });
    let light = materials.add(StandardMaterial {
        base_color: Color::srgb(lr, lg, lb),
        unlit: true,
        ..default()
    });
    for x in -9..=9 {
        for y in 0..20 {
            for z in -2..=2 {
                let height = 20.0 + y as f32 * 15.0;
                let e = commands
                    .spawn((
                        Mesh3d(cube_mesh.clone()),
                        MeshMaterial3d(if y % 5 == 0 {
                            light.clone()
                        } else {
                            dark.clone()
                        }),
                        Transform::from_xyz(
                            x as f32 * 24.0,
                            height * 0.5 - 160.0,
                            z as f32 * 24.0,
                        )
                        .with_scale(Vec3::new(16.0, height, 16.0)),
                    ))
                    .id();
                spawn_marker(commands, e);
            }
        }
    }
}

fn init_prism(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    pr: f32,
    pg: f32,
    pb: f32,
    lr: f32,
    lg: f32,
    lb: f32,
) {
    let shard_mesh = meshes.add(Cuboid::from_size(Vec3::new(8.0, 48.0, 16.0)));
    let mat = materials.add(StandardMaterial {
        base_color: Color::srgb(pr, pg, pb),
        metallic: 0.8,
        perceptual_roughness: 0.1,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });
    let glow = materials.add(StandardMaterial {
        base_color: Color::srgb(lr, lg, lb),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });
    let mut rng = rand::thread_rng();
    for i in 0..60 {
        let angle = i as f32 / 60.0 * std::f32::consts::TAU;
        let radius = 120.0 + rng.gen::<f32>() * 140.0;
        let e = commands
            .spawn((
                Mesh3d(shard_mesh.clone()),
                MeshMaterial3d(if i % 2 == 0 {
                    mat.clone()
                } else {
                    glow.clone()
                }),
                Transform::from_xyz(
                    angle.cos() * radius,
                    (rng.gen::<f32>() - 0.5) * 100.0,
                    angle.sin() * radius,
                )
                .with_rotation(Quat::from_euler(
                    EulerRot::XYZ,
                    rng.gen::<f32>() * 2.0,
                    angle,
                    rng.gen::<f32>() * 2.0,
                )),
            ))
            .id();
        spawn_marker(commands, e);
    }
}

fn init_flora(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    pr: f32,
    pg: f32,
    pb: f32,
    lr: f32,
    lg: f32,
    lb: f32,
) {
    let trunk = materials.add(StandardMaterial {
        base_color: Color::srgb(pr * 0.3, pg * 0.2, pb * 0.15),
        unlit: true,
        ..default()
    });
    let leaf = materials.add(StandardMaterial {
        base_color: Color::srgb(lr, lg, lb),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });
    let trunk_mesh = meshes.add(Cuboid::from_size(Vec3::new(18.0, 180.0, 18.0)));
    let trunk_e = commands
        .spawn((
            Mesh3d(trunk_mesh),
            MeshMaterial3d(trunk),
            Transform::from_xyz(0.0, -40.0, 0.0),
        ))
        .id();
    spawn_marker(commands, trunk_e);

    let leaf_mesh = meshes.add(Sphere::new(1.0).mesh().ico(2).unwrap());
    let mut rng = rand::thread_rng();
    for i in 0..900 {
        let h = 40.0 + rng.gen::<f32>() * 220.0;
        let angle = rng.gen::<f32>() * std::f32::consts::TAU;
        let radius = 24.0 + (h * 0.18);
        let e = commands
            .spawn((
                Mesh3d(leaf_mesh.clone()),
                MeshMaterial3d(leaf.clone()),
                Transform::from_xyz(
                    angle.cos() * radius,
                    h - 30.0,
                    angle.sin() * radius,
                )
                .with_scale(Vec3::splat(1.5 + (i % 5) as f32 * 0.4)),
            ))
            .id();
        spawn_marker(commands, e);
    }
}

fn init_clouds(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    pr: f32,
    pg: f32,
    pb: f32,
    lr: f32,
    lg: f32,
    lb: f32,
) {
    let cloud_mat = materials.add(StandardMaterial {
        base_color: Color::srgb(pr, pg, pb).with_alpha(0.12),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });
    let accent = materials.add(StandardMaterial {
        base_color: Color::srgb(lr, lg, lb).with_alpha(0.18),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });
    let sphere = meshes.add(Sphere::new(1.0).mesh().ico(2).unwrap());
    let mut rng = rand::thread_rng();
    for i in 0..180 {
        let x = (rng.gen::<f32>() - 0.5) * 1200.0;
        let y = 80.0 + rng.gen::<f32>() * 240.0;
        let z = (rng.gen::<f32>() - 0.5) * 900.0;
        let e = commands
            .spawn((
                Mesh3d(sphere.clone()),
                MeshMaterial3d(if i % 4 == 0 {
                    accent.clone()
                } else {
                    cloud_mat.clone()
                }),
                Transform::from_xyz(x, y, z)
                    .with_scale(Vec3::splat(40.0 + rng.gen::<f32>() * 120.0)),
            ))
            .id();
        spawn_marker(commands, e);
    }
}

fn init_aurora(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    pr: f32,
    pg: f32,
    pb: f32,
    lr: f32,
    lg: f32,
    lb: f32,
) {
    let ribbon = meshes.add(Cuboid::from_size(Vec3::new(20.0, 1.0, 280.0)));
    let primary = materials.add(StandardMaterial {
        base_color: Color::srgb(pr, pg, pb).with_alpha(0.45),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });
    let accent = materials.add(StandardMaterial {
        base_color: Color::srgb(lr, lg, lb).with_alpha(0.45),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });
    for i in 0..14 {
        let y = 80.0 + i as f32 * 26.0;
        let e = commands
            .spawn((
                Mesh3d(ribbon.clone()),
                MeshMaterial3d(if i % 2 == 0 {
                    primary.clone()
                } else {
                    accent.clone()
                }),
                Transform::from_xyz(0.0, y, -100.0)
                    .with_rotation(Quat::from_rotation_y(i as f32 * 0.18)),
            ))
            .id();
        spawn_marker(commands, e);
    }
}

fn init_cathedral(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    pr: f32,
    pg: f32,
    pb: f32,
    lr: f32,
    lg: f32,
    lb: f32,
) {
    let stone = materials.add(StandardMaterial {
        base_color: Color::srgb(pr * 0.15, pg * 0.15, pb * 0.2),
        unlit: true,
        ..default()
    });
    let glass = materials.add(StandardMaterial {
        base_color: Color::srgb(lr, lg, lb).with_alpha(0.8),
        unlit: true,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });
    let arch_mesh = meshes.add(Cuboid::from_size(Vec3::new(18.0, 220.0, 18.0)));
    for x in -7..=7 {
        let left = commands
            .spawn((
                Mesh3d(arch_mesh.clone()),
                MeshMaterial3d(stone.clone()),
                Transform::from_xyz(x as f32 * 60.0, 20.0, -220.0),
            ))
            .id();
        spawn_marker(commands, left);
        let right = commands
            .spawn((
                Mesh3d(arch_mesh.clone()),
                MeshMaterial3d(stone.clone()),
                Transform::from_xyz(x as f32 * 60.0, 20.0, 220.0),
            ))
            .id();
        spawn_marker(commands, right);
    }
    let rose = commands
        .spawn((
            Mesh3d(meshes.add(Cuboid::from_size(Vec3::new(220.0, 16.0, 220.0)))),
            MeshMaterial3d(glass),
            Transform::from_xyz(0.0, 220.0, 0.0),
        ))
        .id();
    spawn_marker(commands, rose);
}

fn init_oscillate(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    pr: f32,
    pg: f32,
    pb: f32,
    lr: f32,
    lg: f32,
    lb: f32,
) {
    let bar_mesh = meshes.add(Cuboid::from_size(Vec3::new(8.0, 160.0, 8.0)));
    let mat = materials.add(StandardMaterial {
        base_color: Color::srgb(pr, pg, pb),
        unlit: true,
        ..default()
    });
    let accent = materials.add(StandardMaterial {
        base_color: Color::srgb(lr, lg, lb),
        unlit: true,
        ..default()
    });
    for i in 0..96 {
        let angle = i as f32 / 96.0 * std::f32::consts::TAU;
        let radius = 240.0;
        let e = commands
            .spawn((
                Mesh3d(bar_mesh.clone()),
                MeshMaterial3d(if i % 2 == 0 {
                    mat.clone()
                } else {
                    accent.clone()
                }),
                Transform::from_xyz(angle.cos() * radius, angle.sin() * radius, 0.0)
                    .with_rotation(Quat::from_rotation_z(angle)),
            ))
            .id();
        spawn_marker(commands, e);
    }
}

fn init_reactor(
    commands: &mut Commands,
    meshes: &mut Assets<Mesh>,
    materials: &mut Assets<StandardMaterial>,
    pr: f32,
    pg: f32,
    pb: f32,
    lr: f32,
    lg: f32,
    lb: f32,
) {
    let core = materials.add(StandardMaterial {
        base_color: Color::srgb(pr, pg, pb),
        emissive: Color::srgb(pr, pg, pb).into(),
        unlit: true,
        ..default()
    });
    let ring = materials.add(StandardMaterial {
        base_color: Color::srgb(lr, lg, lb),
        emissive: Color::srgb(lr, lg, lb).into(),
        unlit: true,
        ..default()
    });
    let core_mesh = meshes.add(Sphere::new(90.0).mesh().ico(6).unwrap());
    let core_e = commands
        .spawn((
            Mesh3d(core_mesh),
            MeshMaterial3d(core.clone()),
            Transform::from_xyz(0.0, 0.0, 0.0),
        ))
        .id();
    spawn_marker(commands, core_e);
    for i in 0..6 {
        let e = commands
            .spawn((
                Mesh3d(meshes.add(Cuboid::from_size(Vec3::new(320.0, 8.0, 8.0)))),
                MeshMaterial3d(ring.clone()),
                Transform::from_rotation(Quat::from_rotation_y(i as f32 * 0.52)),
            ))
            .id();
        spawn_marker(commands, e);
    }
    for i in 0..48 {
        let e = commands
            .spawn((
                Mesh3d(meshes.add(Cuboid::from_size(Vec3::new(12.0, 12.0, 120.0)))),
                MeshMaterial3d(if i % 2 == 0 {
                    core.clone()
                } else {
                    ring.clone()
                }),
                Transform::from_rotation(Quat::from_rotation_z(i as f32 * 0.13)),
            ))
            .id();
        spawn_marker(commands, e);
    }
}

pub fn render_system(
    state: Option<ResMut<AdvancedState>>,
    audio: Res<AudioState>,
    config: Res<Config>,
    _time: Res<Time>,
    mut transforms: Query<&mut Transform, With<TemplateMarker>>,
) {
    let mut state = match state {
        Some(s) => s,
        None => return,
    };

    let bass = audio.bass;
    let treble = audio.treble;
    let fft = &audio.fft;
    state.t += 0.01;

    match state.kind {
        AdvancedKind::Infinity => {
            let speed = config.templates.infinity.speed.max(0.1);
            for mut t in &mut transforms {
                if t.translation.z >= 0.0 && t.translation.z <= 2000.0 {
                    t.translation.z -= (8.0 + bass * 30.0) * speed;
                    if t.translation.z < -200.0 {
                        t.translation.z += 1600.0;
                    }
                    t.rotation = Quat::from_rotation_z(state.t * 0.15 * speed);
                    t.scale = Vec3::new(1.0 + bass * 2.0, 1.0, 1.0);
                }
            }
        }
        AdvancedKind::Tunnel => {
            let speed = config.templates.tunnel.repetition.max(1) as f32 / 5.0;
            for mut t in &mut transforms {
                if t.translation.z >= 0.0 && t.translation.z <= 2500.0 {
                    t.translation.z -= (10.0 + bass * 36.0) * speed;
                    if t.translation.z < -300.0 {
                        t.translation.z += 2160.0;
                    }
                    t.scale.y = 1.0 + audio.bass * 4.0;
                }
            }
        }
        AdvancedKind::City => {
            for mut t in &mut transforms {
                if t.translation.y < 0.0 {
                    let grid = ((t.translation.x.abs() + t.translation.z.abs()) / 40.0) as usize;
                    let pulse = 1.0 + fft.get(grid % fft.len()).copied().unwrap_or(0.0) * 4.0;
                    t.scale.y = (t.scale.y * 0.9) + pulse * 0.1;
                    t.translation.y = t.scale.y * 0.5 - 120.0;
                    t.rotation = Quat::from_rotation_y((state.t * 0.02).sin() * 0.02);
                }
            }
        }
        AdvancedKind::Nebulacore => {
            for mut t in &mut transforms {
                let dist = t.translation.length();
                if dist < 10.0 {
                    t.scale = Vec3::splat(1.0 + bass * 1.2);
                } else {
                    let phase = state.t * 0.8 + dist * 0.01;
                    t.rotation = Quat::from_euler(EulerRot::XYZ, phase * 0.5, phase * 0.3, phase);
                    t.scale = Vec3::splat(1.0 + bass * 0.3);
                }
            }
        }
        AdvancedKind::Aether => {
            let speed = config.templates.aether.speed.max(0.1);
            let wave = config.templates.aether.wave_height.max(10.0);
            for mut t in &mut transforms {
                if t.translation.length() < 20.0 {
                    t.rotation = Quat::from_rotation_y(state.t * 0.6 * speed + bass * 1.4);
                    t.scale = Vec3::new(
                        1.0 + bass * 0.7,
                        1.0 + treble * 0.2 * wave / 40.0,
                        1.0 + bass * 0.7,
                    );
                } else {
                    let idx = ((t.translation.x.abs() + t.translation.z.abs()) as usize) % 128;
                    let phase = state.t * (0.8 + idx as f32 * 0.01) * speed;
                    let radius = 120.0 + (idx as f32 % 5.0) * 12.0 + bass * wave * 0.5;
                    t.translation.x = phase.cos() * radius;
                    t.translation.z = phase.sin() * radius;
                    t.translation.y = ((phase * 1.7).sin()) * wave;
                }
            }
        }
        AdvancedKind::Monolith => {
            for mut t in &mut transforms {
                if t.translation.y < 0.0 {
                    let band = ((t.translation.x.abs() + t.translation.z.abs()) / 24.0) as usize;
                    let pulse = 1.0 + (fft.get(band % fft.len()).copied().unwrap_or(0.0) * 3.0);
                    t.scale.y = (t.scale.y * 0.92) + pulse * 0.08;
                    t.translation.y = t.scale.y * 0.5 - 160.0 + (band % 10) as f32 * 0.8;
                    t.rotation = Quat::from_rotation_y(state.t * 0.01);
                }
            }
        }
        AdvancedKind::Prism => {
            let speed = config.templates.prism.speed.max(0.1);
            for mut t in &mut transforms {
                if t.translation.length() > 50.0 {
                    t.rotation = Quat::from_euler(
                        EulerRot::XYZ,
                        state.t * 0.4 * speed,
                        state.t * 0.6 * speed,
                        state.t * 0.2 * speed,
                    );
                    t.translation.y += state.t.sin() * 0.15 * speed;
                }
            }
        }
        AdvancedKind::Flora => {
            for mut t in &mut transforms {
                if t.translation.x.abs() > 1.0 || t.translation.z.abs() > 1.0 {
                    let phase = state.t * 0.9 + (t.translation.y * 0.01);
                    t.translation.x += phase.sin() * 0.1;
                    t.translation.y += phase.cos() * 0.08;
                    t.translation.z += (phase * 1.2).sin() * 0.1;
                }
            }
        }
        AdvancedKind::Clouds => {
            for mut t in &mut transforms {
                if t.translation.y > 0.0 {
                    t.translation.z -= 1.0 + bass * 5.0;
                    if t.translation.z < -700.0 {
                        t.translation.z += 1500.0;
                    }
                    t.scale =
                        Vec3::splat((t.scale.x * 0.995) + 0.005 * (40.0 + t.translation.y * 0.2));
                }
            }
        }
        AdvancedKind::Aurora => {
            for mut t in &mut transforms {
                if t.translation.y > 0.0 {
                    t.rotation = Quat::from_rotation_y((state.t * 0.25) + bass * 0.3);
                    t.translation.x = (state.t * 0.8).sin() * 60.0;
                }
            }
        }
        AdvancedKind::Cathedral => {
            for mut t in &mut transforms {
                if t.translation.y > 200.0 {
                    t.scale = Vec3::splat(1.0 + bass * 1.4);
                    t.rotation = Quat::from_rotation_z(state.t * 0.15);
                }
            }
        }
        AdvancedKind::Oscillate => {
            for mut t in &mut transforms {
                if t.translation.length() > 100.0 {
                    let angle = t.translation.x.atan2(t.translation.y);
                    let idx =
                        (((angle + std::f32::consts::PI) / std::f32::consts::TAU) * 96.0) as usize;
                    let freq = fft.get(idx % fft.len()).copied().unwrap_or(0.0);
                    t.scale.y = 80.0 + freq * 260.0;
                    t.rotation = Quat::from_rotation_z(angle + state.t * 0.3);
                    let radius = 240.0 + bass * 24.0;
                    let dir = t.rotation.mul_vec3(Vec3::X);
                    t.translation.x = dir.x * radius;
                    t.translation.y = dir.y * radius;
                }
            }
        }
        AdvancedKind::Reactor => {
            for mut t in &mut transforms {
                if t.translation.length() < 120.0 {
                    t.scale = Vec3::splat(1.0 + bass * 0.5);
                    t.rotation = Quat::from_rotation_y(state.t * 0.5);
                } else {
                    t.rotation = Quat::from_euler(
                        EulerRot::XYZ,
                        state.t * 0.3,
                        state.t * 0.15,
                        state.t * 0.07,
                    );
                    t.scale = Vec3::new(1.0 + bass * 1.2, 1.0, 1.0);
                }
            }
        }
    }

    let _ = config;
}

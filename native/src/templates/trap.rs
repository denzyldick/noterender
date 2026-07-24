use bevy::prelude::*;
use rand::Rng;

use crate::audio::AudioState;
use crate::config::Config;
use crate::templates::TemplateMarker;

#[derive(Resource)]
pub struct TrapState {
    pub t: f32,
    pub bars: Vec<Entity>,
    pub bars_inner: Vec<Entity>,
    pub hyperspace: Vec<Entity>,
    pub dust_entities: Vec<Entity>,
    pub square: Entity,
    pub bar_mat: Handle<StandardMaterial>,
    pub hyper_mat: Handle<StandardMaterial>,
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
    let template = &config.templates.trap;

    let bar_mat = materials.add(StandardMaterial {
        base_color: Color::srgb(pr, pg, pb),
        unlit: true,
        ..default()
    });
    let hyper_mat = materials.add(StandardMaterial {
        base_color: Color::srgb(lr, lg, lb),
        unlit: true,
        ..default()
    });

    let square = commands
        .spawn((
            Mesh3d(meshes.add(Cuboid::from_size(Vec3::new(1.0, 1.0, 0.1)))),
            MeshMaterial3d(bar_mat.clone()),
            Transform::from_xyz(0.0, 0.0, 5.0).with_scale(Vec3::splat(240.0)),
            TemplateMarker,
        ))
        .id();

    let bar_count = template.bars;
    let radius = template.radius;
    let bar_width = template.bar_width;
    let bar_mesh = meshes.add(Cuboid::from_size(Vec3::new(bar_width, 1.0, 0.5)));

    let mut bars = Vec::new();
    let mut bars_inner = Vec::new();
    for i in 0..bar_count {
        let angle = (i as f32 / bar_count as f32) * std::f32::consts::TAU;
        bars.push(
            commands
                .spawn((
                    Mesh3d(bar_mesh.clone()),
                    MeshMaterial3d(bar_mat.clone()),
                    Transform::from_xyz(
                        angle.cos() * radius,
                        angle.sin() * radius,
                        0.0,
                    )
                    .with_rotation(Quat::from_rotation_z(angle + std::f32::consts::FRAC_PI_2)),
                    TemplateMarker,
                ))
                .id(),
        );
        bars_inner.push(
            commands
                .spawn((
                    Mesh3d(bar_mesh.clone()),
                    MeshMaterial3d(bar_mat.clone()),
                    Transform::from_xyz(
                        angle.cos() * (radius - 5.0),
                        angle.sin() * (radius - 5.0),
                        0.0,
                    )
                    .with_rotation(Quat::from_rotation_z(angle - std::f32::consts::FRAC_PI_2)),
                    TemplateMarker,
                ))
                .id(),
        );
    }

    let line_mesh = meshes.add(Cuboid::from_size(Vec3::new(0.2, 0.2, 50.0)));
    let mut hyperspace = Vec::new();
    for _ in 0..template.hyperspace {
        let angle = rand::thread_rng().gen::<f32>() * std::f32::consts::TAU;
        let r = 300.0 + rand::thread_rng().gen::<f32>() * 1000.0;
        hyperspace.push(
            commands
                .spawn((
                    Mesh3d(line_mesh.clone()),
                    MeshMaterial3d(hyper_mat.clone()),
                    Transform::from_xyz(
                        angle.cos() * r,
                        angle.sin() * r,
                        1000.0 + rand::thread_rng().gen::<f32>() * 2000.0,
                    ),
                    TemplateMarker,
                ))
                .id(),
        );
    }

    let dust_mesh = meshes.add(Cuboid::from_size(Vec3::splat(1.2)));
    let dust_mat = materials.add(StandardMaterial {
        base_color: Color::WHITE,
        unlit: true,
        ..default()
    });
    let mut dust_entities = Vec::new();
    for _ in 0..1000 {
        dust_entities.push(
            commands
                .spawn((
                    Mesh3d(dust_mesh.clone()),
                    MeshMaterial3d(dust_mat.clone()),
                    Transform::from_xyz(
                        (rand::thread_rng().gen::<f32>() - 0.5) * 1500.0,
                        (rand::thread_rng().gen::<f32>() - 0.5) * 1500.0,
                        rand::thread_rng().gen::<f32>() * 1000.0,
                    ),
                    TemplateMarker,
                ))
                .id(),
        );
    }

    commands.insert_resource(TrapState {
        t: 0.0,
        bars,
        bars_inner,
        hyperspace,
        dust_entities,
        square,
        bar_mat,
        hyper_mat,
    });
}

pub fn trap_render_system(
    state: Option<ResMut<TrapState>>,
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
    let fft = &audio.fft;

    let (p_r, p_g, p_b) = if config.dynamic_colors {
        let base_hue = (state.t * 0.15) % 1.0;
        let (r, g, b) = hsl_to_rgb(base_hue, 0.85, 0.4 + bass * 0.3);
        (r, g, b)
    } else {
        (
            config.colors.r / 255.0,
            config.colors.g / 255.0,
            config.colors.b / 255.0,
        )
    };
    let (a_r, a_g, a_b) = if config.dynamic_colors {
        let base_hue = (state.t * 0.15) % 1.0;
        let (r, g, b) = hsl_to_rgb((base_hue + 0.3) % 1.0, 0.9, 0.5 + treble * 0.3);
        (r, g, b)
    } else {
        (
            config.light.r / 255.0,
            config.light.g / 255.0,
            config.light.b / 255.0,
        )
    };

    if let Ok(mut t) = transforms.get_mut(state.square) {
        t.scale = Vec3::splat(240.0 * 1.1 + bass * 120.0);
        t.rotation = Quat::from_rotation_z(state.t * 0.01 + bass * 0.05);
    }
    if let Some(mat) = materials.get_mut(&state.bar_mat) {
        mat.base_color = Color::srgb(p_r, p_g, p_b);
    }

    for i in 0..state.bars.len() {
        let segment = state.bars.len() / 4;
        let sub_idx = i % segment;
        let mirrored = if sub_idx < segment / 2 {
            sub_idx
        } else {
            segment - sub_idx
        };
        let fft_idx = ((mirrored as f32 / (segment as f32 / 2.0)) * 120.0) as usize;
        let fft_val = fft.get(fft_idx).copied().unwrap_or(0.0);
        let target = 2.0 + fft_val * 350.0 * (1.0 + bass * 0.5);
        if let Ok(mut t) = transforms.get_mut(state.bars[i]) {
            t.scale.y += (target - t.scale.y) * 0.6;
        }
        let inner = fft.get(mirrored + 10).copied().unwrap_or(0.0);
        let inner_target = 1.0 + inner * 80.0;
        if let Ok(mut t) = transforms.get_mut(state.bars_inner[i]) {
            t.scale.y += (inner_target - t.scale.y) * 0.4;
        }
    }

    if let Some(mat) = materials.get_mut(&state.hyper_mat) {
        mat.base_color = Color::srgb(a_r, a_g, a_b);
    }

    let boost = 1.0 + bass * 5.0;
    for &e in &state.hyperspace {
        if let Ok(mut t) = transforms.get_mut(e) {
            t.translation.z -= 50.0 * boost;
            if t.translation.z < -500.0 {
                let angle = rand::thread_rng().gen::<f32>() * std::f32::consts::TAU;
                let r = 300.0 + rand::thread_rng().gen::<f32>() * 1000.0;
                t.translation = Vec3::new(
                    angle.cos() * r,
                    angle.sin() * r,
                    1000.0 + rand::thread_rng().gen::<f32>() * 2000.0,
                );
            }
        }
    }

    let dust_boost = 1.0 + bass * 10.0;
    for &e in &state.dust_entities {
        if let Ok(mut t) = transforms.get_mut(e) {
            t.translation.z -= 5.0 * dust_boost;
            if t.translation.z < -200.0 {
                t.translation = Vec3::new(
                    (rand::thread_rng().gen::<f32>() - 0.5) * 1500.0,
                    (rand::thread_rng().gen::<f32>() - 0.5) * 1500.0,
                    900.0,
                );
            }
        }
    }
}

pub fn hsl_to_rgb(h: f32, s: f32, l: f32) -> (f32, f32, f32) {
    if s == 0.0 {
        return (l, l, l);
    }
    let f = |p: f32, q: f32, t: f32| -> f32 {
        let t = if t < 0.0 {
            t + 1.0
        } else if t > 1.0 {
            t - 1.0
        } else {
            t
        };
        if t < 1.0 / 6.0 {
            p + (q - p) * 6.0 * t
        } else if t < 1.0 / 2.0 {
            q
        } else if t < 2.0 / 3.0 {
            p + (q - p) * (2.0 / 3.0 - t) * 6.0
        } else {
            p
        }
    };
    let q = if l < 0.5 {
        l * (1.0 + s)
    } else {
        l + s - l * s
    };
    let p = 2.0 * l - q;
    (f(p, q, h + 1.0 / 3.0), f(p, q, h), f(p, q, h - 1.0 / 3.0))
}

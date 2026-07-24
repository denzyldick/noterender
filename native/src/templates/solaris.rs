use bevy::prelude::*;
use rand::Rng;

use crate::audio::AudioState;
use crate::config::Config;
use crate::templates::TemplateMarker;

#[derive(Resource)]
pub struct SolarisState {
    pub t: f32,
    pub sun: Entity,
    pub sun_mat: Handle<StandardMaterial>,
    pub aster_mat: Handle<StandardMaterial>,
    pub asteroids: Vec<AsteroidData>,
}

pub struct AsteroidData {
    pub entity: Entity,
    pub angle: f32,
    pub radius: f32,
    pub speed: f32,
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
    let template = &config.templates.solaris;

    let sun_mat = materials.add(StandardMaterial {
        base_color: Color::srgb(pr, pg, pb),
        unlit: true,
        ..default()
    });
    let sun = commands
        .spawn((
            Mesh3d(meshes.add(Sphere::new(template.sun_size * 0.5).mesh().ico(12).unwrap())),
            MeshMaterial3d(sun_mat.clone()),
            Transform::from_xyz(0.0, 0.0, 0.0),
            TemplateMarker,
        ))
        .id();

    let rock = meshes.add(Sphere::new(2.5).mesh().ico(2).unwrap());
    let aster_mat = materials.add(StandardMaterial {
        base_color: Color::srgb(lr * 0.5, lg * 0.5, lb * 0.5),
        unlit: true,
        ..default()
    });

    let mut asteroids = Vec::new();
    for _ in 0..template.asteroids {
        let angle = rand::thread_rng().gen::<f32>() * std::f32::consts::TAU;
        let radius = 280.0 + rand::thread_rng().gen::<f32>() * 180.0;
        asteroids.push(AsteroidData {
            entity: commands
                .spawn((
                    Mesh3d(rock.clone()),
                    MeshMaterial3d(aster_mat.clone()),
                    Transform::from_xyz(
                        angle.cos() * radius,
                        (rand::thread_rng().gen::<f32>() - 0.5) * 80.0,
                        angle.sin() * radius,
                    ),
                    TemplateMarker,
                ))
                .id(),
            angle,
            radius,
            speed: (0.002 + rand::thread_rng().gen::<f32>() * 0.005) * template.orbit_speed,
        });
    }

    commands.insert_resource(SolarisState {
        t: 0.0,
        sun,
        sun_mat,
        aster_mat,
        asteroids,
    });
}

pub fn solaris_render_system(
    state: Option<ResMut<SolarisState>>,
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

    state.t += 0.005;
    let bass = audio.bass;
    let treble = audio.treble;
    let template = &config.templates.solaris;

    let (p_r, p_g, p_b) = if config.dynamic_colors {
        (bass, 0.4, 1.0 - bass)
    } else {
        (
            config.colors.r / 255.0,
            config.colors.g / 255.0,
            config.colors.b / 255.0,
        )
    };
    let (a_r, a_g, a_b) = if config.dynamic_colors {
        (1.0 - treble, treble, 0.5)
    } else {
        (
            config.light.r / 255.0,
            config.light.g / 255.0,
            config.light.b / 255.0,
        )
    };

    if let Ok(mut t) = transforms.get_mut(state.sun) {
        t.scale = Vec3::splat(
            (template.sun_size / 120.0) * (1.0 + bass * 0.5 + (state.t * 10.0).sin() * 0.05),
        );
    }
    if let Some(mat) = materials.get_mut(&state.sun_mat) {
        let i = 0.8 + bass * 0.2;
        mat.base_color = Color::srgb(p_r * i, p_g * i, p_b * i);
    }
    if let Some(mat) = materials.get_mut(&state.aster_mat) {
        mat.base_color = Color::srgb(a_r * (0.5 + bass), a_g * (0.5 + bass), a_b * (0.5 + bass));
    }

    for a in &mut state.asteroids {
        if let Ok(mut t) = transforms.get_mut(a.entity) {
            a.angle += a.speed * (1.0 + bass * 10.0);
            t.translation.x = a.angle.cos() * a.radius;
            t.translation.z = a.angle.sin() * a.radius;
            t.rotation = Quat::from_rotation_y(treble * 5.0);
            t.scale = Vec3::splat(1.0 + treble * 2.0);
        }
    }
}

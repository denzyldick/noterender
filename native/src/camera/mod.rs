use bevy::prelude::*;
use rand::Rng;

use crate::audio::AudioState;
use crate::config::Config;

pub struct CameraPlugin;

impl Plugin for CameraPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(CameraState::new())
            .add_systems(Update, update_camera);
    }
}

#[derive(Component)]
pub struct MainCameraMarker;

#[derive(Resource)]
pub struct CameraState {
    pub alpha: f32,
    pub beta: f32,
    pub radius: f32,
    pub target: Vec3,
    pub initial_beta: f32,
    pub initial_radius: f32,
    pub initial_target: Vec3,
    pub alpha_velocity: f32,
    pub t: f32,
    pub is_locked: bool,
}

impl CameraState {
    pub fn new() -> Self {
        Self {
            alpha: 0.0,
            beta: std::f32::consts::FRAC_PI_4,
            radius: 320.0,
            target: Vec3::ZERO,
            initial_beta: std::f32::consts::FRAC_PI_4,
            initial_radius: 320.0,
            initial_target: Vec3::ZERO,
            alpha_velocity: 0.001,
            t: 0.0,
            is_locked: false,
        }
    }
    #[allow(dead_code)]
    pub fn lock(&mut self) {
        self.is_locked = true;
    }
    #[allow(dead_code)]
    pub fn unlock(&mut self) {
        self.is_locked = false;
    }
}

pub fn update_camera(
    mut camera_state: ResMut<CameraState>,
    audio: Res<AudioState>,
    config: Res<Config>,
    mut query: Query<(&mut Transform, &mut Projection), With<MainCameraMarker>>,
) {
    if camera_state.is_locked {
        return;
    }
    let (mut transform, mut projection) = match query.get_single_mut() {
        Ok(t) => t,
        Err(_) => return,
    };

    let cam = &mut *camera_state;
    cam.t += 0.005;
    let smooth_bass = audio.smoothed_bass.max(audio.bass) * config.sensitivity.bass_boost.max(0.0);

    let target_alpha_vel = 0.0002 + smooth_bass * 0.004;
    cam.alpha_velocity += (target_alpha_vel - cam.alpha_velocity) * 0.05;
    cam.alpha += cam.alpha_velocity;

    let target_beta = cam.initial_beta + (cam.t * 0.5).sin() * 0.1 + smooth_bass * 0.05;
    cam.beta += (target_beta - cam.beta) * 0.05;

    let zoom_target = cam.initial_radius - smooth_bass * 70.0;
    cam.radius += (zoom_target - cam.radius) * 0.1;

    if smooth_bass > 0.8 {
        let mut rng = rand::thread_rng();
        cam.target.x = cam.initial_target.x + (rng.gen::<f32>() - 0.5) * smooth_bass * 10.0;
        cam.target.y = cam.initial_target.y + (rng.gen::<f32>() - 0.5) * smooth_bass * 10.0;
        cam.target.z = cam.initial_target.z + (rng.gen::<f32>() - 0.5) * smooth_bass * 10.0;
    } else {
        cam.target.x += (cam.initial_target.x - cam.target.x) * 0.1;
        cam.target.y += (cam.initial_target.y - cam.target.y) * 0.1;
        cam.target.z += (cam.initial_target.z - cam.target.z) * 0.1;
    }

    let x = cam.radius * cam.beta.sin() * cam.alpha.sin();
    let y = cam.radius * cam.beta.cos();
    let z = cam.radius * cam.beta.sin() * cam.alpha.cos();

    transform.translation = Vec3::new(x, y, z);
    transform.look_at(cam.target, Vec3::Y);

    if let Projection::Perspective(ref mut p) = *projection {
        let template = config.template.as_str();
        let template_fov = match template {
            "infinity" => config.templates.infinity.fov,
            "tunnel" => 0.8,
            "aether" => 0.95,
            _ => 0.9,
        };
        p.fov = template_fov + smooth_bass * 0.15;
    }
}

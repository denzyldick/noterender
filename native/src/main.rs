mod audio;
mod camera;
mod components;
mod config;
mod effects;
mod templates;
mod ui;

use bevy::prelude::*;
use bevy::window::Window;
use bevy::window::WindowPlugin;
use std::env;
use std::os::unix::net::UnixStream;
use std::path::PathBuf;

use camera::MainCameraMarker;
use config::Config;
use templates::advanced;
use templates::solaris;
use templates::terrain;
use templates::trap;
use templates::TemplateMarker;

fn main() {
    match runtime_mode() {
        RuntimeMode::Graphical => run_graphical(),
        RuntimeMode::Headless => run_headless(),
    }
}

fn run_graphical() {
    App::new()
        .add_plugins(DefaultPlugins.set(WindowPlugin {
            primary_window: Some(Window {
                title: "Noterender".into(),
                resolution: (1920.0, 1080.0).into(),
                ..default()
            }),
            ..default()
        }))
        .add_plugins(bevy_egui::EguiPlugin)
        .add_plugins((
            audio::AudioPlugin,
            camera::CameraPlugin,
            components::lights::LightsPlugin,
            components::plane::LogoPlugin,
            templates::TemplatePlugin,
            effects::EffectsPlugin,
            ui::UiPlugin,
        ))
        .insert_resource(ClearColor(Color::srgb(0.02, 0.02, 0.04)))
        .insert_resource(Config::default())
        .init_resource::<CurrentTemplate>()
        .add_systems(Startup, setup_camera)
        .add_systems(Startup, init_default_template)
        .add_systems(Update, template_switch_system)
        .run();
}

fn run_headless() {
    App::new()
        .add_plugins(MinimalPlugins)
        .add_plugins((
            audio::AudioPlugin,
            camera::CameraPlugin,
            components::lights::LightsPlugin,
            components::plane::LogoPlugin,
            templates::TemplatePlugin,
            effects::EffectsPlugin,
        ))
        .insert_resource(ClearColor(Color::srgb(0.02, 0.02, 0.04)))
        .insert_resource(Config::default())
        .init_resource::<CurrentTemplate>()
        .add_systems(Startup, setup_camera)
        .add_systems(Startup, init_default_template)
        .add_systems(Update, template_switch_system)
        .run();
}

enum RuntimeMode {
    Graphical,
    Headless,
}

fn runtime_mode() -> RuntimeMode {
    if let Some(backend) = detected_unix_backend() {
        env::set_var("WINIT_UNIX_BACKEND", backend);
        RuntimeMode::Graphical
    } else {
        env::set_var("NOTERENDER_HEADLESS", "1");
        eprintln!(
            "No reachable X11 or Wayland display detected; running headless so the app can start."
        );
        RuntimeMode::Headless
    }
}

fn detected_unix_backend() -> Option<&'static str> {
    if let Some(display) = env::var_os("DISPLAY") {
        if x11_socket_exists(&display) && try_connect_x11(&display) {
            return Some("x11");
        }
    }

    if let Some(wayland) = env::var_os("WAYLAND_DISPLAY") {
        if wayland_socket_exists(&wayland) && try_connect_wayland(&wayland) {
            return Some("wayland");
        }
    }

    None
}

fn x11_socket_exists(display: &std::ffi::OsStr) -> bool {
    let display = display.to_string_lossy();
    let display_num = display.split('.').next().unwrap_or("");
    let display_num = display_num.trim_start_matches(':');
    let mut path = PathBuf::from("/tmp/.X11-unix");
    path.push(format!("X{}", display_num));
    path.exists()
}

fn wayland_socket_exists(display: &std::ffi::OsStr) -> bool {
    if let Some(runtime_dir) = env::var_os("XDG_RUNTIME_DIR") {
        let mut path = PathBuf::from(runtime_dir);
        path.push(display);
        return path.exists();
    }
    false
}

fn try_connect_x11(display: &std::ffi::OsStr) -> bool {
    let display = display.to_string_lossy();
    let display_num = display.split('.').next().unwrap_or("");
    let display_num = display_num.trim_start_matches(':');
    let mut path = PathBuf::from("/tmp/.X11-unix");
    path.push(format!("X{}", display_num));
    UnixStream::connect(path).is_ok()
}

fn try_connect_wayland(display: &std::ffi::OsStr) -> bool {
    if let Some(runtime_dir) = env::var_os("XDG_RUNTIME_DIR") {
        let mut path = PathBuf::from(runtime_dir);
        path.push(display);
        return UnixStream::connect(path).is_ok();
    }
    false
}

#[derive(Resource, Default)]
struct CurrentTemplate(String);

fn setup_camera(mut commands: Commands) {
    commands.spawn((
        Camera3d::default(),
        Transform::from_xyz(0.0, 200.0, 400.0).looking_at(Vec3::ZERO, Vec3::Y),
        MainCameraMarker,
    ));
}

fn init_default_template(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    config: Res<Config>,
    mut current: ResMut<CurrentTemplate>,
) {
    match config.template.as_str() {
        "trap" => trap::init(&mut commands, &mut meshes, &mut materials, &config),
        "solaris" => solaris::init(&mut commands, &mut meshes, &mut materials, &config),
        "terrain" => terrain::init(&mut commands, &mut meshes, &mut materials, &config),
        "infinity" | "tunnel" | "city" | "nebulacore" | "aether" | "monolith" | "prism"
        | "flora" | "clouds" | "aurora" | "cathedral" | "oscillate" | "reactor" => advanced::init(
            &config.template,
            &mut commands,
            &mut meshes,
            &mut materials,
            &config,
        ),
        _ => trap::init(&mut commands, &mut meshes, &mut materials, &config),
    }
    current.0 = config.template.clone();
}

fn template_switch_system(
    config: Res<Config>,
    mut current: ResMut<CurrentTemplate>,
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    template_markers: Query<Entity, With<TemplateMarker>>,
) {
    if current.0 == config.template {
        return;
    }

    for e in &template_markers {
        commands.entity(e).despawn_recursive();
    }

    commands.remove_resource::<trap::TrapState>();
    commands.remove_resource::<solaris::SolarisState>();
    commands.remove_resource::<terrain::TerrainState>();
    commands.remove_resource::<advanced::AdvancedState>();

    match config.template.as_str() {
        "trap" => trap::init(&mut commands, &mut meshes, &mut materials, &config),
        "solaris" => solaris::init(&mut commands, &mut meshes, &mut materials, &config),
        "terrain" => terrain::init(&mut commands, &mut meshes, &mut materials, &config),
        "infinity" | "tunnel" | "city" | "nebulacore" | "aether" | "monolith" | "prism"
        | "flora" | "clouds" | "aurora" | "cathedral" | "oscillate" | "reactor" => advanced::init(
            &config.template,
            &mut commands,
            &mut meshes,
            &mut materials,
            &config,
        ),
        _ => {}
    }

    current.0 = config.template.clone();
}

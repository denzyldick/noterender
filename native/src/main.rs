mod audio;
mod camera;
mod components;
mod config;
mod effects;
mod io;
mod templates;
mod ui;
mod windows;

use bevy::prelude::*;
use bevy::render::camera::{Camera, RenderTarget};
use bevy::window::{
    Monitor, MonitorSelection, PrimaryWindow, WindowMode, WindowPosition, WindowRef,
    WindowResolution,
};
use std::time::Duration;
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
use windows::{MonitorInfo, MonitorList, WindowEntities};

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
                title: "Noterender - Control".into(),
                resolution: WindowResolution::new(1280.0, 800.0),
                position: WindowPosition::Centered(MonitorSelection::Index(0)),
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
        .insert_resource(io::load_config())
        .init_resource::<CurrentTemplate>()
        .add_systems(Startup, setup_windows)
        .add_systems(Startup, init_default_template)
        .add_systems(Update, (template_switch_system, fullscreen_toggle_system, auto_save_config))
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
        .insert_resource(io::load_config())
        .init_resource::<CurrentTemplate>()
        .add_systems(Startup, setup_windows_headless)
        .add_systems(Startup, init_default_template)
        .add_systems(Update, (template_switch_system, auto_save_config))
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

fn setup_windows(
    mut commands: Commands,
    monitors: Query<(Entity, &Monitor)>,
    primary_window: Query<Entity, With<PrimaryWindow>>,
) {
    let control_window = primary_window.single();

    let mut monitor_list = MonitorList::default();
    for (i, (entity, monitor)) in monitors.iter().enumerate() {
        let name = monitor.name.clone().unwrap_or_else(|| format!("Monitor {}", i));
        monitor_list.monitors.push(MonitorInfo {
            entity,
            name,
            width: monitor.physical_width,
            height: monitor.physical_height,
            index: i,
        });
    }
    let monitor_count = monitor_list.monitors.len();
    let second_monitor_index = if monitor_count > 1 {
        Some(monitor_list.monitors[1].index)
    } else {
        None
    };
    commands.insert_resource(monitor_list);

    let visualizer_window = if let Some(idx) = second_monitor_index {
        commands
            .spawn(Window {
                title: "Noterender - Visualizer".into(),
                mode: WindowMode::BorderlessFullscreen(MonitorSelection::Index(idx)),
                position: WindowPosition::Centered(MonitorSelection::Index(idx)),
                ..default()
            })
            .id()
    } else {
        commands
            .spawn(Window {
                title: "Noterender - Visualizer".into(),
                resolution: WindowResolution::new(1280.0, 720.0),
                position: WindowPosition::Automatic,
                ..default()
            })
            .id()
    };

    commands.spawn((
        Camera3d::default(),
        Camera {
            target: RenderTarget::Window(WindowRef::Entity(visualizer_window)),
            ..default()
        },
        Transform::from_xyz(0.0, 200.0, 400.0).looking_at(Vec3::ZERO, Vec3::Y),
        MainCameraMarker,
    ));

    commands.insert_resource(WindowEntities {
        control: control_window,
        visualizer: visualizer_window,
    });
}

fn setup_windows_headless(mut commands: Commands) {
    let control_window = commands
        .spawn(Window {
            title: "Noterender - Control".into(),
            resolution: WindowResolution::new(1280.0, 800.0),
            ..default()
        })
        .id();

    let visualizer_window = commands
        .spawn(Window {
            title: "Noterender - Visualizer".into(),
            resolution: WindowResolution::new(1280.0, 720.0),
            ..default()
        })
        .id();

    commands.spawn((
        Camera3d::default(),
        Camera {
            target: RenderTarget::Window(WindowRef::Entity(visualizer_window)),
            ..default()
        },
        Transform::from_xyz(0.0, 200.0, 400.0).looking_at(Vec3::ZERO, Vec3::Y),
        MainCameraMarker,
    ));

    commands.insert_resource(WindowEntities {
        control: control_window,
        visualizer: visualizer_window,
    });
}

fn fullscreen_toggle_system(
    keyboard: Res<ButtonInput<KeyCode>>,
    mut windows: Query<&mut Window>,
    window_entities: Res<WindowEntities>,
) {
    if keyboard.just_pressed(KeyCode::F11) {
        if let Ok(mut window) = windows.get_mut(window_entities.visualizer) {
            window.mode = match window.mode {
                WindowMode::Windowed => WindowMode::BorderlessFullscreen(MonitorSelection::Current),
                _ => WindowMode::Windowed,
            };
        }
    }
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

#[derive(Resource)]
struct SaveTimer(Timer);

impl Default for SaveTimer {
    fn default() -> Self {
        Self(Timer::new(Duration::from_secs(5), TimerMode::Repeating))
    }
}

fn auto_save_config(
    time: Res<Time>,
    config: Res<Config>,
    mut timer: Local<SaveTimer>,
) {
    timer.0.tick(time.delta());
    if timer.0.just_finished() {
        io::save_config(&config);
    }
}

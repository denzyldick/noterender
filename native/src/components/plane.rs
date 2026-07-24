use bevy::prelude::*;

use crate::config::Config;
use crate::templates::TemplateMarker;

#[derive(Resource)]
pub struct LogoState {
    pub entity: Option<Entity>,
    pub current_path: String,
    pub current_style: String,
}

impl Default for LogoState {
    fn default() -> Self {
        Self {
            entity: None,
            current_path: String::new(),
            current_style: String::new(),
        }
    }
}

pub struct LogoPlugin;

impl Plugin for LogoPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<LogoState>()
            .add_systems(Update, update_logo);
    }
}

fn update_logo(
    mut state: ResMut<LogoState>,
    config: Res<Config>,
    asset_server: Res<AssetServer>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    mut meshes: ResMut<Assets<Mesh>>,
    mut commands: Commands,
    query: Query<Entity>,
) {
    let should_show = config.logo_style != "None" && !config.logo_path.is_empty();
    let path_changed = state.current_path != config.logo_path;
    let style_changed = state.current_style != config.logo_style;

    if let Some(e) = state.entity {
        if !should_show || path_changed || style_changed {
            if query.get(e).is_ok() {
                commands.entity(e).despawn();
            }
            state.entity = None;
        }
    }

    if !should_show {
        return;
    }

    if state.entity.is_none() {
        let (mesh, scale, z) = match config.logo_style.as_str() {
            "Minimal" => (
                meshes.add(Rectangle::from_size(Vec2::new(64.0, 32.0))),
                Vec3::splat(0.85),
                10.0,
            ),
            "Dot" => (meshes.add(Circle::new(34.0)), Vec3::splat(0.75), 10.0),
            _ => (
                meshes.add(Rectangle::from_size(Vec2::new(80.0, 40.0))),
                Vec3::ONE,
                10.0,
            ),
        };
        let material = materials.add(StandardMaterial {
            base_color_texture: Some(asset_server.load(&config.logo_path)),
            unlit: true,
            alpha_mode: AlphaMode::Blend,
            ..default()
        });

        let entity = commands
            .spawn((
                Mesh3d(mesh),
                MeshMaterial3d(material),
                Transform::from_xyz(0.0, 0.0, z).with_scale(scale),
                TemplateMarker,
            ))
            .id();

        state.entity = Some(entity);
        state.current_path = config.logo_path.clone();
        state.current_style = config.logo_style.clone();
    }
}

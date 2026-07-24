use bevy::prelude::*;

pub struct LightsPlugin;

#[derive(Component)]
pub struct BaseIntensity(pub f32);

impl Plugin for LightsPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Startup, setup_lights);
    }
}

fn setup_lights(mut commands: Commands) {
    commands.spawn((
        PointLight {
            intensity: 1000.0,
            ..default()
        },
        Transform::from_xyz(0.0, 0.0, 100.0),
        BaseIntensity(1000.0),
    ));
    commands.spawn((
        PointLight {
            intensity: 1000.0,
            ..default()
        },
        Transform::from_xyz(0.0, 500.0, 10.0),
        BaseIntensity(1000.0),
    ));
}

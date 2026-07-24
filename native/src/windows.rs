use bevy::prelude::*;

#[derive(Resource)]
pub struct WindowEntities {
    pub control: Entity,
    pub visualizer: Entity,
}

#[derive(Resource, Default)]
pub struct MonitorList {
    pub monitors: Vec<MonitorInfo>,
}

#[derive(Clone, Debug)]
#[allow(dead_code)]
pub struct MonitorInfo {
    pub entity: Entity,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub index: usize,
}

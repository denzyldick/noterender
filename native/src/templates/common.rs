use crate::config::Config;

pub fn primary_rgb(config: &Config) -> (f32, f32, f32) {
    (
        config.colors.r / 255.0,
        config.colors.g / 255.0,
        config.colors.b / 255.0,
    )
}

pub fn accent_rgb(config: &Config) -> (f32, f32, f32) {
    (
        config.light.r / 255.0,
        config.light.g / 255.0,
        config.light.b / 255.0,
    )
}

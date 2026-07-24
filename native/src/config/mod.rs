use bevy::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Resource, Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct Config {
    pub template: String,
    pub active_effects: Vec<String>,
    pub colors: ColorConfig,
    pub light: ColorConfig,
    pub dynamic_colors: bool,
    pub sensitivity: SensitivityConfig,
    pub options: OptionsConfig,
    pub templates: TemplateSettings,
    pub logo_style: String,
    pub logo_path: String,
    pub title: String,
    pub subtitle: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct TemplateSettings {
    pub trap: TrapConfig,
    pub solaris: SolarisConfig,
    pub terrain: TerrainConfig,
    pub infinity: InfinityConfig,
    pub tunnel: TunnelConfig,
    pub city: CityConfig,
    pub nebulacore: NebulacoreConfig,
    pub aether: AetherConfig,
    pub monolith: MonolithConfig,
    pub prism: PrismConfig,
    pub flora: FloraConfig,
    pub clouds: CloudsConfig,
    pub aurora: AuroraConfig,
    pub cathedral: CathedralConfig,
    pub oscillate: OscillateConfig,
    pub reactor: ReactorConfig,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct ColorConfig {
    pub r: f32,
    pub g: f32,
    pub b: f32,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct SensitivityConfig {
    pub fft_smoothing: f32,
    pub bass_boost: f32,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct OptionsConfig {
    pub camera: CameraOptions,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct CameraOptions {
    pub r#move: bool,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct TrapConfig {
    pub bars: usize,
    pub radius: f32,
    pub bar_width: f32,
    pub hyperspace: usize,
    pub glow: f32,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct SolarisConfig {
    pub sun_size: f32,
    pub asteroids: usize,
    pub ray_intensity: f32,
    pub orbit_speed: f32,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct TerrainConfig {
    pub roughness: f32,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct InfinityConfig {
    pub speed: f32,
    pub fov: f32,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct TunnelConfig {
    pub repetition: usize,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct CityConfig {
    pub height: f32,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct NebulacoreConfig {
    pub rings: usize,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct AetherConfig {
    pub wave_height: f32,
    pub speed: f32,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct MonolithConfig {
    pub cube_count: usize,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct PrismConfig {
    pub prism_count: usize,
    pub speed: f32,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct FloraConfig {
    pub leaf_count: usize,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct CloudsConfig {
    pub cloud_count: usize,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct AuroraConfig {
    pub ribbon_count: usize,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct CathedralConfig {
    pub arch_count: usize,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct OscillateConfig {
    pub bar_count: usize,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct ReactorConfig {
    pub ring_count: usize,
}

impl Default for TemplateSettings {
    fn default() -> Self {
        Self {
            trap: TrapConfig::default(),
            solaris: SolarisConfig::default(),
            terrain: TerrainConfig::default(),
            infinity: InfinityConfig::default(),
            tunnel: TunnelConfig::default(),
            city: CityConfig::default(),
            nebulacore: NebulacoreConfig::default(),
            aether: AetherConfig::default(),
            monolith: MonolithConfig::default(),
            prism: PrismConfig::default(),
            flora: FloraConfig::default(),
            clouds: CloudsConfig::default(),
            aurora: AuroraConfig::default(),
            cathedral: CathedralConfig::default(),
            oscillate: OscillateConfig::default(),
            reactor: ReactorConfig::default(),
        }
    }
}

impl Default for TrapConfig {
    fn default() -> Self {
        Self {
            bars: 256,
            radius: 225.0,
            bar_width: 1.5,
            hyperspace: 800,
            glow: 48.0,
        }
    }
}

impl Default for ColorConfig {
    fn default() -> Self {
        Self {
            r: 0.0,
            g: 229.0,
            b: 255.0,
        }
    }
}

impl Default for SensitivityConfig {
    fn default() -> Self {
        Self {
            fft_smoothing: 0.8,
            bass_boost: 1.0,
        }
    }
}

impl Default for OptionsConfig {
    fn default() -> Self {
        Self {
            camera: CameraOptions::default(),
        }
    }
}

impl Default for CameraOptions {
    fn default() -> Self {
        Self { r#move: true }
    }
}

impl Default for SolarisConfig {
    fn default() -> Self {
        Self {
            sun_size: 120.0,
            asteroids: 300,
            ray_intensity: 0.8,
            orbit_speed: 1.0,
        }
    }
}

impl Default for TerrainConfig {
    fn default() -> Self {
        Self { roughness: 50.0 }
    }
}

impl Default for InfinityConfig {
    fn default() -> Self {
        Self {
            speed: 1.0,
            fov: 1.0,
        }
    }
}

impl Default for TunnelConfig {
    fn default() -> Self {
        Self { repetition: 5 }
    }
}

impl Default for CityConfig {
    fn default() -> Self {
        Self { height: 200.0 }
    }
}

impl Default for NebulacoreConfig {
    fn default() -> Self {
        Self { rings: 10 }
    }
}

impl Default for AetherConfig {
    fn default() -> Self {
        Self {
            wave_height: 40.0,
            speed: 1.0,
        }
    }
}

impl Default for MonolithConfig {
    fn default() -> Self {
        Self { cube_count: 400 }
    }
}

impl Default for PrismConfig {
    fn default() -> Self {
        Self {
            prism_count: 40,
            speed: 1.0,
        }
    }
}

impl Default for FloraConfig {
    fn default() -> Self {
        Self { leaf_count: 1000 }
    }
}

impl Default for CloudsConfig {
    fn default() -> Self {
        Self { cloud_count: 180 }
    }
}

impl Default for AuroraConfig {
    fn default() -> Self {
        Self { ribbon_count: 14 }
    }
}

impl Default for CathedralConfig {
    fn default() -> Self {
        Self { arch_count: 15 }
    }
}

impl Default for OscillateConfig {
    fn default() -> Self {
        Self { bar_count: 96 }
    }
}

impl Default for ReactorConfig {
    fn default() -> Self {
        Self { ring_count: 48 }
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            template: "trap".into(),
            active_effects: vec![],
            colors: ColorConfig {
                r: 0.0,
                g: 229.0,
                b: 255.0,
            },
            light: ColorConfig {
                r: 0.0,
                g: 229.0,
                b: 255.0,
            },
            dynamic_colors: true,
            sensitivity: SensitivityConfig {
                fft_smoothing: 0.8,
                bass_boost: 1.0,
            },
            options: OptionsConfig {
                camera: CameraOptions { r#move: true },
            },
            templates: TemplateSettings::default(),
            logo_style: "Original".into(),
            logo_path: "logo.png".into(),
            title: "Noterender".into(),
            subtitle: "Elevate Your Sound".into(),
        }
    }
}

use bevy::prelude::*;

pub struct UiPlugin;

impl Plugin for UiPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Update, render_ui);
    }
}

fn render_ui(
    mut egui_context: bevy_egui::EguiContexts,
    mut config: ResMut<crate::config::Config>,
    camera_state: Res<crate::camera::CameraState>,
    audio: Res<crate::audio::AudioState>,
) {
    use bevy_egui::egui::*;

    let ctx = egui_context.ctx_mut();
    let template = config.template.clone();

    Area::new("hud".into())
        .anchor(Align2::LEFT_BOTTOM, vec2(16.0, -16.0))
        .interactable(false)
        .show(ctx, |ui| {
            Frame::none()
                .fill(Color32::from_rgba_unmultiplied(10, 12, 18, 210))
                .rounding(Rounding::same(12.0))
                .inner_margin(Margin::same(12.0))
                .show(ui, |ui| {
                    ui.label(RichText::new(&config.title).strong().size(18.0));
                    ui.label(RichText::new(&config.subtitle).color(Color32::from_gray(192)));
                    ui.add_space(6.0);
                    ui.label(format!("Template: {}", template));
                    ui.label(format!(
                        "Bass: {:.3}  Treble: {:.3}",
                        audio.bass, audio.treble
                    ));
                    ui.label(format!(
                        "Camera: alpha {:.2} beta {:.2} radius {:.1}",
                        camera_state.alpha, camera_state.beta, camera_state.radius
                    ));
                });
        });

    TopBottomPanel::top("toolbar").show(ctx, |ui| {
        ui.horizontal_wrapped(|ui| {
            ui.label(RichText::new("Template").strong());
            for name in template_names() {
                ui.selectable_value(&mut config.template, name.to_string(), name);
            }
            ui.separator();
            ui.checkbox(&mut config.options.camera.r#move, "Camera");
            ui.checkbox(&mut config.dynamic_colors, "Dynamic Colors");
        });
    });

    SidePanel::left("sidebar").resizable(true).show(ctx, |ui| {
        ui.heading("Visuals");
        ui.label("Color Settings");
        ui.add(Slider::new(&mut config.colors.r, 0.0..=255.0).text("R"));
        ui.add(Slider::new(&mut config.colors.g, 0.0..=255.0).text("G"));
        ui.add(Slider::new(&mut config.colors.b, 0.0..=255.0).text("B"));
        ui.separator();
        ui.label("Light Color");
        ui.add(Slider::new(&mut config.light.r, 0.0..=255.0).text("R"));
        ui.add(Slider::new(&mut config.light.g, 0.0..=255.0).text("G"));
        ui.add(Slider::new(&mut config.light.b, 0.0..=255.0).text("B"));
        ui.separator();
        ui.label("Sensitivity");
        ui.add(
            Slider::new(&mut config.sensitivity.fft_smoothing, 0.0..=0.99).text("FFT Smoothing"),
        );
        ui.add(Slider::new(&mut config.sensitivity.bass_boost, 0.5..=3.0).text("Bass Boost"));
        ui.separator();
        ui.label("Branding");
        ui.text_edit_singleline(&mut config.title);
        ui.text_edit_singleline(&mut config.subtitle);
        ui.horizontal(|ui| {
            ui.label("Logo");
            ui.selectable_value(&mut config.logo_style, "None".to_string(), "None");
            ui.selectable_value(&mut config.logo_style, "Original".to_string(), "Original");
            ui.selectable_value(&mut config.logo_style, "Minimal".to_string(), "Minimal");
            ui.selectable_value(&mut config.logo_style, "Dot".to_string(), "Dot");
        });
        ui.text_edit_singleline(&mut config.logo_path);
        ui.separator();
        ui.label("Template Config");
        render_template_controls(ui, &mut config);
    });

    SidePanel::right("effects_panel")
        .resizable(true)
        .show(ctx, |ui| {
            ui.heading("Effects");
            for n in [
                "thunder",
                "grid",
                "vignette",
                "bloom",
                "smoke",
                "birds",
                "glitch",
                "fireflies",
                "rain",
                "shockwave",
                "lasers",
                "dust",
                "crystals",
            ] {
                let mut is_active = config.active_effects.iter().any(|e| e == n);
                if ui.checkbox(&mut is_active, n).changed() {
                    if is_active {
                        if !config.active_effects.iter().any(|e| e == n) {
                            config.active_effects.push(n.to_string());
                        }
                    } else {
                        config.active_effects.retain(|e| e != n);
                    }
                }
            }

            ui.separator();
            ui.label(format!("Bass: {:.3}", audio.bass));
            ui.label(format!("Treble: {:.3}", audio.treble));
            ui.label(format!("Punch Bass: {:.3}", audio.punch_bass));
            ui.label(format!("Alpha: {:.3}", camera_state.alpha));
            ui.label(format!("Beta: {:.3}", camera_state.beta));
        });
}

fn template_names() -> [&'static str; 16] {
    [
        "trap",
        "solaris",
        "terrain",
        "infinity",
        "tunnel",
        "city",
        "nebulacore",
        "aether",
        "monolith",
        "prism",
        "flora",
        "clouds",
        "aurora",
        "cathedral",
        "oscillate",
        "reactor",
    ]
}

fn render_template_controls(ui: &mut bevy_egui::egui::Ui, config: &mut crate::config::Config) {
    match config.template.as_str() {
        "trap" => {
            let t = &mut config.templates.trap;
            ui.add(bevy_egui::egui::Slider::new(&mut t.bars, 64..=512).text("Bars"));
            ui.add(bevy_egui::egui::Slider::new(&mut t.radius, 100.0..=400.0).text("Radius"));
            ui.add(bevy_egui::egui::Slider::new(&mut t.bar_width, 0.1..=5.0).text("Bar Width"));
            ui.add(bevy_egui::egui::Slider::new(&mut t.hyperspace, 0..=2000).text("Star Density"));
            ui.add(bevy_egui::egui::Slider::new(&mut t.glow, 0.0..=100.0).text("Glow"));
        }
        "solaris" => {
            let t = &mut config.templates.solaris;
            ui.add(bevy_egui::egui::Slider::new(&mut t.sun_size, 50.0..=300.0).text("Sun Size"));
            ui.add(bevy_egui::egui::Slider::new(&mut t.asteroids, 50..=1000).text("Asteroids"));
            ui.add(
                bevy_egui::egui::Slider::new(&mut t.ray_intensity, 0.1..=2.0).text("Ray Intensity"),
            );
            ui.add(bevy_egui::egui::Slider::new(&mut t.orbit_speed, 0.1..=5.0).text("Orbit Speed"));
        }
        "terrain" => {
            let t = &mut config.templates.terrain;
            ui.add(bevy_egui::egui::Slider::new(&mut t.roughness, 0.0..=200.0).text("Roughness"));
        }
        "infinity" => {
            let t = &mut config.templates.infinity;
            ui.add(bevy_egui::egui::Slider::new(&mut t.speed, 0.1..=10.0).text("Speed"));
            ui.add(bevy_egui::egui::Slider::new(&mut t.fov, 0.5..=2.0).text("FOV"));
        }
        "tunnel" => {
            let t = &mut config.templates.tunnel;
            ui.add(bevy_egui::egui::Slider::new(&mut t.repetition, 1..=10).text("Depth"));
        }
        "city" => {
            let t = &mut config.templates.city;
            ui.add(
                bevy_egui::egui::Slider::new(&mut t.height, 50.0..=500.0).text("Building Height"),
            );
        }
        "nebulacore" => {
            let t = &mut config.templates.nebulacore;
            ui.add(bevy_egui::egui::Slider::new(&mut t.rings, 1..=20).text("Rings"));
        }
        "aether" => {
            let t = &mut config.templates.aether;
            ui.add(
                bevy_egui::egui::Slider::new(&mut t.wave_height, 10.0..=150.0).text("Wave Height"),
            );
            ui.add(bevy_egui::egui::Slider::new(&mut t.speed, 0.1..=5.0).text("Speed"));
        }
        "monolith" => {
            let t = &mut config.templates.monolith;
            ui.add(bevy_egui::egui::Slider::new(&mut t.cube_count, 100..=1000).text("Cube Count"));
        }
        "prism" => {
            let t = &mut config.templates.prism;
            ui.add(bevy_egui::egui::Slider::new(&mut t.prism_count, 10..=100).text("Prism Count"));
            ui.add(bevy_egui::egui::Slider::new(&mut t.speed, 0.1..=5.0).text("Speed"));
        }
        "flora" => {
            let t = &mut config.templates.flora;
            ui.add(bevy_egui::egui::Slider::new(&mut t.leaf_count, 200..=5000).text("Leaf Count"));
        }
        "clouds" => {
            let t = &mut config.templates.clouds;
            ui.add(bevy_egui::egui::Slider::new(&mut t.cloud_count, 10..=1000).text("Cloud Count"));
        }
        "aurora" => {
            let t = &mut config.templates.aurora;
            ui.add(bevy_egui::egui::Slider::new(&mut t.ribbon_count, 1..=50).text("Ribbon Count"));
        }
        "cathedral" => {
            let t = &mut config.templates.cathedral;
            ui.add(bevy_egui::egui::Slider::new(&mut t.arch_count, 1..=50).text("Arch Count"));
        }
        "oscillate" => {
            let t = &mut config.templates.oscillate;
            ui.add(bevy_egui::egui::Slider::new(&mut t.bar_count, 16..=256).text("Bar Count"));
        }
        "reactor" => {
            let t = &mut config.templates.reactor;
            ui.add(bevy_egui::egui::Slider::new(&mut t.ring_count, 1..=128).text("Ring Count"));
        }
        _ => {}
    }
}

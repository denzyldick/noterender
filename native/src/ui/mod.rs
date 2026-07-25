use bevy::prelude::*;
use bevy::window::{MonitorSelection, WindowMode, WindowPosition};
use crossbeam_channel::TryRecvError;

use crate::network::Shoutout;
use crate::recording::RecordingState;
use crate::windows::{MonitorList, WindowEntities};

#[derive(Resource)]
pub struct AuthState {
    pub logged_in: bool,
    pub email: String,
    pub password: String,
    pub confirm_password: String,
    pub mode: AuthMode,
    pub error: String,
    pub loading: bool,
    pub receiver: Option<crossbeam_channel::Receiver<Result<(String, String), String>>>,
}

#[derive(PartialEq)]
pub enum AuthMode {
    Login,
    Register,
}

impl Default for AuthState {
    fn default() -> Self {
        Self {
            logged_in: false,
            email: String::new(),
            password: String::new(),
            confirm_password: String::new(),
            mode: AuthMode::Login,
            error: String::new(),
            loading: false,
            receiver: None,
        }
    }
}

#[derive(Resource)]
pub struct DjState {
    pub pending_shoutouts: Vec<Shoutout>,
    pub announcement_text: String,
    pub announcement_visible: bool,
    pub announcement_duration: f32,
    pub poll_rx: Option<crossbeam_channel::Receiver<Result<Vec<Shoutout>, String>>>,
    pub action_rx: Option<crossbeam_channel::Receiver<Result<(), String>>>,
    pub last_poll: f64,
}

impl Default for DjState {
    fn default() -> Self {
        Self {
            pending_shoutouts: Vec::new(),
            announcement_text: String::new(),
            announcement_visible: false,
            announcement_duration: 5.0,
            poll_rx: None,
            action_rx: None,
            last_poll: 0.0,
        }
    }
}

pub struct UiPlugin;

impl Plugin for UiPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<AuthState>()
            .init_resource::<DjState>()
            .add_systems(
                Update,
                (
                    render_ui,
                    poll_auth_response,
                    render_auth_overlay,
                    poll_dj_shoutouts,
                    handle_dj_action,
                ),
            );
    }
}

fn render_ui(
    mut egui_context: bevy_egui::EguiContexts,
    mut config: ResMut<crate::config::Config>,
    camera_state: Res<crate::camera::CameraState>,
    audio: Res<crate::audio::AudioState>,
    window_entities: Res<WindowEntities>,
    monitor_list: Res<MonitorList>,
    mut windows: Query<&mut Window>,
    mut recording_state: ResMut<RecordingState>,
    auth: Res<AuthState>,
    mut dj: ResMut<DjState>,
) {
    use bevy_egui::egui::*;

    let ctx = egui_context.ctx_for_entity_mut(window_entities.control);
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

        if auth.logged_in {
            ui.separator();
            ui.collapsing("DJ Panel", |ui| {
                ui.label("Announcements");
                ui.text_edit_singleline(&mut dj.announcement_text);
                ui.add(Slider::new(&mut dj.announcement_duration, 1.0..=30.0).text("Duration (s)"));
                if ui.button("Show Announcement").clicked() && !dj.announcement_text.is_empty() {
                    dj.announcement_visible = true;
                }
                if ui.button("Hide Announcement").clicked() {
                    dj.announcement_visible = false;
                }

                ui.separator();
                ui.label(format!("Pending Shoutouts: {}", dj.pending_shoutouts.len()));

                let to_approve: Vec<i64> = dj.pending_shoutouts.iter().filter_map(|s| {
                    if ui.button(format!("Approve: {} - {}", s.name, s.message)).clicked() {
                        Some(s.id)
                    } else {
                        None
                    }
                }).collect();

                let to_reject: Vec<i64> = dj.pending_shoutouts.iter().filter_map(|s| {
                    if ui.button(format!("Reject: {} - {}", s.name, s.message)).clicked() {
                        Some(s.id)
                    } else {
                        None
                    }
                }).collect();

                for id in to_approve {
                    if let Some(token) = &config.auth_token {
                        let (tx, rx) = crossbeam_channel::unbounded();
                        dj.action_rx = Some(rx);
                        let token = token.clone();
                        std::thread::spawn(move || {
                            let rt = tokio::runtime::Runtime::new().unwrap();
                            let result = rt.block_on(crate::network::approve_shoutout(&token, id, "approved"));
                            let _ = tx.send(result);
                        });
                    }
                }
                for id in to_reject {
                    if let Some(token) = &config.auth_token {
                        let (tx, rx) = crossbeam_channel::unbounded();
                        dj.action_rx = Some(rx);
                        let token = token.clone();
                        std::thread::spawn(move || {
                            let rt = tokio::runtime::Runtime::new().unwrap();
                            let result = rt.block_on(crate::network::approve_shoutout(&token, id, "rejected"));
                            let _ = tx.send(result);
                        });
                    }
                }
            });
        }
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

            ui.separator();
            ui.heading("Display");

            if let Ok(mut viz_window) = windows.get_mut(window_entities.visualizer) {
                let is_fullscreen = matches!(
                    viz_window.mode,
                    WindowMode::BorderlessFullscreen(_) | WindowMode::Fullscreen(_)
                );
                if ui
                    .button(if is_fullscreen {
                        "Exit Fullscreen (F11)"
                    } else {
                        "Fullscreen (F11)"
                    })
                    .clicked()
                {
                    viz_window.mode = if is_fullscreen {
                        WindowMode::Windowed
                    } else {
                        WindowMode::BorderlessFullscreen(MonitorSelection::Current)
                    };
                }

                if monitor_list.monitors.len() > 1 {
                    ui.label("Move visualizer to:");
                    for m in &monitor_list.monitors {
                        if ui.button(&m.name).clicked() {
                            viz_window.mode =
                                WindowMode::BorderlessFullscreen(MonitorSelection::Index(m.index));
                            viz_window.position =
                                WindowPosition::Centered(MonitorSelection::Index(m.index));
                        }
                    }
                }
            }

            ui.separator();
            ui.heading("Recording");
            let rec_text = if recording_state.recording {
                "Stop Recording"
            } else {
                "Record Video"
            };
            if ui.button(rec_text).clicked() {
                if recording_state.recording {
                    crate::recording::stop_recording(&mut recording_state);
                } else {
                    crate::recording::start_recording(&mut recording_state);
                }
            }
            if recording_state.recording {
                ui.label(
                    RichText::new("Recording... Click to stop")
                        .color(Color32::from_rgb(255, 80, 80)),
                );
            } else {
                ui.label(
                    RichText::new("Requires ffmpeg in PATH")
                        .color(Color32::from_gray(120))
                        .size(11.0),
                );
            }
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

fn poll_auth_response(
    mut auth: ResMut<AuthState>,
    mut config: ResMut<crate::config::Config>,
) {
    if let Some(rx) = &auth.receiver {
        match rx.try_recv() {
            Ok(Ok((token, email))) => {
                auth.logged_in = true;
                auth.loading = false;
                auth.error.clear();
                auth.receiver = None;
                config.auth_token = Some(token);
                config.user_email = Some(email);
                crate::io::save_config(&config);
            }
            Ok(Err(e)) => {
                auth.error = e;
                auth.loading = false;
                auth.receiver = None;
            }
            Err(TryRecvError::Empty) => {}
            Err(TryRecvError::Disconnected) => {
                auth.error = "Connection lost".into();
                auth.loading = false;
                auth.receiver = None;
            }
        }
    }
}

fn render_auth_overlay(
    mut egui_context: bevy_egui::EguiContexts,
    mut auth: ResMut<AuthState>,
    window_entities: Res<WindowEntities>,
) {
    if auth.logged_in || cfg!(debug_assertions) {
        auth.logged_in = true;
        return;
    }

    let ctx = egui_context.ctx_for_entity_mut(window_entities.control);

    use bevy_egui::egui;
    egui::Area::new("auth_overlay".into())
        .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
        .show(ctx, |ui| {
            egui::Frame::none()
                .fill(egui::Color32::from_rgba_unmultiplied(10, 12, 18, 240))
                .rounding(egui::Rounding::same(16.0))
                .inner_margin(egui::Margin::same(32.0))
                .show(ui, |ui| {
                    ui.set_min_width(320.0);
                    ui.vertical_centered(|ui| {
                        ui.heading(egui::RichText::new("Noterender").size(24.0));
                        ui.add_space(4.0);
                        ui.label(egui::RichText::new("Sign in to access all features").color(egui::Color32::from_gray(160)));
                        ui.add_space(16.0);

                        ui.horizontal(|ui| {
                            if ui.selectable_label(auth.mode == AuthMode::Login, "Login").clicked() {
                                auth.mode = AuthMode::Login;
                                auth.error.clear();
                            }
                            if ui.selectable_label(auth.mode == AuthMode::Register, "Register").clicked() {
                                auth.mode = AuthMode::Register;
                                auth.error.clear();
                            }
                        });
                        ui.add_space(12.0);

                        ui.label("Email");
                        ui.text_edit_singleline(&mut auth.email);
                        ui.add_space(4.0);

                        ui.label("Password");
                        ui.add(egui::TextEdit::singleline(&mut auth.password).password(true));

                        if auth.mode == AuthMode::Register {
                            ui.add_space(4.0);
                            ui.label("Confirm Password");
                            ui.add(egui::TextEdit::singleline(&mut auth.confirm_password).password(true));
                        }

                        ui.add_space(12.0);

                        if !auth.error.is_empty() {
                            ui.label(egui::RichText::new(&auth.error).color(egui::Color32::from_rgb(255, 80, 80)));
                            ui.add_space(8.0);
                        }

                        let btn_text = if auth.loading {
                            "Loading..."
                        } else if auth.mode == AuthMode::Login {
                            "Sign In"
                        } else {
                            "Create Account"
                        };

                        if ui.add_enabled(!auth.loading, egui::Button::new(egui::RichText::new(btn_text).size(16.0).strong()).min_size(egui::vec2(200.0, 36.0))).clicked() && !auth.loading {
                            auth.error.clear();

                            if auth.email.is_empty() || auth.password.is_empty() {
                                auth.error = "Email and password required".into();
                            } else if auth.mode == AuthMode::Register && auth.password != auth.confirm_password {
                                auth.error = "Passwords don't match".into();
                            } else if auth.mode == AuthMode::Register && auth.password.len() < 6 {
                                auth.error = "Password must be at least 6 characters".into();
                            } else {
                                auth.loading = true;
                                let (tx, rx) = crossbeam_channel::unbounded();
                                auth.receiver = Some(rx);

                                let email = auth.email.clone();
                                let password = auth.password.clone();
                                let is_register = auth.mode == AuthMode::Register;

                                std::thread::spawn(move || {
                                    let rt = tokio::runtime::Runtime::new().unwrap();
                                    let result = rt.block_on(async move {
                                        if is_register {
                                            crate::network::register(&email, &password).await
                                        } else {
                                            crate::network::login(&email, &password).await
                                        }
                                    });
                                    let _ = tx.send(match result {
                                        Ok(resp) => Ok((resp.token, resp.user.email)),
                                        Err(e) => Err(e),
                                    });
                                });
                            }
                        }

                        ui.add_space(8.0);
                        ui.separator();
                        ui.add_space(8.0);

                        if ui.button(egui::RichText::new("Buy Pro Access").size(14.0)).clicked() {
                            let rt = tokio::runtime::Runtime::new().unwrap();
                            if let Ok(resp) = rt.block_on(crate::network::create_checkout_session("pro_export")) {
                                if let Some(url) = resp.url {
                                    let _ = open::that(url);
                                }
                            }
                        }

                        ui.add_space(4.0);
                        ui.label(egui::RichText::new("You can use the app without signing in").color(egui::Color32::from_gray(120)).size(12.0));
                        ui.add_space(4.0);
                        if ui.add(egui::Button::new(egui::RichText::new("Skip for now").color(egui::Color32::from_gray(160)).size(13.0)).fill(egui::Color32::TRANSPARENT)).clicked() {
                            auth.logged_in = true;
                        }
                    });
                });
        });
}

fn poll_dj_shoutouts(time: Res<Time>, mut dj: ResMut<DjState>, config: Res<crate::config::Config>) {
    if config.auth_token.is_none() {
        return;
    }

    if let Some(rx) = &dj.poll_rx {
        match rx.try_recv() {
            Ok(Ok(shoutouts)) => {
                dj.pending_shoutouts = shoutouts;
                dj.poll_rx = None;
            }
            Ok(Err(_)) | Err(TryRecvError::Disconnected) => {
                dj.poll_rx = None;
            }
            Err(TryRecvError::Empty) => {}
        }
    }

    let now = time.elapsed_secs_f64();
    if dj.poll_rx.is_none() && now - dj.last_poll > 5.0 {
        dj.last_poll = now;
        if let Some(token) = &config.auth_token {
            let (tx, rx) = crossbeam_channel::unbounded();
            dj.poll_rx = Some(rx);
            let token = token.clone();
            std::thread::spawn(move || {
                let rt = tokio::runtime::Runtime::new().unwrap();
                let result = rt.block_on(crate::network::fetch_pending_shoutouts(&token));
                let _ = tx.send(result);
            });
        }
    }
}

fn handle_dj_action(mut dj: ResMut<DjState>) {
    if let Some(rx) = &dj.action_rx {
        match rx.try_recv() {
            Ok(Ok(())) | Err(TryRecvError::Disconnected) => {
                dj.action_rx = None;
                dj.last_poll = 0.0;
            }
            Ok(Err(_)) => {
                dj.action_rx = None;
            }
            Err(TryRecvError::Empty) => {}
        }
    }
}

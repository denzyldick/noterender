<template>
  <v-app dark class="studio-app">
    <!-- Background Visualizer -->
    <div class="visualizer-container">
      <canvas id="renderCanvas" ref="renderCanvas"></canvas>
    </div>

    <!-- Sidebar Navigation -->
    <v-navigation-drawer
      v-model="drawer"
      app
      width="380"
      color="rgba(10, 10, 10, 0.95)"
      class="studio-sidebar no-scrollbar"
      floating
      disable-resize-watcher
      style="backdrop-filter: blur(20px); border-right: 1px solid rgba(255,255,255,0.05)"
    >
      <div class="d-flex flex-column fill-height">
        <!-- Brand Section -->
        <div class="pa-8 text-center flex-shrink-0">
          <div class="logo-wrapper mb-3 pa-4 rounded-xl d-inline-block">
            <img src="/img/logo.png" width="80" alt="Noterender logo" />
          </div>
          <div class="text-caption grey--text text--lighten-2 font-weight-black letter-spacing-2">STUDIO ENGINE</div>
        </div>

        <v-divider class="mx-8 opacity-10"></v-divider>

        <!-- Sidebar Tabs -->
        <v-tabs
          v-model="activeTab"
          vertical
          color="primary"
          background-color="transparent"
          class="studio-tabs flex-grow-1"
          hide-slider
        >
          <div class="tabs-scroll-area no-scrollbar">
            <v-tab class="justify-center px-4"><v-icon size="22">mdi-aspect-ratio</v-icon><span class="tab-text ml-2">Canvas</span></v-tab>
            <v-tab class="justify-center px-4"><v-icon size="22">mdi-palette-swatch</v-icon><span class="tab-text ml-2">Style</span></v-tab>
            <v-tab class="justify-center px-4"><v-icon size="22">mdi-sine-wave</v-icon><span class="tab-text ml-2">Sound</span></v-tab>
            <v-tab class="justify-center px-4"><v-icon size="22">mdi-video-3d</v-icon><span class="tab-text ml-2">Camera</span></v-tab>
            <v-tab class="justify-center px-4"><v-icon size="22">mdi-auto-fix</v-icon><span class="tab-text ml-2">Effects</span></v-tab>
            <v-tab class="justify-center px-4"><v-icon size="22">mdi-text-recognition</v-icon><span class="tab-text ml-2">Branding</span></v-tab>
            <v-tab class="justify-center px-4"><v-icon size="22">mdi-movie-filter</v-icon><span class="tab-text ml-2">Render</span></v-tab>
          </div>

          <v-tabs-items v-model="activeTab" class="transparent-bg studio-tab-content no-scrollbar">
            <!-- Canvas -->
            <v-tab-item>
              <div class="pa-6">
                <div class="text-overline mb-4 primary--text">Dimensions</div>
                <v-list dark dense flat class="transparent">
                  <v-list-item-group v-model="selectedSize" color="primary">
                    <v-list-item v-for="s in sizes" :key="s.name" :value="s.name" @click="setSize(s.name)">
                      <v-list-item-icon><v-icon>{{ s.name === 'Auto' ? 'mdi-auto-fix' : 'mdi-crop-free' }}</v-icon></v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title>{{ s.name }}</v-list-item-title>
                        <v-list-item-subtitle v-if="s.size.x">{{ s.size.x }} x {{ s.size.y }}</v-list-item-subtitle>
                        <v-list-item-subtitle v-else>Adapts to screen</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list-item-group>
                </v-list>
              </div>
            </v-tab-item>

            <!-- Style -->
            <v-tab-item>
              <div class="pa-6">
                <div class="text-overline mb-4 primary--text">Templates</div>
                <Templates />
              </div>
            </v-tab-item>

            <!-- Sound -->
            <v-tab-item>
              <div class="pa-6">
                <div class="text-overline mb-4 primary--text">Audio Input</div>
                <v-switch v-model="microphone" label="Live Microphone" color="primary" inset></v-switch>
                <v-file-input v-if="!microphone" label="Choose Audio" outlined dense @change="soundSelected" prepend-inner-icon="mdi-music-circle" class="mt-4"></v-file-input>
                
                <div class="text-overline mt-6 mb-4 primary--text">Sensitivity Presets</div>
                <div class="d-flex flex-wrap mb-6" style="gap: 8px">
                  <v-chip
                    v-for="p in ['Smooth', 'Standard', 'Dynamic', 'Jumpy']"
                    :key="p"
                    small
                    label
                    outlined
                    @click="applySensitivityPreset(p)"
                    class="preset-chip"
                    :style="{ borderColor: 'rgba(255,255,255,0.2)' }"
                  >
                    {{ p }}
                  </v-chip>
                </div>

                <div class="text-overline mb-2 primary--text">Manual Controls</div>
                <div class="mb-4">
                  <div class="text-caption d-flex justify-space-between grey--text">
                    <span>FFT Smoothing</span>
                    <span>{{ Math.round(sensitivity.fftSmoothing * 100) }}%</span>
                  </div>
                  <v-slider
                    v-model="fftSmoothing"
                    min="0"
                    max="0.99"
                    step="0.01"
                    hide-details
                    class="mt-1"
                  ></v-slider>
                </div>

                <div class="mb-4">
                  <div class="text-caption d-flex justify-space-between grey--text">
                    <span>Bass Sensitivity</span>
                    <span>{{ sensitivity.bassBoost.toFixed(1) }}x</span>
                  </div>
                  <v-slider
                    v-model="bassBoost"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    hide-details
                    class="mt-1"
                  ></v-slider>
                </div>
              </div>
            </v-tab-item>

            <!-- Camera -->
            <v-tab-item>
              <div class="pa-6">
                <div class="text-overline mb-4 primary--text">Motion</div>
                <v-switch v-model="cameraMove" :label="cameraMove ? 'Auto-Orbiting' : 'Stationary'" color="primary" inset></v-switch>
                <div class="text-caption grey--text">Toggle automatic camera rotation around the scene.</div>
              </div>
            </v-tab-item>

            <!-- Effects -->
            <v-tab-item>
              <div class="pa-6">
                <div class="text-overline mb-4 primary--text">Visual Enhancements</div>
                <v-list dark dense flat class="transparent">
                  <v-list-item @click="toggleEffect('smoke')">
                    <v-list-item-action><v-checkbox :input-value="activeEffects.includes('smoke')" color="primary" hide-details></v-checkbox></v-list-item-action>
                    <v-list-item-content>
                      <v-list-item-title>Smoke Atmosphere</v-list-item-title>
                      <v-list-item-subtitle>Reactive particle fog system</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                  <v-list-item @click="toggleEffect('thunder')">
                    <v-list-item-action><v-checkbox :input-value="activeEffects.includes('thunder')" color="primary" hide-details></v-checkbox></v-list-item-action>
                    <v-list-item-content>
                      <v-list-item-title>Dynamic Thunder</v-list-item-title>
                      <v-list-item-subtitle>Bass-triggered lightning flashes</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                  <v-list-item @click="toggleEffect('birds')">
                    <v-list-item-action><v-checkbox :input-value="activeEffects.includes('birds')" color="primary" hide-details></v-checkbox></v-list-item-action>
                    <v-list-item-content>
                      <v-list-item-title>Flying Creatures</v-list-item-title>
                      <v-list-item-subtitle>Abstract birds following the beat</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </div>
            </v-tab-item>

            <!-- Branding -->
            <v-tab-item>
              <div class="pa-6">
                <div class="text-overline mb-4 primary--text">Text Content</div>
                <v-text-field v-model="title" label="Title Text" outlined dense @input="updateTitle" class="mb-2"></v-text-field>
                <v-text-field v-model="subtitle" label="Subtitle" outlined dense @input="updateSubtitle" class="mb-6"></v-text-field>
                
                <div class="text-overline mb-4 primary--text">Visualizer Style</div>
                <div class="d-flex flex-wrap mb-6" style="gap: 8px">
                  <v-chip
                    v-for="s in ['Liquid', 'None']"
                    :key="s"
                    small
                    label
                    :color="logoStyle === s ? 'primary' : ''"
                    outlined
                    @click="setLogoStyle(s)"
                    class="preset-chip"
                  >
                    {{ s }}
                  </v-chip>
                </div>

                <div class="text-overline mb-2 primary--text">Color Presets</div>
                <div class="d-flex flex-wrap mb-6" style="gap: 8px">
                  <v-chip
                    v-for="p in colorPresets"
                    :key="p.name"
                    small
                    label
                    outlined
                    @click="applyPreset(p)"
                    class="preset-chip"
                    :style="{ borderColor: 'rgba(255,255,255,0.2)' }"
                  >
                    <div class="preset-preview mr-2" :style="{ background: p.dynamic ? 'linear-gradient(45deg, #ff0000, #00ff00, #0000ff)' : `linear-gradient(45deg, rgb(${p.colors.r},${p.colors.g},${p.colors.b}), rgb(${p.light.r},${p.light.g},${p.light.b}))` }"></div>
                    {{ p.name }}
                  </v-chip>
                </div>

                <div class="text-overline mb-2 primary--text">Custom Colors</div>
                <div class="d-flex mb-6 mt-2">
                  <div class="mr-4 flex-grow-1">
                    <div class="text-caption mb-2 grey--text">Primary</div>
                    <v-menu offset-y :close-on-content-click="false">
                      <template v-slot:activator="{ on }"><v-btn block small v-on="on" :color="accentColorHex" class="rounded-pill border-thin elevation-0">Pick</v-btn></template>
                      <v-color-picker :value="accentColorHex" @update:color="colorSelected" flat mode="hex"></v-color-picker>
                    </v-menu>
                  </div>
                  <div class="flex-grow-1">
                    <div class="text-caption mb-2 grey--text">Accent</div>
                    <v-menu offset-y :close-on-content-click="false">
                      <template v-slot:activator="{ on }"><v-btn block small v-on="on" :color="lightColorHex" class="rounded-pill border-thin elevation-0">Pick</v-btn></template>
                      <v-color-picker :value="lightColorHex" @update:color="setLightColor" flat mode="hex"></v-color-picker>
                    </v-menu>
                  </div>
                </div>

                <v-file-input label="Center Logo" dense outlined @change="emblemSelected" prepend-inner-icon="mdi-sticker-emoji"></v-file-input>
              </div>
            </v-tab-item>

            <!-- Export -->
            <v-tab-item>
              <div class="pa-6">
                <!-- Browser Recording Warning -->
                <v-alert
                  dense
                  type="info"
                  color="warning"
                  class="mb-6 mb-4 text-caption"
                  style="border-left: 4px solid #ff9800; background-color: rgba(255, 152, 0, 0.1) !important;"
                >
                  <strong class="d-block mb-1">Warning: Browser Export</strong>
                  Video quality depends on your machine's performance. <strong>Do not resize the window</strong> while recording, as it will change the video resolution mid-render.
                </v-alert>

                <v-checkbox v-model="removeWatermarkCheckbox" label="Remove Watermark (Pro Only)" dense color="primary"></v-checkbox>
                <v-checkbox v-model="highQuality" label="8Mbps High Bitrate" dense color="primary" class="mb-4"></v-checkbox>
                
                <v-btn block color="primary" x-large @click="handleExport" class="rounded-lg font-weight-bold elevation-4">
                  <v-icon left>{{ isExporting ? 'mdi-stop' : 'mdi-export' }}</v-icon>
                  {{ isExporting ? 'Stop & Save' : 'Export Video' }}
                </v-btn>
              </div>
            </v-tab-item>
          </v-tabs-items>
        </v-tabs>
      </div>
    </v-navigation-drawer>

    <!-- Sidebar Toggle Button (Floating) -->
    <v-btn
      fab
      fixed
      top
      left
      color="rgba(30, 30, 30, 0.8)"
      large
      elevation="12"
      class="mt-4 ml-4 sidebar-toggle"
      @click="drawer = !drawer"
      style="z-index: 100; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2)"
    >
      <v-icon color="white">{{ drawer ? 'mdi-chevron-left' : 'mdi-tune-vertical' }}</v-icon>
    </v-btn>

    <!-- Help Icon (Top-Right) -->
    <v-btn
      fab
      fixed
      top
      right
      color="rgba(30, 30, 30, 0.8)"
      small
      elevation="12"
      class="mt-4 mr-4"
      @click="showHelp = true"
      style="z-index: 100; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2)"
    >
      <v-icon color="white">mdi-help</v-icon>
    </v-btn>

    <!-- Shortcut Help Dialog -->
    <v-dialog v-model="showHelp" max-width="400">
      <v-card color="rgba(15, 15, 15, 0.95)" style="backdrop-filter: blur(25px); border: 1px solid rgba(255,255,255,0.1)">
        <v-card-title class="headline primary--text font-weight-black letter-spacing-2">SHORTCUTS</v-card-title>
        <v-card-text class="pa-6">
          <v-list dark dense flat class="transparent">
            <v-list-item v-for="s in shortcuts" :key="s.key" class="px-0">
              <v-list-item-content>
                <v-list-item-title class="grey--text text--lighten-1">{{ s.desc }}</v-list-item-title>
              </v-list-item-content>
              <v-list-item-action>
                <v-chip label small outlined color="primary" class="font-weight-black">{{ s.key }}</v-chip>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="showHelp = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Floating Transport HUD -->
    <v-main class="pa-0 fill-height">
      <div class="transport-container">
        <v-card class="transport-bar d-flex align-center px-4 rounded-pill elevation-24" color="rgba(20, 20, 20, 0.85)" style="height: 64px">
          <v-btn icon color="white" large @click="togglePlayLocal" :class="{ 'recording-active': isExporting }">
            <v-icon size="40">{{ playing ? 'mdi-play-circle-outline' : 'mdi-stop-circle' }}</v-icon>
          </v-btn>
          <v-btn color="primary" rounded class="ml-4 font-weight-bold elevation-4 px-6" style="height: 36px" @click="handleExport">
            <v-icon left size="18">{{ isExporting ? 'mdi-stop' : 'mdi-export' }}</v-icon> 
            {{ isExporting ? 'Stop & Save' : 'Export' }}
          </v-btn>
          <v-divider vertical class="mx-6 grey darken-3 my-4"></v-divider>
          <div class="d-none d-sm-block mr-2" style="min-width: 120px">
            <div class="text-overline primary--text font-weight-black mb-n1" style="letter-spacing: 3px !important">ACTIVE</div>
            <div class="text-h6 white--text text-uppercase font-weight-light truncate-text">{{ template }}</div>
          </div>
        </v-card>
      </div>
    </v-main>

    <audio style="display: none" id="audio" :src="soundFile" loop></audio>

    <PaywallModal v-model="showPaywall" />
  </v-app>
</template>

<script>
import * as BABYLON from "babylonjs";
import audio from "../js/Audio";
import "babylonjs-loaders";
import Recording from "./../js/Recording";
import Templates from "./Templates.vue";
import PaywallModal from "@/components/PaywallModal.vue";
import TEXT from "@/js/templates/components/text";
import Effects from "@/js/Effects";
import CAMERA from "@/js/templates/components/camera";

// Visualizer Engines
import city from "../js/templates/city";
import terrain from "../js/templates/terrain";
import nebulacore from "../js/templates/nebulacore";
import trap from "../js/templates/trap";
import solaris from "../js/templates/solaris";
import infinity from "../js/templates/infinity";
import tunnel from "../js/templates/tunnel";

export default {
  name: "Player",
  components: { Templates, PaywallModal },
  data() {
    return {
      drawer: false,
      activeTab: 0,
      playing: true,
      audio: null,
      engine: null,
      scene: null,
      camera: null,
      alpha: 0,
      multiplierValue: 0,
      canvas: null,
      title: "",
      subtitle: "",
      accentColorHex: "#00E5FF",
      lightColorHex: "#00E5FF",
      templates: {
        city, terrain, nebulacore, trap, solaris, infinity, tunnel
      },
      isPro: false,
      showPaywall: false,
      isExporting: false,
      isTransitioning: false,
      activeTemplateName: "",
      showHelp: false,
      shortcuts: [
        { key: 'j / k', desc: 'Next / Previous Tab' },
        { key: 'h / l', desc: 'Toggle Sidebar' },
        { key: '[ / ]', desc: 'Next / Previous Template' },
        { key: '1 - 7', desc: 'Jump to Tab' },
        { key: 'm', desc: 'Toggle Microphone' },
        { key: 'c', desc: 'Toggle Camera Motion' },
        { key: 'Space', desc: 'Play / Pause' },
        { key: '?', desc: 'Show Shortcuts' }
      ]
    };
  },
  computed: {
    template() { return this.$store.state.template; },
    soundFile() { return this.$store.state.file; },
    config() { return this.$store.state; },
    emblem() { return this.$store.state.emblem; },
    storeTitle() { return this.$store.state.title; },
    storeSubtitle() { return this.$store.state.subtitle; },
    colorPresets() { return this.$store.state.presets; },
    storeColors() { return this.$store.state.colors; },
    storeLight() { return this.$store.state.light; },
    cameraMove: { get() { return this.$store.state.options.camera.move; }, set(val) { this.$store.dispatch("toggleCamera", val); } },
    microphone: { get() { return this.$store.state.microphone; }, set(val) { this.$store.dispatch("toggleMicrophone", val); } },
    highQuality: { get() { return this.$store.state.highQuality; }, set(val) { this.$store.dispatch("toggleHighQuality", val); } },
    removeWatermarkCheckbox: { 
      get() { return this.removeWatermark; }, 
      set(val) { if(this.isPro) { this.$store.dispatch("toggleRemoveWatermark", val); } else { this.showPaywall = true; } } 
    },
    removeWatermark() { return this.isPro && this.$store.state.removeWatermark; },
    activeEffects() { return this.$store.state.activeEffects; },
    sensitivity() { return this.$store.state.sensitivity; },
    sizes() { return this.$store.state.sizes; },
    logoStyle() { return this.$store.state.logoStyle; },
    selectedSize: {
      get() { return this.$store.state.selectedSize; },
      set(val) { this.$store.dispatch("setSize", val); }
    },
    fftSmoothing: {
      get() { return this.sensitivity.fftSmoothing; },
      set(val) { this.$store.dispatch("setSensitivity", { fftSmoothing: val }); }
    },
    bassBoost: {
      get() { return this.sensitivity.bassBoost; },
      set(val) { this.$store.dispatch("setSensitivity", { bassBoost: val }); }
    }
  },
  watch: {
    template: {
      handler(newVal, oldVal) {
        if (oldVal) {
          const prev = this.templates[oldVal];
          if (prev && prev.dispose) prev.dispose();
        }
        this.reCreate();
      },
      immediate: false
    },
    logoStyle() { this.reCreate(); },
    emblem() { this.reCreate(); },
    storeTitle(val) { TEXT.update(val, this.storeSubtitle, !this.removeWatermark); },
    storeSubtitle(val) { TEXT.update(this.storeTitle, val, !this.removeWatermark); },
    removeWatermark(val) { TEXT.update(this.storeTitle, this.storeSubtitle, !val); },
    activeEffects(val) { Effects.update(val); },
    selectedSize() { this.resizeCanvas(); },
    "sensitivity.fftSmoothing"(val) {
      if (this.audio) {
        this.audio.setSmoothing(val);
      }
    },
    storeColors: {
      handler(val) { this.accentColorHex = this.rgbToHex(val.r, val.g, val.b); },
      deep: true,
      immediate: true
    },
    storeLight: {
      handler(val) { this.lightColorHex = this.rgbToHex(val.r, val.g, val.b); },
      deep: true,
      immediate: true
    }
  },
  methods: {
    updateTitle(val) { this.$store.dispatch("changeTitle", val); },
    updateSubtitle(val) { this.$store.dispatch("changeSubtitle", val); },
    soundSelected(file) { if (file) this.$store.dispatch("setSound", file); },
    emblemSelected(file) { if (file) this.$store.dispatch("setEmblem", file); },
    setSize(name) { this.selectedSize = name; },
    setLogoStyle(style) { this.$store.dispatch("setLogoStyle", style); },
    
    applyPreset(preset) {
      this.$store.dispatch("applyPreset", preset);
    },
    
    applySensitivityPreset(preset) {
      this.$store.dispatch("applySensitivityPreset", preset);
    },

    colorSelected(color) {
      const hex = color.hex || color;
      const rgb = this.hexToRgb(hex);
      if (rgb) { this.$store.dispatch("setColor", rgb); }
    },
    setLightColor(color) {
      const hex = color.hex || color;
      const rgb = this.hexToRgb(hex);
      if (rgb) { this.$store.dispatch("setLight", rgb); }
    },
    toggleEffect(name) {
      this.$store.commit("toggleEffect", name);
    },
    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
    },
    rgbToHex(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    togglePlayLocal() {
      const audioEl = document.getElementById("audio");
      if (audioEl && audioEl.muted) {
        audioEl.muted = false;
      }

      if (this.playing) {
        this.reCreate(); // Re-initialize disposed scene
        this.startVisualizer(false);
      } else {
        this.stopVisualizer();
      }
    },

    handleKeyDown(e) {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

      const key = e.key.toLowerCase();
      
      // j/k - Tab Navigation
      if (key === 'j') {
        this.activeTab = (this.activeTab + 1) % 7;
      } else if (key === 'k') {
        this.activeTab = (this.activeTab - 1 + 7) % 7;
      }
      
      // h/l - Sidebar Toggle
      if (key === 'h' || key === 'l') {
        this.drawer = !this.drawer;
      }

      // [ / ] - Template Navigation
      if (key === '[' || key === ']') {
        const templates = this.$store.state.templates;
        const currentIndex = templates.findIndex(t => t.name === this.template);
        let nextIndex;
        if (key === '[') {
          nextIndex = (currentIndex - 1 + templates.length) % templates.length;
        } else {
          nextIndex = (currentIndex + 1) % templates.length;
        }
        this.$store.commit('templateSelected', templates[nextIndex].name);
      }

      // 1-7 - Direct Tab Jump
      if (key >= '1' && key <= '7') {
        this.activeTab = parseInt(key) - 1;
        if (!this.drawer) this.drawer = true;
      }

      // m - Microphone
      if (key === 'm') {
        this.microphone = !this.microphone;
      }

      // c - Camera
      if (key === 'c') {
        this.cameraMove = !this.cameraMove;
      }

      // Space - Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlayLocal();
      }

      // ? - Help
      if (key === '?' || key === '/') {
        this.showHelp = !this.showHelp;
      }
    },

    handleExport() {
      if (!this.isPro) {
        this.showPaywall = true;
        return;
      }

      if (this.isExporting) {
        this.stopVisualizer();
        return;
      }

      const audioEl = document.getElementById("audio");
      if (audioEl && audioEl.muted) {
        audioEl.muted = false;
      }

      if (!this.playing) {
        // Stop current preview, then start recording
        if (this.audio) {
          this.audio.stop(() => {
            this.reCreate(); // Rebuild scene from 0
            this.playing = true;
            this.isExporting = true;
            this.startVisualizer(true);
          });
        }
      } else {
        this.reCreate(); // Rebuild from stopped state
        this.isExporting = true;
        this.startVisualizer(true);
      }
    },

    reCreate() {
      this.isTransitioning = true;
      if (this.engine) {
        this.engine.stopRenderLoop();
      }
      
      if (this.scene) { 
        this.scene.dispose(); 
        this.scene = null; 
      }
      this.camera = null; 
      this.mountScene();
    },

    stopVisualizer() {
      if (this.audio) {
        this.audio.stop(() => {
          if (this.scene) this.scene.dispose();
          if (this.engine) this.engine.stopRenderLoop();
          if (this.isExporting) {
            Recording.stop();
            this.isExporting = false;
          }
          this.playing = true;
        });
      }
    },

    startVisualizer(record = false) {
      this.$store.dispatch("toggleRecording", record);
      setTimeout(async () => {
        this.playing = false;
        // 8 Mbps (High) or 2.5 Mbps (Standard)
        const bitrate = this.highQuality ? 8000000 : 2500000;
        
        try {
          if (this.microphone) {
            await this.audio.useMicrophone();
          } else {
            this.audio.nodes(); // Ensure analyzer nodes are created
            await this.audio.play();
          }

          if (record) {
            const stream = this.canvas.captureStream ? this.canvas.captureStream(30) : this.canvas.mozCaptureStream(30);
            Recording.start(stream, this.audio.getStream(), bitrate);
          }
        } catch (e) {
          console.warn("Visualizer start audio error:", e);
          this.playing = true; // Revert play state on failure
        }
      }, 500);
    },

    resizeCanvas() {
      if (!this.engine || !this.canvas) return;

      const container = this.canvas.parentElement;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      let targetWidth = containerWidth;
      let targetHeight = containerHeight;

      let sizeConfig = this.sizes.find(s => s.name === this.selectedSize);

      if (this.selectedSize === "Auto") {
        const currentAspect = containerWidth / containerHeight;
        let bestMatch = this.sizes[1]; // Use YouTube as default fallback
        let minDiff = Infinity;

        // Find closest aspect ratio among predefined sizes
        for (let i = 1; i < this.sizes.length; i++) {
          const s = this.sizes[i];
          const aspect = s.size.x / s.size.y;
          const diff = Math.abs(currentAspect - aspect);
          if (diff < minDiff) {
            minDiff = diff;
            bestMatch = s;
          }
        }
        sizeConfig = bestMatch;
      }

      if (sizeConfig && sizeConfig.size.x) {
        const aspect = sizeConfig.size.x / sizeConfig.size.y;
        if (containerWidth / containerHeight > aspect) {
          targetHeight = containerHeight;
          targetWidth = containerHeight * aspect;
        } else {
          targetWidth = containerWidth;
          targetHeight = containerWidth / aspect;
        }
      }

      this.canvas.style.width = `${targetWidth}px`;
      this.canvas.style.height = `${targetHeight}px`;
      
      // Scale text based on current dimensions
      TEXT.resize(targetWidth, targetHeight);
      
      this.engine.resize();
    },

    mountScene() {
      if (this.isMounting) return;
      this.isMounting = true;
      
      if (!this.audio) this.audio = new audio(512);
      this.canvas = this.$refs.renderCanvas;
      this.emptyFft = new Uint8Array(512).fill(0);

      if (!this.engine) {
          try {
              BABYLON.WebGPUEngine.IsSupportedAsync.then((supported) => {
                  if (supported) {
                      this.engine = new BABYLON.WebGPUEngine(this.canvas, { antialias: true });
                      this.engine.initAsync().then(() => {
                          this.setupEngine();
                      });
                  } else {
                      this.setupWebGL();
                  }
              }).catch(() => this.setupWebGL());
          } catch (e) {
              this.setupWebGL();
          }
      } else {
        this.setupEngine();
      }
    },

    setupWebGL() {
      this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
      this.setupEngine();
    },

    async setupEngine() {
      console.log("Setting up engine...");
      this.engine.setHardwareScalingLevel(1 / (window.devicePixelRatio || 1));
      window.addEventListener("resize", () => { this.resizeCanvas(); });
      this.resizeCanvas();
      
      try {
        console.log("Creating scene...");
        await this.createScene();
        console.log("Initializing template:", this.template);
        this.initTemplate(this.scene, this.config);
        
        this.activeTemplateName = this.template;
        this.isTransitioning = false;
        
        console.log("Starting render loop...");
        this.engine.runRenderLoop(() => this.babylonRender());
      } catch (e) {
        console.error("Engine setup failed:", e);
        this.isTransitioning = false;
      }
      
      this.isMounting = false;
      const loader = document.getElementById("globalLoader");
      if (loader) loader.style.display = "none";
    },

    async createScene() {
      this.scene = new BABYLON.Scene(this.engine);
      this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
      new BABYLON.PointLight("Omni", new BABYLON.Vector3(0, 0, 100), this.scene);
      this.scene.createDefaultLight();
      
      const width = this.canvas ? this.canvas.width : 1080;
      const height = this.canvas ? this.canvas.height : 1080;
      
      console.log("Initializing UI Text...");
      try {
          await TEXT.init(this.scene, this.config.title || "noterender", this.config.subtitle || "visualizer", width, height);
          TEXT.update(this.config.title || "noterender", this.config.subtitle || "visualizer", !this.removeWatermark);
      } catch (e) { 
          console.error("TEXT init failed:", e); 
      }

      console.log("Initializing Effects...");
      Effects.init(this.scene);

      this.scene.registerBeforeRender(() => { 
          this.alpha += this.multiplierValue; 
      });
    },

    initTemplate(scene, config) {
      if (this.camera) {
        this.camera.dispose();
      }
      this.camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 4, 320, BABYLON.Vector3.Zero(), scene);
      this.camera.attachControl(this.canvas, true);
      
      // Initialize Camera Physics Component BEFORE template so template can override it or lock it
      CAMERA.init(this.camera, config);

      const t = this.templates[this.template];
      if (t) {
        const width = this.canvas ? this.canvas.width : 1080;
        const height = this.canvas ? this.canvas.height : 1080;
        try {
          t.init(this.camera, this.engine, 10, scene, width, height, 1080, config);
        } catch (e) { 
          console.error("Template init failed:", e);
        }
      }

      Effects.update(this.$store.state.activeEffects);
    },

    babylonRender() {
      if (this.isTransitioning || !this.scene || !this.scene.activeCamera || !this.camera) return;
      
      this.scene.render();
      
      // Get FFT or fallback to pre-allocated empty array
      let fft = this.audio ? this.audio.getFtt() : this.emptyFft;
      if (!fft) fft = this.emptyFft;
      
      TEXT.render();
      CAMERA.render(fft);

      if (this.templates[this.activeTemplateName]) {
        this.templates[this.activeTemplateName].render(fft, this.config);
      }
      Effects.render(fft, this.config);
    }
  },
  mounted() {
    // Check Pro Status from URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      this.isPro = true;
      this.$store.dispatch("toggleRemoveWatermark", true);
      // Optional: Clear URL params to clean up
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    this.mountScene();
    this.title = this.$store.state.title;
    this.subtitle = this.$store.state.subtitle;

    window.addEventListener("keydown", this.handleKeyDown);

    // Play the audio muted in the background for a "wow" visual preview.
    // The play button remains visible (playing=true) so the user can natively press "Play"
    const audioEl = document.getElementById("audio");
    if (audioEl) {
      audioEl.muted = true;
    }
    if (this.audio) {
      this.audio.play().catch(() => {
        // Silently fail mount autoplay - the visualizer will still run with emptyFft
      });
    }
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
  }
};
</script>

<style scoped>
.logo-wrapper {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.studio-app {
  background-color: #000 !important;
  overflow: hidden !important;
}

/* Hide scrollbars globally for studio elements */
.no-scrollbar,
.no-scrollbar >>> .v-navigation-drawer__content,
.no-scrollbar >>> .v-window__container,
.no-scrollbar >>> .v-tabs-items {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}

.no-scrollbar::-webkit-scrollbar,
.no-scrollbar >>> .v-navigation-drawer__content::-webkit-scrollbar,
.no-scrollbar >>> .v-window__container::-webkit-scrollbar,
.no-scrollbar >>> .v-tabs-items::-webkit-scrollbar {
  display: none !important;
}

.visualizer-container {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #050505;
}

#renderCanvas {
  outline: none;
  box-shadow: 0 0 100px rgba(0,0,0,0.5);
}

.studio-sidebar {
  z-index: 100;
  height: 100vh !important;
}

.studio-tabs {
  display: flex;
  flex-direction: row;
}

.tabs-scroll-area {
  width: 95px;
  overflow-y: auto;
  border-right: 1px solid rgba(255,255,255,0.05);
}

.studio-tab-content {
  width: calc(100% - 95px);
  overflow-y: auto;
}

.transparent-bg {
  background-color: transparent !important;
}

.letter-spacing-2 { letter-spacing: 2px; }
.opacity-10 { opacity: 0.1; }
.border-thin { border: 1px solid rgba(255,255,255,0.1) !important; }

.transport-container {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  pointer-events: none;
}

.transport-bar {
  pointer-events: auto;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255,255,255,0.1) !important;
}

.studio-tabs >>> .v-tabs-bar {
  height: auto !important;
  background-color: transparent !important;
}

.studio-tabs >>> .v-tab {
  min-width: unset !important;
  padding: 0 4px !important;
  font-weight: 700;
  font-size: 0.7rem;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  height: 90px !important;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.tab-text {
  margin-top: 8px;
  margin-left: 0 !important;
}

.studio-tabs >>> .v-tab--active {
  background: rgba(0, 229, 255, 0.08);
}

.custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }

.recording-active {
  animation: rec-pulse 1.5s infinite;
  color: #ff5252 !important;
}

@keyframes rec-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

.truncate-text {
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-chip {
  cursor: pointer;
  transition: all 0.2s ease;
}
.preset-chip:hover {
  background: rgba(255,255,255,0.05) !important;
}
.preset-preview {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

@media (max-width: 600px) {
  .transport-container {
    bottom: 24px;
    width: 90%;
  }
  .transport-bar {
    width: 100%;
    justify-content: center;
  }
  .tabs-scroll-area {
    width: 70px;
  }
  .studio-tab-content {
    width: calc(100% - 70px);
  }
  .tab-text {
    display: none;
  }
  .studio-tabs >>> .v-tab {
    padding: 0 !important;
  }
}
</style>

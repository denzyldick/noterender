import Vue from "vue";
import Vuex from "vuex";
import Socket from "../js/Socket.js";

Vue.use(Vuex);
//Socket.start();

const API_BASE =
  process.env.VUE_APP_API_URL || "";

function api(path: string, options: any = {}) {
  const token = localStorage.getItem("noterender_token");
  const headers: any = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers }).then((r) => {
    if (r.status === 401) {
      localStorage.removeItem("noterender_token");
      localStorage.removeItem("noterender_user");
    }
    return r.json();
  });
}

export default new Vuex.Store({
  state: {
    template: "terrain",
    templates: [
      {
        name: "trap",
        preview: "",
        description: "Bass-heavy circular spectrum with camera shake.",
        price: "0",
        priceId: null,
        configuration: {
          bars: { type: "slider", min: 64, max: 512, step: 1, default: 256, label: "Total Bars" },
          radius: { type: "slider", min: 100, max: 400, step: 1, default: 225, label: "Circle Radius" },
          barWidth: { type: "slider", min: 0.1, max: 5, step: 0.1, default: 1.5, label: "Bar Thickness" },
          hyperspace: { type: "slider", min: 0, max: 2000, step: 10, default: 800, label: "Star Density" },
          glow: { type: "slider", min: 0, max: 100, step: 1, default: 48, label: "Glow Intensity" }
        },
        currentConfig: { bars: 256, radius: 225, barWidth: 1.5, hyperspace: 800, glow: 48 }
      },
      {
        name: "solaris",
        preview: "",
        description: "A pulsing star with volumetric rays and asteroid belt.",
        price: "0",
        priceId: null,
        configuration: {
          sunSize: { type: "slider", min: 50, max: 300, step: 1, default: 120, label: "Sun Diameter" },
          asteroids: { type: "slider", min: 50, max: 1000, step: 1, default: 300, label: "Asteroid Count" },
          rayIntensity: { type: "slider", min: 0.1, max: 2.0, step: 0.1, default: 0.8, label: "Ray Weight" },
          orbitSpeed: { type: "slider", min: 0.1, max: 5.0, step: 0.1, default: 1.0, label: "Orbit Speed" }
        },
        currentConfig: { sunSize: 120, asteroids: 300, rayIntensity: 0.8, orbitSpeed: 1.0 }
      },
      {
        name: "infinity",
        preview: "",
        description: "An infinite reactive tunnel of light and geometry.",
        price: "0",
        priceId: null,
        configuration: {
          speed: { type: "slider", min: 0.1, max: 10.0, step: 0.1, default: 1.0, label: "Speed" },
          fov: { type: "slider", min: 0.5, max: 2.0, step: 0.1, default: 1.0, label: "Field of View" }
        },
        currentConfig: { speed: 1.0, fov: 1.0 }
      },
      {
        name: "tunnel",
        preview: "",
        description: "A square tunnel of reactive piles with dynamic backgrounds.",
        price: "0",
        priceId: null,
        configuration: {
          repetition: { type: "slider", min: 1, max: 10, step: 1, default: 5, label: "Tunnel Depth" }
        },
        currentConfig: { repetition: 5 }
      },
      {
        name: "city",
        preview: "",
        description: "3D City flight visualization.",
        price: "0",
        priceId: null,
        configuration: {
          height: { type: "slider", min: 50, max: 500, step: 10, default: 200, label: "Building Height" }
        },
        currentConfig: { height: 200 }
      },
      {
        name: "nebulacore",
        preview: "",
        description: "Immersive cosmic vortex with reactive rings.",
        price: "0",
        priceId: null,
        configuration: {
          rings: { type: "slider", min: 1, max: 20, step: 1, default: 10, label: "Ring Count" }
        },
        currentConfig: { rings: 10 }
      },
      { 
        name: "terrain", 
        preview: "", 
        description: "Wireframe landscape.", 
        price: "0", 
        configuration: {
          roughness: { type: "slider", min: 0, max: 200, step: 1, default: 50, label: "Terrain Height" }
        },
        currentConfig: { roughness: 50 }
      },
      {
        name: "aether",
        preview: "",
        description: "Flowing fluid silk surface. Perfect for Ambient/Lo-Fi.",
        price: "0",
        configuration: {
          waveHeight: { type: "slider", min: 10, max: 150, step: 1, default: 40, label: "Wave Intensity" },
          speed: { type: "slider", min: 0.1, max: 5.0, step: 0.1, default: 1.0, label: "Flow Speed" }
        },
        currentConfig: { waveHeight: 40, speed: 1.0 }
      },
      {
        name: "monolith",
        preview: "",
        description: "Brutalist block with a reactive cube grid. Perfect for Techno.",
        price: "0",
        configuration: {
          cubeCount: { type: "slider", min: 100, max: 1000, step: 10, default: 400, label: "Cube Density" }
        },
        currentConfig: { cubeCount: 400 }
      },
      {
        name: "prism",
        preview: "",
        description: "Refractive glass shards with internal light bursts.",
        price: "0",
        configuration: {
          prismCount: { type: "slider", min: 10, max: 100, step: 1, default: 40, label: "Prism Count" },
          speed: { type: "slider", min: 0.1, max: 5.0, step: 0.1, default: 1.0, label: "Rotation Speed" }
        },
        currentConfig: { prismCount: 40, speed: 1.0 }
      },
      {
        name: "flora",
        preview: "",
        description: "Neon organic tree with floating reactive leaves.",
        price: "0",
        configuration: {
          leafCount: { type: "slider", min: 200, max: 5000, step: 100, default: 1000, label: "Leaf Density" }
        },
        currentConfig: { leafCount: 1000 }
      },
    ],
    presets: [
      { name: "Dynamic", dynamic: true, colors: { r: 0, g: 229, b: 255 }, light: { r: 255, g: 255, b: 255 } },
      { name: "Cyberpunk", colors: { r: 255, g: 0, b: 255 }, light: { r: 0, g: 255, b: 255 } },
      { name: "Gold", colors: { r: 255, g: 215, b: 0 }, light: { r: 255, g: 255, b: 255 } },
      { name: "Deep Sea", colors: { r: 0, g: 100, b: 255 }, light: { r: 0, g: 255, b: 150 } },
      { name: "Lava", colors: { r: 255, g: 50, b: 0 }, light: { r: 255, g: 150, b: 0 } },
      { name: "Forest", colors: { r: 50, g: 255, b: 50 }, light: { r: 150, g: 255, b: 0 } },
    ],
    sizes: [
      {
        name: "Auto",
        size: { x: null, y: null },
      },
      {
        name: "YouTube / Desktop (16:9)",
        size: { x: 1920, y: 1080 },
      },
      {
        name: "Instagram Post (1:1)",
        size: { x: 1080, y: 1080 },
      },
      {
        name: "TikTok / Story / Reel (9:16)",
        size: { x: 1080, y: 1920 },
      },
      {
        name: "Instagram Portrait (4:5)",
        size: { x: 1080, y: 1350 },
      },
      {
        name: "Twitter / Landscape (16:9)",
        size: { x: 1280, y: 720 },
      },
    ],
    selectedSize: "Auto",
    logoStyle: "Liquid",
    file: "/default_audio.mp3",
    title: "Noterender",
    subtitle: "Elevate Your Sound",
    microphone: false,
    audioSource: "file",
    emblem: "/img/logo.png",
    colors: {
      r: 0,
      g: 229,
      b: 255,
    },
    light: {
      r: 0,
      g: 229,
      b: 255,
    },
    dynamicColors: true,
    options: {
      emblem: {
        x: 500,
        y: 500,
        z: 0,
      },
      bars: {
        x: 1,
        y: 500,
        z: 2,
      },
      camera: {
        move: true,
      },
    },
    settings: false,
    visualizer: true,
    dialog: true,
    recording: false,
    activeEffects: ["smoke", "thunder", "birds", "glitch", "grid", "fireflies", "rain", "shockwave", "lasers", "dust", "crystals", "vignette", "bloom"],
    soundFile: null,
    highQuality: false,
    removeWatermark: false,
    livePro: false,
    trialStartedAt: null,
    sensitivity: {
      fftSmoothing: 0.8,
      bassBoost: 1.0,
    },
    auth: {
      token: localStorage.getItem("noterender_token") || null,
      user: JSON.parse(localStorage.getItem("noterender_user") || "null"),
      userId: parseInt(localStorage.getItem("noterender_user_id") || "0"),
    },
    announcement: { text: "", visible: false, duration: 5 },
    shoutouts: [] as any[],
  },
  mutations: {
    setLogoStyle: function (state, style) {
      state.logoStyle = style;
    },
    setSize: function (state, sizeName) {
      state.selectedSize = sizeName;
    },
    setSensitivity: function (state, sensitivity) {
      state.sensitivity = { ...state.sensitivity, ...sensitivity };
    },
    toggleEffect: function (state, effectName) {
      const index = state.activeEffects.indexOf(effectName);
      if (index > -1) {
        state.activeEffects.splice(index, 1);
      } else {
        state.activeEffects.push(effectName);
      }
    },
    enableDialog: function (state) {
      state.dialog = true;
    },
    disableDialog: function (state) {
      state.dialog = false;
    },
    enableSetting: function (state) {
      state.settings = true;
    },
    disableSetting: function (state) {
      state.settings = false;
    },
    enableVisualizer: function (state) {
      state.visualizer = true;
    },
    disableVisualizer: function (state) {
      state.visualizer = false;
    },
    enableRecording: function (state) {
      state.recording = true;
    },
    disableRecording: function (state) {
      state.recording = false;
    },
    setSound: function (state, url) {
      state.file = url;
    },
    setEmblem: function (state, url) {
      state.emblem = url;
    },
    setBarRGB: function (state, rgb) {
      state.colors = rgb;
    },
    setLightRGB: function (state, rgb) {
      state.light = rgb;
    },
    setDynamicColors: function (state, val) {
      state.dynamicColors = val;
    },
    setHighQuality: function (state, val) {
      state.highQuality = val;
    },
    setRemoveWatermark: function (state, val) {
      state.removeWatermark = val;
    },
    setLivePro: function (state, val) {
      state.livePro = val;
    },
    setTrial: function (state, timestamp) {
      state.trialStartedAt = timestamp;
    },
    templateSelected: function (state, template) {
      state.template = template;
    },
    updateTemplateConfig: function (state, { templateName, config }) {
      const template = state.templates.find(t => t.name === templateName);
      if (template) {
        template.currentConfig = { ...template.currentConfig, ...config };
      }
    },
    disableCamera: function (state) {
      state.options.camera.move = false;
    },
    enableCamera: function (state) {
      state.options.camera.move = true;
    },
    changeTitle: function (state, title) {
      state.title = title;
    },
    changeSubtitle: function (state, subtitle) {
      state.subtitle = subtitle;
    },
    changeText: function (state, text) {
      state.title = text.title;
      state.subtitle = text.subtitle;
    },
    setSoundFile: function (state, file) {
      state.soundFile = file;
    },
    setAudioSource: function (state, source) {
      state.audioSource = source;
      state.microphone = source !== "file";
    },
    setAuth: function (state, { token, user }) {
      state.auth.token = token;
      state.auth.user = user;
      if (user) state.auth.userId = user.id;
      if (token) { localStorage.setItem("noterender_token", token); localStorage.setItem("noterender_user", JSON.stringify(user)); localStorage.setItem("noterender_user_id", String(user?.id || "")); }
      else { localStorage.removeItem("noterender_token"); localStorage.removeItem("noterender_user"); localStorage.removeItem("noterender_user_id"); }
    },
    logout: function (state) {
      state.auth = { token: null, user: null, userId: 0 };
      localStorage.removeItem("noterender_token"); localStorage.removeItem("noterender_user"); localStorage.removeItem("noterender_user_id");
    },
    setAnnouncement: function (state, { text, visible, duration }) {
      state.announcement = { text, visible, duration: duration || 5 };
    },
    setShoutouts: function (state, shoutouts) {
      state.shoutouts = shoutouts;
    },
    setMicrophone: function (state, val) {
      state.microphone = val;
      if (val) {
        // When toggling 'live' on, prefer system audio over mic if not already set
        state.audioSource = state.audioSource === "file" ? "system" : state.audioSource;
      } else {
        state.audioSource = "file";
      }
    },
  },
  actions: {
    changeTitle: function (context, title) {
      context.commit("changeTitle", title);
    },
    changeSubtitle: function (context, subtitle) {
      context.commit("changeSubtitle", subtitle);
    },
    changeText: function (context, text) {
      context.commit("changeText", text);
    },
    setSound: function (context, file) {
      const url = URL.createObjectURL(file);
      context.commit("setSound", url);
      context.commit("setSoundFile", file);
    },
    setSoundUrl: function (context, url) {
      context.commit("setSound", url);
    },
    setEmblem: function (context, file) {
      const url = URL.createObjectURL(file);
      context.commit("setEmblem", url);
    },
    toggleSetting(context, state) {
      if (state) {
        context.commit("enableSetting");
      }

      if (state === false) {
        context.commit("disableSetting");
      }
    },
    toggleVisualizer(context, state = null) {
      if (state === null) {
        state = !context.state;
      }
      if (state) {
        context.commit("enableVisualizer");
      }

      if (state === false) {
        context.commit("disableVisualizer");
      }
    },
    toggleDialog(context, state) {
      if (state) {
        context.commit("enableDialog");
      }

      if (state === false) {
        context.commit("disableDialog");
      }
    },
    toggleRecording(context, state = null) {
      if (state === null) {
        state = !context.state;
      }

      if (state) {
        context.commit("enableRecording");
        let file = context.state.soundFile;
        if (window.location.search.includes("disablesocket") === false) {
          //Socket.startRecording(file);
        }
      }

      if (state === false) {
        context.commit("disableRecording");
      }
    },
    setColor: function (context, payload) {
      context.commit("setDynamicColors", false);
      context.commit("setBarRGB", payload);
    },
    setLight: function (context, payload) {
      context.commit("setDynamicColors", false);
      context.commit("setLightRGB", payload);
    },
    applyPreset: function (context, preset) {
      if (preset.dynamic) {
        context.commit("setDynamicColors", true);
      } else {
        context.commit("setDynamicColors", false);
        context.commit("setBarRGB", preset.colors);
        context.commit("setLightRGB", preset.light);
      }
    },
    toggleHighQuality: function (context, val) {
      context.commit("setHighQuality", val);
    },
    toggleRemoveWatermark: function (context, val) {
      context.commit("setRemoveWatermark", val);
    },
    toggleCamera: function (context, enable) {
      if (enable) {
        context.commit("enableCamera");
      } else {
        context.commit("disableCamera");
      }
    },
    toggleMicrophone: function (context, val) {
      context.commit("setMicrophone", val);
    },
    setAudioSource: function (context, source) {
      context.commit("setAudioSource", source);
    },
    setSensitivity: function (context, sensitivity) {
      context.commit("setSensitivity", sensitivity);
    },
    setSize: function (context, sizeName) {
      context.commit("setSize", sizeName);
    },
    setLogoStyle: function (context, style) {
      context.commit("setLogoStyle", style);
    },
    applySensitivityPreset: function (context, presetName) {
      const presets = {
        "Smooth": { fftSmoothing: 0.92, bassBoost: 1.0 },
        "Standard": { fftSmoothing: 0.8, bassBoost: 1.0 },
        "Dynamic": { fftSmoothing: 0.6, bassBoost: 1.2 },
        "Jumpy": { fftSmoothing: 0.3, bassBoost: 1.5 },
      };
      if (presets[presetName]) {
        context.commit("setSensitivity", presets[presetName]);
      }
    },
    login: async function (context, { email, password }) {
      const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      if (data.error) throw new Error(data.error);
      context.commit("setAuth", data);
      return data;
    },
    register: async function (context, { email, password }) {
      const data = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
      if (data.error) throw new Error(data.error);
      context.commit("setAuth", data);
      return data;
    },
    fetchMe: async function (context) {
      const data = await api("/api/me");
      if (!data.error) context.commit("setAuth", { token: context.state.auth.token, user: data });
      return data;
    },
    saveProject: async function (context, { name, data }) {
      const userId = context.state.auth.userId;
      if (!userId) throw new Error("Not logged in");
      return await api("/api/projects", { method: "POST", body: JSON.stringify({ name, data }) });
    },
    updateProject: async function (context, { id, name, data }) {
      return await api(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify({ name, data }) });
    },
    loadProjects: async function (context) {
      const data = await api("/api/projects");
      return Array.isArray(data) ? data : [];
    },
    deleteProject: async function (context, id) {
      return await api(`/api/projects/${id}`, { method: "DELETE" });
    },
    submitShoutout: async function (context, { clubId, name, message }) {
      return await api("/api/shoutout", { method: "POST", body: JSON.stringify({ club_id: clubId, name, message }) });
    },
    approveShoutout: async function (context, { id, status }) {
      return await api(`/api/shoutout/${id}/approve`, { method: "PUT", body: JSON.stringify({ status: status || "approved" }) });
    },
    fetchPendingShoutouts: async function (context) {
      const data = await api("/api/shoutout/pending");
      return Array.isArray(data) ? data : [];
    },
    fetchApprovedShoutouts: async function (context, { clubId, since }) {
      const data = await api(`/api/shoutout/approved?club_id=${clubId}${since ? `&since=${since}` : ""}`);
      return Array.isArray(data) ? data : [];
    },
  },
  modules: {},
});

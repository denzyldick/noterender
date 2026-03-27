import Vue from "vue";
import Vuex from "vuex";
import Socket from "../js/Socket.js";

Vue.use(Vuex);
//Socket.start();
export default new Vuex.Store({
  state: {
    template: "city",
    templates: [
      {
        name: "trap",
        preview: "",
        description: "Bass-heavy circular spectrum with camera shake.",
        price: "0",
        priceId: null,
        configuration: {},
      },
      {
        name: "solaris",
        preview: "",
        description: "A pulsing star with volumetric rays and asteroid belt.",
        price: "0",
        priceId: null,
        configuration: {},
      },
      {
        name: "infinity",
        preview: "",
        description: "An infinite reactive tunnel of light and geometry.",
        price: "0",
        priceId: null,
        configuration: {},
      },
      {
        name: "city",
        preview: "",
        description: "3D City flight visualization.",
        price: "0",
        priceId: null,
        configuration: {},
      },
      {
        name: "nebulacore",
        preview: "",
        description: "Immersive cosmic vortex with reactive rings.",
        price: "0",
        priceId: null,
        configuration: {},
      },
      { name: "terrain", preview: "", description: "Wireframe landscape.", price: "0", configuration: {} },
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
        name: "Story",
        size: {
          x: 1080,
          y: 1920,
        },
      },
      {
        name: "Post",
        size: {
          x: 1080,
          y: 1080,
        },
      },
      {
        name: "Custom",
        size: {
          x: null,
          y: null,
        },
      },
    ],
    file: "/default_audio.mp3",
    title: "Noterender.io",
    subtitle: "Visualizing the Beat",
    microphone: false,
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
    dynamicColors: false,
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
    soundFile: null,
    highQuality: false,
    removeWatermark: false,
  },
  mutations: {
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
    templateSelected: function (state, template) {
      state.template = template;
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
    setMicrophone: function (state, val) {
      state.microphone = val;
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
  },
  modules: {},
});

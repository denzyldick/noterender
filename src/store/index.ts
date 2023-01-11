import Vue from "vue";
import Vuex from "vuex";
import Socket from "../js/Socket.js";

Vue.use(Vuex);
Socket.start();
export default new Vuex.Store({
  state: {
    template: "lines",
    templates: [
      {
        name: "simple",
        preview: "simple.png",
        description: "Row of bars that expand.",
        price: "0",
        priceId: null,
        configuration: {},
      },
      {
        name: "lines",
        preview: "",
        description: "Lines",
        price: "0",
        priceId: null,
        configuration: {},
      },
      {
        name: "wave",
        preview: "wave.png",
        description: "Row of bars that circles your logo.",
        price: 1.99,
        priceId: "prod_KT8EgUlY0EcvMH",
        configuration: {},
      },
      {
        name: "circles",
        preview: "circles.png",
        description: "This one is in beta.",
        price: 3.99,
        configuration: {},
      },
      {
        name: "cover",
        preview: "cover.png",
        description: "Moving album cover.",
        price: 0.99,
        configuration: {},
      },
      {
        name: "expanded",
        preview: "expanded.png",
        description: "Bars will appear on every direction.",
        price: 10.99,
        configuration: {
          elements: {
            top: {},
            left: {},
            right: {},
            bottom: {},
          },
        },
      },
      {
        name: "triangle",
        preview: "triangles.png",
        description: "Something with triangles.",
        price: 5.99,
        configuration: {},
      },
      {
        name: "immersive",
        preview: "immersive.png",
        description: "",
        price: 0.3,
        configuration: {},
      },
      {
        name: "cube",
        preview: "cube.png",
        description: "",
        price: 10.0,
        configuration: {},
      },
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
    file: "/noterender.com.opus",
    title: "Welcome.",
    subtitle: "Generate your visualizer the easy way.",
    microphone: false,
    emblem: "/img/logo.png",
    background: "/1080.jpg",
    colors: {
      b: 255,
      g: 56,
      r: 0,
    },
    light: {
      b: 255,
      g: 56,
      r: 0,
    },
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
        move: false,
      },
    },
    settings: false,
    visualizer: true,
    dialog: true,
    recording: false,
    soundFile: null,
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
    setBackground: function (state, url) {
      state.background = url;
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
    templateSelected: function (state, template) {
      state.template = template;
    },
    disableCamera: function (state) {
      state.options.camera.move = false;
    },
    enableCamera: function (state) {
      state.options.camera.move = true;
    },
    changeText: function (state, text) {
      state.title = text.title;
      state.subtitle = text.subtitle;
    },
    setSoundFile: function (state, file) {
      state.soundFile = file;
    },
  },
  actions: {
    changeText: function (context, text) {
      context.commit("changeText", text.title, text.subtitle);
    },
    setSound: function (context, file) {
      const url = URL.createObjectURL(file);
      context.commit("setSound", url);
      context.commit("setSoundFile", file);
    },
    setBackground: function (context, file) {
      const url = URL.createObjectURL(file);
      context.commit("setBackground", url);
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
          Socket.startRecording(file);
        }
      }

      if (state === false) {
        context.commit("disableRecording");
      }
    },
    setColor: function (context, payload) {
      console.log(payload, "color selected");

      context.commit("setBarRGB", payload);
    },
    setLight: function (context, payload) {
      context.commit("setLightRGB", payload);
    },
    toggleCamera: function (context, enable) {
      if (enable) {
        context.commit("disableCamera");
      } else {
        context.commit("enableCamera");
      }
    },
  },
  modules: {},
});

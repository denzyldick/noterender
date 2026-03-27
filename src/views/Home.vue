<template>
  <div class="home">
    <RouterView />
  </div>
</template>

<script>
import * as BABYLON from "babylonjs";
import audio from "../js/Audio";
import "babylonjs-loaders";
import Setting from "./Setting.vue";
import Recording from "./../js/Recording";
import city from "../js/templates/city";
import terrain from "../js/templates/terrain";
import nebulacore from "../js/templates/nebulacore";
import TEXT from "@/js/templates/components/text";

export default {
  name: "Home",
  props: {},
  computed: {
    template: function () {
      return this.$store.state.template;
    },
    options: function () {
      return this.$store.state.options;
    },
    player: {
      set: function (value) {
        this.$store.dispatch("toggleVisualizer", value);
      },
      get: function () {
        return this.$store.state.visualizer;
      },
    },
    soundFile: function () {
      return this.$store.state.file;
    },
    backgroundFile: function () {
      return this.$store.state.background;
    },
    config: function () {
      return this.$store.state;
    },
  },
  data: function () {
    return {
      activeTooltip: true,
      active: true,
      audio: null,
      paywall: false,
      t: 0.1, /// This is how the camera moves.
      playing: true,
      camera: null, //
      alpha: 0,
      fft: [],
      fftSize: 128,
      multiplierValue: 0,
      templates: {
        city,
        terrain,
        nebulacore
      }
    };
  },
  watch: {
    play: function (val) {
      console.log(val, "Playing");
    },
    multiplierValue: function (val) {
      console.table(val);
    },
  },
  methods: {
    toggleSetting: function () {
      this.visualizer = false;
      this.$store.dispatch("toggleSetting", true);
      this.$router.push({ path: "/setting" });
    },
    reCreate: function () {
      this.stopSound();
      console.log("recreating");
      this.scene.dispose();
      this.scene = null;
      this.mountScene();
    },
    close: function () {
      this.engine.dispose();
      this.$store.dispatch("toggleSetting", false);
      this.$store.dispatch("toggleVisualizer", true);
    },
    stopSound: function () {
      this.$store.dispatch("toggleDialog", true);
      this.audio.stop(() => {
        this.scene.dispose();
        this.engine.stopRenderLoop();
        Recording.stop();
      });
      this.playing = true;
    },
    playSound: function (play) {
      this.$store.dispatch("toggleRecording", true);
      // this.active = true;
      // todo use a promise instead of a timeout.
      setTimeout(() => {
        this.$store.dispatch("toggleSetting", false);
        this.$store.dispatch("toggleDialog", false);
        this.playing = false;
        this.audio.nodes();
        this.audio.play(() => {
          Recording.start(this.canvas.captureStream(), this.audio.getStream());
        });
      }, 1000);
    },
    createScene: function () {
      this.scene = new BABYLON.Scene(this.engine);
      const light = new BABYLON.PointLight(
        "Omni",
        new BABYLON.Vector3(0, 0, 100),
        this.scene,
      );
      this.scene.ambientColor = new BABYLON.Color3(1, 1, 1);
      this.scene.createDefaultLight();
      this.alpha = 0;
      this.scene.beforeRender = this.beforeRender(); // GUI;
    },
    initTemplate(r, nb, scene, plane, width, height, depth) {
      TEXT.init(scene, this.config.title, this.config.subtitle);
      if (!this.template) {
        return;
      }

      this.camera = new BABYLON.ArcRotateCamera(
        "camera",
        Math.PI / 2,
        Math.PI / 4,
        500,
        BABYLON.Vector3.Zero(),
        this.scene,
      );
      this.camera.attachControl(this.canvas, true);

      const t = this.templates[this.template];
      if (t) {
        try {
          t.init(this.camera, r, nb, scene, width, height, depth, this.config);
        } catch (e) {
          t.init(scene, this.config);
        }
      }
    },
    render: function () {
      if (this.scene !== null) {
        this.scene.render();
      }
      const fft = this.audio.getFtt();
      if (fft !== null && this.templates[this.template]) {
        this.templates[this.template].render(fft, this.config);
      }
    },
    beforeRender: function () {
      this.alpha += this.multiplierValue;
    },
    mountScene: function () {
      this.audio = new audio(128);

      this.canvas = document.getElementById("renderCanvas");
      this.engine = new BABYLON.Engine(this.canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });

      this.createScene();
      // run the render loop
      this.engine.runRenderLoop(this.render);
      // the canvas/window esize event handler
      window.addEventListener("resize", () => {
        this.engine.resize();
      });
      this.createBackground();
      this.initTemplate(
        10,
        600,
        this.scene,
        this.options.bars.x,
        this.options.bars.y,
        this.options.bars.z,
      );
    },
    createBackground: function () {
      const layer = new BABYLON.Layer(
        "ad",
        this.config.background,
        this.scene,
        true,
      );
    },
  },
  components: {
    // eslint-disable-next-line vue/no-unused-components
    Setting,
  },
};
</script>

<style>
.parent {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa !important;
}

canvas {
  /*background: transparent;*/
  width: 100%;
  height: 100%;
}

html,
body {
  overflow: hidden;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

#renderCanvas {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  touch-action: none;
}
</style>

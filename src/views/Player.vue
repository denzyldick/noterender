<template>
  <div>
    <div class="text-center">
      <v-bottom-sheet inset v-model="player">
        <v-card tile>
          <v-list>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>
                  <img src="/img/logo.png" width="50px" alt="Noterender logo." />
                </v-list-item-title>
              </v-list-item-content>
              <v-spacer></v-spacer>
              <v-list-item-icon>
                <v-tooltip location="top" v-model="activeTooltip">
                  <template v-slot:activator="{ props }">
                    <v-btn icon v-bind="props">
                      <v-btn icon v-on:click.stop="toggleSetting">
                        <v-icon>mdi-cog</v-icon>
                      </v-btn>
                    </v-btn>
                  </template>
                </v-tooltip>
              </v-list-item-icon>
              <!-- <v-list-item-icon :class=" { 'mx-2' : $vuetify.breakpoint.mdAndUp }"> -->
              <!--    <v-tooltip -->
              <!--        top -->
              <!--    > -->
              <!--      <template v-slot:activator="{ on, attrs }"> -->
              <!--        <v-btn -->
              <!--            icon -->
              <!--            v-bind="attrs" -->
              <!--            v-on="on" -->
              <!--            v-show="playing ===false" -->
              <!--        > -->
              <!--          <v-btn icon v-on:click.stop="paywall = true;stopSound" class="red--text"> -->
              <!--            <v-icon>mdi-download</v-icon> -->
              <!--          </v-btn> -->
              <!--        </v-btn> -->
              <!--      </template> -->
              <!--      <span>Recording</span> -->
              <!--    </v-tooltip> -->
              <!--  </v-list-item-icon> -->
              <v-list-item-icon :class="{ 'mx-4': $vuetify.breakpoint.mdAndUp }">
                <v-tooltip top>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn icon v-bind="attrs" v-on="on">
                      <v-btn id="playButton" icon v-on:click.stop="playSound" v-if="playing">
                        <v-icon>mdi-play</v-icon>
                      </v-btn>

                      <v-btn icon v-on:click.stop="stopSound" v-if="playing === false">
                        <v-icon color="red">mdi-stop</v-icon>
                      </v-btn>
                    </v-btn>
                  </template>

                  <span v-if="playing === false">Recording canvas. Play till the end.</span>
                  <span v-if="playing">Play</span>
                </v-tooltip>
              </v-list-item-icon>
            </v-list-item>
          </v-list>
        </v-card>
      </v-bottom-sheet>
    </div>
    <div class="parent">
      <canvas id="renderCanvas" v-if="active" @click='store.dispatch("toggleVisualizer", true)'></canvas>
      <audio style="display: none" controls id="audio" :src="soundFile"></audio>
    </div>
  </div>
</template>
<script>
import * as BABYLON from "babylonjs";
import audio from "../js/Audio";
import "babylonjs-loaders";
import Setting from "./Setting.vue";
import Recording from "./../js/Recording";
import wave from "../js/templates/wave";
import circles from "../js/templates/circles";
import simple from "../js/templates/simple";
import cover from "../js/templates/cover";
import lines from "../js/templates/lines";
import expanded from "../js/templates/expanded";
import triangle from "../js/templates/triangle";
import immersive from "../js/templates/immersive";
import cube from "../js/templates/cube";
import TEXT from "@/js/templates/components/text";
import fractal from "../js/templates/fractal";
import circle from "../js/templates/circle";
import waveform from "../js/templates/waveform";
import spiral from "../js/templates/spiral";

export default {
  name: "Player",
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
        fractal,
        circle,
        waveform,
        spiral,
        // Add other templates here as you create them
      },
      selectedTemplate: "fractal", // Default template
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
    initTemplate(scene, config) {
      if (!this.camera) {
        this.camera = new BABYLON.ArcRotateCamera(
          "camera",
          Math.PI / 2,
          Math.PI / 4,
          500,
          new BABYLON.Vector3(0, 0, 0),
          scene
        );
        this.camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
      }
      if (this.templates[this.selectedTemplate]) {
        this.templates[this.selectedTemplate].init(
          this.camera,
          this.renderer,
          this.notebuffer,
          scene,
          this.width,
          this.height,
          this.depth,
          config
        );
      }
    },
    renderTemplate(fft, config) {
      if (!this.camera) {
        console.error("No camera defined"); // Log error if camera is not initialized
        return;
      }
      if (this.templates[this.selectedTemplate]) {
        this.templates[this.selectedTemplate].render(fft, config);
      }
    },
    render: function () {
      if (this.scene !== null) {
        this.scene.render();
      }
      const fft = this.audio.getFtt();
      if (fft !== null) {
        this.renderTemplate(fft, this.config);
      }
    },
    beforeRender: function () {
      this.alpha += this.multiplierValue;
    },
    mountScene: function () {
      this.audio = new audio(128);

      this.canvas = document.getElementById("renderCanvas");
      // let scale = 2;
      // this.canvas.style.width = 1080 * scale;
      // this.canvas.style.height = 1092 * scale;
      // Load the 3D engine
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
        this.scene,
        this.config
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
  mounted() {
    this.mountScene();
  },
};
</script>

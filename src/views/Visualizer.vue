<template>
  <div class="visualizer-root">
    <canvas ref="renderCanvas" id="renderCanvas"></canvas>
  </div>
</template>

<script>
import * as BABYLON from "babylonjs";
import "babylonjs-gui";
import TEXT from "@/js/templates/components/text";
import CAMERA from "@/js/templates/components/camera";
import Effects from "@/js/Effects";

import terrain from "@/js/templates/terrain";
import trap from "@/js/templates/trap";
import solaris from "@/js/templates/solaris";
import city from "@/js/templates/city";
import infinity from "@/js/templates/infinity";
import tunnel from "@/js/templates/tunnel";
import nebulacore from "@/js/templates/nebulacore";
import aether from "@/js/templates/aether";
import monolith from "@/js/templates/monolith";
import prism from "@/js/templates/prism";
import flora from "@/js/templates/flora";
import clouds from "@/js/templates/clouds";
import aurora from "@/js/templates/aurora";
import cathedral from "@/js/templates/cathedral";
import oscillate from "@/js/templates/oscillate";
import reactor from "@/js/templates/reactor";

import PLANE from "@/js/templates/components/plane";

const templateModules = {
  terrain, trap, solaris, city, infinity, tunnel,
  nebulacore, aether, monolith, prism, flora,
  clouds, aurora, cathedral, oscillate, reactor,
};

export default {
  name: "Visualizer",
  data() {
    return {
      engine: null,
      scene: null,
      camera: null,
      canvas: null,
      emptyFft: null,
      currentTemplate: "terrain",
      currentConfig: {},
      activeEffects: [],
    };
  },
  methods: {
    initScene(templateName, config) {
      if (this.scene) {
        this.scene.dispose();
      }
      if (this.engine) {
        this.engine.stopRenderLoop();
      }

      this.currentTemplate = templateName;
      this.currentConfig = config;

      this.canvas = this.$refs.renderCanvas;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;

      try {
        this.engine = new BABYLON.Engine(this.canvas, true, {
          preserveDrawingBuffer: true,
          stencil: true,
          antialias: true,
          adaptToDeviceRatio: true,
        });
      } catch (e) {
        console.error("Engine creation failed:", e);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      this.engine.setHardwareScalingLevel(1 / dpr);

      this.scene = new BABYLON.Scene(this.engine);
      this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
      new BABYLON.PointLight("Omni", new BABYLON.Vector3(0, 0, 100), this.scene);
      this.scene.createDefaultLight();

      const w = this.canvas.width;
      const h = this.canvas.height;

      TEXT.init(this.scene, config.title || "noterender", config.subtitle || "visualizer", w, h);
      TEXT.update(config.title || "noterender", config.subtitle || "visualizer", !config.removeWatermark);

      Effects.init(this.scene);

      this.camera = new BABYLON.ArcRotateCamera(
        "camera", Math.PI / 2, Math.PI / 4, 320,
        BABYLON.Vector3.Zero(), this.scene
      );
      this.camera.attachControl(this.canvas, true);
      CAMERA.init(this.camera, config);

      const t = templateModules[templateName];
      if (t) {
        try {
          t.init(this.camera, this.engine, 10, this.scene, w, h, 1080, config);
        } catch (e) {
          console.error("Template init failed:", e);
        }
      }

      if (config.activeEffects) {
        Effects.update(config.activeEffects);
      }

      this.scene.registerBeforeRender(() => {});

      this.engine.runRenderLoop(() => {
        if (!this.scene || !this.scene.activeCamera) return;
        this.scene.render();

        const fft = this.emptyFft;
        TEXT.render();
        CAMERA.render(fft);
        if (t) t.render(fft, config);
        Effects.render(fft, config);
      });
    },

    handleResize() {
      if (!this.engine || !this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      this.engine.setHardwareScalingLevel(1 / dpr);
      this.engine.resize();
      TEXT.resize(this.canvas.width, this.canvas.height);
    },
  },
  mounted() {
    this.emptyFft = new Uint8Array(512).fill(0);
    window.addEventListener("resize", () => this.handleResize());

    this.$nextTick(() => {
      this.initScene("terrain", {
        title: "noterender",
        subtitle: "visualizer",
        dynamicColors: false,
        templates: [],
        activeEffects: [],
        removeWatermark: false,
      });
    });

    window.__TAURI__?.event?.listen("visualizer-update", (event) => {
      const { template, config } = event.payload;
      if (template) {
        this.initScene(template, config || this.currentConfig);
      } else if (config) {
        this.currentConfig = config;
      }
    });
  },
  beforeDestroy() {
    if (this.engine) {
      this.engine.stopRenderLoop();
    }
    if (this.scene) {
      this.scene.dispose();
    }
    window.removeEventListener("resize", () => this.handleResize());
  },
};
</script>

<style scoped>
.visualizer-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
}
#renderCanvas {
  width: 100%;
  height: 100%;
  display: block;
  outline: none;
  touch-action: none;
}
</style>

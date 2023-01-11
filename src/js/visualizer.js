import * as BABYLON from "babylonjs";
import Recording from "@/js/Recording";
import wave from "@/js/templates/wave";
import Simple from "@/js/templates/simple";
import circles from "@/js/templates/circles";
import simple from "@/js/templates/simple";
import cover from "@/js/templates/cover";
import { capitalize } from "element-ui/src/utils/util";

class Visualizer {
  /**
   *
   * @param template
   * @param audio
   * @param config
   */
  constructor(template, audio, config) {
    this.templateName = template;
    this.audio = audio;
    this.templateConfig = config;
    this.mount();
  }

  mount() {
    // Get the canvas DOM element
    this.canvas = document.getElementById("renderCanvas");
    // let scale = 1;
    // this.canvas.style.width = 1080 * scale;
    // this.canvas.style.height = 1092 * scale;
    // Load the 3D engine
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });

    this.createScene();

    // the canvas/window esize event handler
    window.addEventListener("resize", () => {
      this.engine.resize();
    });
    this.createBackground();

    this.template;
    if (this.templateName === "simple") {
      this.template = new Simple();
    }
    this.template.setConfiguration(this.templateConfig);
    this.template.init(this.scene);

    // run the render loop
    this.engine.runRenderLoop(this.render.bind(this));
  }

  capitalize = (s) => {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  createScene() {
    this.scene = new BABYLON.Scene(this.engine);
    Recording.start(this.canvas.captureStream(), this.audio.getStream());
    this.audio.play();

    // Load the sound and play it automatically once ready
    this.scene.ambientColor = new BABYLON.Color3(1, 1, 1);
    this.scene.createDefaultLight();

    // Animations
    // this.alpha = 0;
    // this.alpha
    // this.scene.beforeRender = this.beforeRender();
  }

  createBackground() {
    // const layer = new BABYLON.Layer('ad', this.config.background, this.scene, true);
  }

  render() {
    console.log(this.scene, "scene");
    // this.scene.render();
    this.template.render(this.audio.getFtt());
  }
}

export default Visualizer;

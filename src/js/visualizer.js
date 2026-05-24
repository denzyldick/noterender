import * as BABYLON from "babylonjs";
import Recording from "@/js/Recording";

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

  async mount() {
    // Get the canvas DOM element
    this.canvas = document.getElementById("renderCanvas");
    
    // Load the 3D engine
    try {
        const webgpuSupported = await BABYLON.WebGPUEngine.IsSupportedAsync;
        if (webgpuSupported) {
            this.engine = new BABYLON.WebGPUEngine(this.canvas, { 
              antialias: true,
              adaptToDeviceRatio: true 
            });
            await this.engine.initAsync();
            this.engine.setHardwareScalingLevel(1 / (window.devicePixelRatio || 1));
            console.log("WebGPU Engine Initialized");
        } else {
            throw new Error("WebGPU not supported");
        }
    } catch (e) {
        console.warn("Falling back to WebGL Engine:", e.message);
        this.engine = new BABYLON.Engine(this.canvas, true, {
          preserveDrawingBuffer: true,
          stencil: true,
          antialias: true,
          adaptToDeviceRatio: true
        });
        this.engine.setHardwareScalingLevel(1 / (window.devicePixelRatio || 1));
    }

    this.createScene();

    // the canvas/window esize event handler
    window.addEventListener("resize", () => {
      this.engine.resize();
    });
    this.createBackground();

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
    this.alpha = 0;
    this.scene.beforeRender = this.beforeRender();
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

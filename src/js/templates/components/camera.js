let alpha;
let beta;
let radius;
let camera;
let configuration;
export default {
  render(fft) {
    if (typeof configuration !== "undefined" && camera) {
      if (configuration.options.camera.move === true) {
        // Time-based smooth rotation
        const time = Date.now() * 0.0005;
        const pulse = (fft || 0) * 0.1; // Smooth movement based on FFT

        // Orbit around the center
        camera.alpha = (this.initialAlpha || 0) + time + (pulse * 0.002);
        camera.beta = (this.initialBeta || Math.PI / 4) + Math.sin(time * 0.5) * 0.1;
        
        // Gentle "zoom" pulse based on music
        camera.radius = (this.initialRadius || 1000) - (pulse * 0.5);
      }
    }
  },
  init(c, config) {
    configuration = config;
    camera = c;
    this.initialRadius = camera.radius;
    this.initialBeta = camera.beta;
    this.initialAlpha = camera.alpha;
  },
};

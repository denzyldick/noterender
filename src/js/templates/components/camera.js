let alpha;
let beta;
let radius;
let camera;
let configuration;
export default {
  render(fft) {
    console.log(
      "alpha",
      camera.alpha,
      "beta",
      camera.beta,
      "radius",
      camera.radius
    );

    if (typeof configuration !== "undefined") {
      if (configuration.options.camera.move === false) {
        console.log(
          "alpha",
          camera.alpha,
          "beta",
          camera.beta,
          "radius",
          camera.radius
        );
        const number = fft * 0.0009;
        camera.radius = this.initialRadius - fft;
        camera.alpha = this.initialAlpha + number;
        camera.beta = this.initialBeta + fft * 0.002;
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

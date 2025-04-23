import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let camera;
let bars = [];
let time = 0;

const template = {
  render(fft, config) {
    console.log("Waveform render function called");

    const fftLength = fft.length;
    const baseHeight = 5;
    const maxHeight = 50;

    for (let i = 0; i < fftLength; i++) {
      const bar = bars[i];
      const fftValue = fft[i] || 0;
      const normalizedHeight = baseHeight + (fftValue / 255) * maxHeight;

      bar.scaling.y = normalizedHeight;
      bar.position.y = bar.scaling.y / 2;

      bar.material.diffuseColor = new BABYLON.Color3(
        fftValue / 255,
        1 - fftValue / 255,
        Math.random()
      );
    }

    time += 0.02;
    PLANE.render(fft);
  },

  init(c, r, nb, scene, width, height, depth, config) {
    camera = c;

    const light = new BABYLON.HemisphericLight(
      "light1",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light.intensity = 1.0;

    PLANE.setCoordinates(0, 0, 0);
    PLANE.init(scene, config);

    const fftLength = 128;
    for (let i = 0; i < fftLength; i++) {
      const bar = BABYLON.MeshBuilder.CreateBox(
        `bar${i}`,
        { width: 2, height: 1, depth: 2 },
        scene
      );
      const material = new BABYLON.StandardMaterial(`barMat${i}`, scene);
      material.diffuseColor = new BABYLON.Color3(
        Math.random(),
        Math.random(),
        Math.random()
      );
      bar.material = material;

      bar.position.x = i * 5 - (fftLength * 5) / 2;
      bar.position.y = 0.5;
      bar.position.z = 0;

      bars.push(bar);
    }

    console.log("Waveform template initialized with 128 bars.");
  }
};

export default template;

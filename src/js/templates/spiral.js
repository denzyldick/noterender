import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let camera;
let spiralObjects = [];
let time = 0;

const template = {
  render(fft, config) {
    console.log("Spiral render function called");

    const fftLength = fft.length;
    const baseRadius = 200;
    const maxRadius = 500;

    for (let i = 0; i < fftLength; i++) {
      const obj = spiralObjects[i];
      const fftValue = fft[i] || 0;
      const radius = baseRadius + (fftValue / 255) * maxRadius;
      const angle = (i / fftLength) * Math.PI * 2 + time;

      obj.position.x = Math.cos(angle) * radius;
      obj.position.z = Math.sin(angle) * radius;
      obj.position.y = Math.sin(time + i * 0.1) * 50;

      obj.material.diffuseColor = new BABYLON.Color3(
        fftValue / 255,
        Math.random(),
        1 - fftValue / 255
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

    const fftLength = 64;
    for (let i = 0; i < fftLength; i++) {
      const obj = BABYLON.MeshBuilder.CreateSphere(
        `sphere${i}`,
        { diameter: 10 },
        scene
      );
      const material = new BABYLON.StandardMaterial(`sphereMat${i}`, scene);
      material.diffuseColor = new BABYLON.Color3(
        Math.random(),
        Math.random(),
        Math.random()
      );
      obj.material = material;

      spiralObjects.push(obj);
    }

    console.log("Spiral template initialized with 64 objects.");
  }
};

export default template;

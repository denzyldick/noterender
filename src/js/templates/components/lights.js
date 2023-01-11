import BABYLON from "babylonjs";

let lights = [];
export default {
  render(fft) {
    for (let i = 0; i < lights.length; i++) {
      const light = lights[i];
      const r = 255 - Math.abs(fft[i] * 0.3);
      const g = Math.abs(fft[i] * 0.3);
      const b = Math.abs(fft[i] * 0.3);
      light.diffuse = BABYLON.Color3.FromInts(r, g, b);
    }
  },
  init(scene, config) {
    lights.push(
      new BABYLON.PointLight(
        "HemiLight",
        new BABYLON.Vector3(0, 0, 100),
        scene
      ),
      new BABYLON.PointLight(
        "HemiLight",
        new BABYLON.Vector3(0, 500, 10),
        scene
      )
    );
  },
};

import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

const bar = [];
let particleSystem;
const t = 200;
const template = {
  render(fft, config) {
    PLANE.render(fft);
  },
  init(c, r, nb, scene, width, height, depth, config) {
    this.camera = c;
    this.lights = [];
    this.lights.push(
      new BABYLON.PointLight("HemiLight", new BABYLON.Vector3(0, 0, 0), scene),
      new BABYLON.PointLight("HemiLight", new BABYLON.Vector3(0, 0, 0), scene)
    );
    PLANE.setCoordinates(0, 250, 0);
    PLANE.init(scene, config); // Creation of a repeated textured material
    this.camera.lockedTarget = PLANE.getPlane();
  },
};
export default template;

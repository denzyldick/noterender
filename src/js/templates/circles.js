import * as BABYLON from "babylonjs";
import PlANE from "./components/plane";
import PLANE from "@/js/templates/components/plane";

let particleSystem;
let camera;
const t = 200;
const size = 10;
let plane;
const template = {
  render(fft, config) {
    PLANE.render(fft);
    const colors = config.colors;
    const fftElement = null;
    for (let i = 0; i < this.elements.length; i++) {
      const barElement = this.elements[i];
      barElement.position.y = 1.2 * i + Math.abs(fft[i]) * 0.5;
    }
    plane.position.z = 0 + fft[20] * 0.04;
    if (config.options.camera.move === false) {
      this.camera.alpha = t;
      this.camera.beta = Math.PI / (2 + fft[3] * 0.003);
      this.camera.radius = 500;
      // t += 0.0008;
    }
  },
  init(cam, r, nb, scene, w, h, d, config) {
    this.camera = cam;
    this.elements = [];

    //Light direction is up and left
    const light = new BABYLON.DirectionalLight(
      "DirectionalLight",
      new BABYLON.Vector3(0, -1, 0),
      scene
    );
    light.diffuse = BABYLON.Color3.FromInts(
      config.light.r,
      config.light.g,
      config.light.b
    );
    light.specular = BABYLON.Color3.FromInts(
      config.light.r,
      config.light.g,
      config.light.b
    );
    PLANE.setCoordinates(200, 200, 0);
    PLANE.init(scene, config);

    plane = PLANE.getPlane();
    const boxInstance = BABYLON.MeshBuilder.CreateSphere("box", {}, scene);
    const materialBox = new BABYLON.StandardMaterial("texture1", scene);

    materialBox.ambientColor = new BABYLON.Color3.FromInts(
      config.colors.r,
      config.colors.g,
      config.colors.b
    );
    boxInstance.material = materialBox;
    const amountOfCircles = 100;
    const width = size;
    const height = size;
    const depth = size;

    const initialX = 0;
    let x = initialX;
    const number = 10;
    const y = number;
    const z = 0;
    /// BOTTOM
    let box = null;
    for (let i = 0; i < amountOfCircles; i++) {
      if (i === 0) {
        box = boxInstance.createInstance("box" + 1);
      } else {
        box = boxInstance.clone("box1");
      }
      const vector3 = new BABYLON.Vector3(x, y, z);
      box.position = vector3;
      if (number / 2 === i) {
        plane.position = new BABYLON.Vector3(x, 250, z);
        this.camera.setTarget(new BABYLON.Vector3(x, 250, z));
      }
      box.scaling = new BABYLON.Vector3(width, height, depth);
      this.elements.push(box);
      if (i % number === 0) {
        // z += height + 20;
        x = initialX;
      } else {
        x += width + 25;
      }
    }
  },
};
export default template;

import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA from "./components/camera";

const lightZ = 10;
const template = {
  render(fft, config) {
    if (typeof this.bar === "undefined") {
      return;
    }
    PLANE.render(fft, config);
    const fftElement1 = fft[fft.length - Math.ceil(fft.length / 10)];
    CAMERA.render(fftElement1);
    let fftElement = null;
    for (let i = 0; i < this.bar.length; i++) {
      fftElement = Math.abs(fft[i]) + 100;
      const barElement = this.bar[i];
      barElement.scaling.y = fft[i] * 3.5;
      barElement.position.z = fft[i] * 0.5;

      const abs = Math.abs(fft[32]);
      console.log(abs, 400 - abs / 2);
    }

    for (let i = 0; i < this.lights.length; i++) {
      const light = this.lights[i];
      const r = 255;
      const g = 0;
      const b = 0;
      console.log("Lights", r, g, b);
      light.position.z = light.position.z * fft[i];

      // light.diffuse = new BABYLON.Color3(0, 1, 0);
      light.specular = new BABYLON.Color3(1, 0, 0);
      // light.groundColor = new BABYLON.Color3(1, 0, 0);
    }
  },
  init(c, r, nb, scene, width, height, depth, config) {
    CAMERA.init(c, config);
    this.initialRadius = c.radius;
    this.initialAlpha = c.alpha;
    this.initialBeta = c.beta;
    this.bar = [];
    this.lights = [];

    this.lights.push(
      new BABYLON.PointLight(
        "HemiLight",
        new BABYLON.Vector3(0, 0, lightZ),
        scene
      ),
      new BABYLON.PointLight(
        "HemiLight",
        new BABYLON.Vector3(0, 0, -lightZ),
        scene
      )
    );

    //Creation of a repeated textured material
    height = 500;

    const boxInstance = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
    const materialBox = new BABYLON.StandardMaterial("texture1", scene);
    materialBox.emissiveColor = BABYLON.Color3.FromInts(
      config.colors.r,
      config.colors.g,
      config.colors.b
    );
    boxInstance.material = materialBox;
    const amountbars = 80;

    const gap = 40;
    let startX = -((amountbars / 2) * gap + 10);
    /// BOTTOM
    for (let i = 0; i < amountbars; i++) {
      // Add and manipulate meshes in the scene
      const box = boxInstance.createInstance("box" + 1);
      startX += gap;
      box.position = new BABYLON.Vector3(startX, -200, 0);
      box.scaling = new BABYLON.Vector3(10, 0, 10);
      this.bar.push(box);
    }

    const pX = (amountbars * (gap + 10)) / 2 - 2000;
    PLANE.setCoordinates(pX, 500, -100);
    PLANE.setScale(1000, 1000, 0);
    PLANE.init(scene, config);
    c.lockedTarget = PLANE.getPlane();
  },
};
export default template;

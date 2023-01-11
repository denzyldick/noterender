import * as BABYLON from "babylonjs";
import CAMERA from "./components/camera";
import PLANE from "./components/plane";

const lightZ = 10;
let t = 0;
let camera = null;
let initialPositions = [];
const template = {
  render(fft, config) {
    if (camera === null) return;
    const fftElement1 = fft[fft.length - Math.ceil(fft.length / 10)];
    if (config.options.camera.move === false) {
      t += 0.02;
      const number = fftElement1 * 0.0009;
      console.log(number, "number");
      camera.radius = this.initialRadius - fftElement1;
      camera.alpha = this.initialAlpha + number;
      camera.beta = this.initialBeta + number;
    }
    // CAMERA.render(fft);
    PLANE.render(fft);
    for (let i = 0; i < this.bar.length; i++) {
      const fftElement = fft[fft.length - i];
      this.bar[i].scaling.x = fftElement * (i === 0 ? 0.9 : i * 0.03);
      this.bar[i].scaling.y = fftElement * (i === 0 ? 0.9 : i * 0.8);
      this.bar[i].position.z = fft[i] * 0.8 + 10;
      console.log(initialPositions["right" + i].x, i);
      this.bar[i].position.x =
        initialPositions["right" + i].x + i * (fftElement * 0.009);
    }
    for (let i = 0; i < this.barTop.length; i++) {
      this.barTop[i].scaling.y =
        fft[fft.length - i] * (i === 0 ? 0.9 : i * 0.03);
      this.barTop[i].scaling.x =
        fft[fft.length - i] * (i === 0 ? 0.9 : i * 0.8);
      this.barTop[i].position.z = -(fft[i] * 0.8 + 10);
    }
    for (let i = 0; i < this.barBottom.length; i++) {
      this.barBottom[i].scaling.y =
        fft[fft.length - i] * (i === 0 ? 0.9 : i * 0.03);
      this.barBottom[i].scaling.x =
        fft[fft.length - i] * (i === 0 ? 0.9 : i * 0.8);
      this.barBottom[i].position.z = -(fft[i] * 0.8 + 10);
    }
    for (let i = 0; i < this.barRight.length; i++) {
      this.barRight[i].scaling.x =
        fft[fft.length - i] * (i === 0 ? 0.9 : i * 0.03);
      this.barRight[i].scaling.y =
        fft[fft.length - i] * (i === 0 ? 0.9 : i * 0.8);
      this.barRight[i].position.z = fft[i] * 0.8 + 10;
    }

    for (let i = 0; i < this.lights.length; i++) {
      const light = this.lights[i];
      const r = 255 - Math.abs(fft[i] * 0.3);
      const g = Math.abs(fft[i] * 0.3);
      const b = Math.abs(fft[i] * 0.3);
      console.log(r, g, b);

      light.diffuse = BABYLON.Color3.FromInts(r, g, b);
      // light.specular = BABYLON.Color3.FromInts(r, g, b);
    }
  },
  init(c, r, nb, scene, width, height, depth, config) {
    camera = c;
    CAMERA.init(c, config);
    PLANE.init(scene, config);
    c.lockedTarget = PLANE.getPlane();
    this.initialRadius = c.radius;
    this.initialAlpha = c.alpha;
    this.initialBeta = c.beta;
    this.bar = [];
    this.barTop = [];
    this.barBottom = [];
    this.barRight = [];
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
    const amount = 20;
    let startX = 0;
    // const startX = 400;
    let startY = 10;
    const barWidth = 1;
    const startZ = 0;
    for (let i = 0; i < amount; i++) {
      const box = boxInstance.createInstance("box" + 1);
      box.position = new BABYLON.Vector3(startX + barWidth, 10, startZ);
      box.scaling = new BABYLON.Vector3(1, 1, 10);
      initialPositions["right" + i] = { x: box.position.x };
      console.log(i, "init");
      this.bar.push(box);
      // startZ -= 10;
      startX += 50;
    }
    startX = PLANE.getPlane().position.x;
    for (let i = 0; i < amount; i++) {
      const box = boxInstance.createInstance("box" + 1);
      box.position = new BABYLON.Vector3(startX + barWidth, startY, startZ);
      box.scaling = new BABYLON.Vector3(1, 1, 10);
      this.barRight.push(box);
      // startZ -= 10;
      startX += -50;
    }

    startY = PLANE.getPlane().position.y;
    for (let i = 0; i < amount; i++) {
      const box = boxInstance.createInstance("box1" + 1);
      box.position = new BABYLON.Vector3(0, startY + barWidth, 0);
      startY += 50;
      box.scaling = new BABYLON.Vector3(1, 1, 10);
      this.barTop.push(box);
    }

    startY = PLANE.getPlane().position.y;
    for (let i = 0; i < amount; i++) {
      const box = boxInstance.createInstance("box1" + 1);
      box.position = new BABYLON.Vector3(0, startY + barWidth, 0);
      startY += -50;
      box.scaling = new BABYLON.Vector3(1, 1, 10);
      this.barBottom.push(box);
    }
  },
};
export default template;

import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

const bar = [];
let particleSystem;
let camera;
let plane;

let x = -1;
let z = -1;
let y = -1;
const size = 30;
const gap = size / 2;
const amount = 20;
const startY = -200 * 2;
2;
y = startY;
// const startZ = -1 - (amount * (size + gap)) / 2;
const startZ = 0 - 200;
z = startZ;
let t = 0;
const startX = -300 / 2 - size * 2;
x = startX;
const template = {
  render(fft, config) {
    // PLANE.render(fft)
    if (config.options.camera.move === false) {
      camera.alpha = Math.cos(t / 50);
      camera.beta = 3 * (Math.PI / 200 + Math.sin(t / 50));
      t += 0.02;
    }
    for (let i = 0; i < this.bar.length; i++) {
      const barElement = this.bar[i].element;
      const x = this.bar[i].originalX;
      const y = this.bar[i].originalY;
      const z = this.bar[i].originalZ;
      const reduced = fft.reduce((a, b) => {
        return a + b;
      });
      const row = this.bar[i].row;
      const column = this.bar[i].column;
      const index = Math.floor(fft.length / row + column);
      const fftElement = fft[index];
      console.log(fftElement, i, row, column, index);
      if (x < 0) {
        this.bar[i].element.position.y = y + fftElement;
        this.bar[i].element.position.x = x - fftElement * 0.9;
      } else {
        this.bar[i].element.position.y = y + fftElement;
        this.bar[i].element.position.x = x + fftElement * 0.9;
      }
      // const r = fft[i] * 0.8;
      // const g = fft[i] * 0.7;
      // const b = fft[i] * 0.8;
      // console.log(r, g, b);
      // barElement.material.ambientColor = BABYLON.Color3.FromInts(r, g, b)
    }
    // particleSystem.maxAngularSpeed = fft[23] + 10;
    // particleSystem.emitRate = 1000 + (fft[32] * 10);
    for (let i = 0; i < this.lights.length; i++) {
      const light = this.lights[i];
      const r = Math.ceil(fft[fft.length - i] * 0.3);
      const g = Math.ceil(fft[i] * 0.3);
      const b = Math.ceil(fft[i] * 0.3);

      light.ambientColor = BABYLON.Color3.FromInts(r, g, b);
      // light.specular = BABYLON.Color3.FromInts(r, g, b);
    }
  },
  init(c, r, nb, scene, width, height, d, config) {
    camera = c;
    // scene.debugLayer.show()
    this.bar = [];
    this.lights = [];

    this.lights.push(
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
    PLANE.init(scene, config);

    const boxInstance = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
    const materialBox = new BABYLON.StandardMaterial("texture1", scene);
    materialBox.ambientColor = BABYLON.Color3.FromInts(
      config.colors.r,
      config.colors.g,
      config.colors.b
    );
    boxInstance.material = materialBox;

    for (let b = 0; b <= 2; b++) {
      for (let i = 0; i <= amount / 2; i++) {
        for (let a = 0; a <= amount; a++) {
          const box = boxInstance.createInstance("box_" + i + "_" + a);
          box.position.x = x;
          box.position.y = y;
          box.position.z = z;
          box.scaling.x = size;
          box.scaling.y = size;
          box.scaling.z = size;

          this.bar.push({
            row: a,
            column: i,
            grid: b,
            originalX: box.position.x,
            originalY: box.position.y,
            originalZ: box.position.z,
            element: box,
          });
          z += size + gap;
        }
        z = startZ;
        y = startY + i * (size + gap);
      }
      z = 0;
      y = startY;
      x = 300 / 2 + size * 2;
    }
  },
};
export default template;

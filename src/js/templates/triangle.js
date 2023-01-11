import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

const bar = [];
const barTop = [];
let particleSystem;
let t = 0;
let camera;
let plane;
const planeSize = 400;
const lightZ = 10;
let size;

const template = {
  render(fft, config) {
    PLANE.render(fft);
    if (config.options.camera.move === false) {
      camera.alpha = Math.cos(t / 50);
      camera.beta = 3 * (Math.PI / 200 + Math.sin(t / 50));
      camera.radius = 2000 - fft[40];
      t += 0.02;
    }
    plane.scaling.x = planeSize + fft[1] * 0.2;
    plane.scaling.y = planeSize + fft[1] * 0.2;
    /// top
    for (let i = 0; i < this.bar.length; i++) {
      const middle = fft.length - 1;
      let position;

      if (i <= this.bar.length / 2) {
        position = middle - i - 10;
      } else {
        position = middle - (this.bar.length - i) - 10;
      }
      const fftElement = fft[position];
      for (let o = 0; o < this.bar[i].path.length; o++) {
        if (o === 1) {
          this.bar[i].path[o].y = plane.scaling.y / 2 + fftElement * 0.9;
        }
        // this.bar[i].path[o].z = fftElement * 1.2;
      }
      this.bar[i].mesh = BABYLON.Mesh.CreateRibbon(
        null,
        [this.bar[i].path],
        true,
        false,
        0,
        this.scene,
        true,
        null,
        this.bar[i].mesh
      );
    }
    // left
    for (let i = 0; i < this.barTop.length; i++) {
      const middle = fft.length - 1;
      let position;

      if (i <= this.barTop.length / 2) {
        position = middle - i - 10;
      } else {
        position = middle - (this.barTop.length - i) - 10;
      }
      const fftElement = fft[position];
      for (let o = 0; o < this.barTop[i].path.length; o++) {
        if (o === 1) {
          this.barTop[i].path[o].x = plane.scaling.x / 2 + fftElement * 0.9;
        }
        // this.barTop[i].path[o].z = fftElement * 1.2;
      }
      this.barTop[i].mesh = BABYLON.Mesh.CreateRibbon(
        null,
        [this.barTop[i].path],
        true,
        false,
        0,
        this.scene,
        true,
        null,
        this.barTop[i].mesh
      );
    }
    //bottom
    for (let i = 0; i < this.barBottom.length; i++) {
      const middle = fft.length - 1;
      let position;

      if (i <= this.barBottom.length / 2) {
        position = middle - i - 10;
      } else {
        position = middle - (this.barBottom.length - i) - 10;
      }
      const fftElement = fft[position];
      for (let o = 0; o < this.barBottom[i].path.length; o++) {
        if (o === 2) {
          this.barBottom[i].path[o].y =
            plane.position.y - plane.scaling.y / 2 - fftElement * 0.9;
        }
        // this.barBottom[i].path[o].z = fftElement * 1.2;
      }
      this.barBottom[i].mesh = BABYLON.Mesh.CreateRibbon(
        null,
        [this.barBottom[i].path],
        true,
        false,
        0,
        this.scene,
        true,
        null,
        this.barBottom[i].mesh
      );
    }
    for (let i = 0; i < this.barRight.length; i++) {
      const middle = fft.length - 1;
      let position;

      if (i <= this.barRight.length / 2) {
        position = middle - i - 10;
      } else {
        position = middle - (this.barRight.length - i) - 10;
      }
      const fftElement = fft[position];
      for (let o = 0; o < this.barRight[i].path.length; o++) {
        if (o === 1) {
          this.barRight[i].path[o].x =
            plane.position.x - plane.scaling.x / 2 - fftElement * 0.9;
        }
        // this.barRight[i].path[o].z = fftElement * 1.2;
      }
      this.barRight[i].mesh = BABYLON.Mesh.CreateRibbon(
        null,
        [this.barRight[i].path],
        true,
        false,
        0,
        this.scene,
        true,
        null,
        this.barRight[i].mesh
      );
    }
  },
  init(c, r, nb, scene, width, height, depth, config) {
    this.scene = scene;
    camera = c;
    this.bar = [];
    this.barTop = [];
    this.barBottom = [];
    this.barRight = [];
    this.camera = c;
    this.lights = [];
    this.lights
      .push
      // new BABYLON.PointLight("HemiLight", new BABYLON.Vector3(0, 0, lightZ), scene),
      // new BABYLON.PointLight("HemiLight", new BABYLON.Vector3(0, 0, -lightZ), scene),
      ();
    PLANE.setCoordinates(0, 0, 0);
    PLANE.init(scene, config);
    plane = PLANE.getPlane();
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
    let startY = 10;
    startX = plane.position.x + plane.scaling.x / 2;
    startY = plane.position.y + plane.scaling.y / 2 + 25;
    for (let i = 0; i < amount; i++) {
      const z = 0;
      size = plane.scaling.x / amount;
      const points = [
        new BABYLON.Vector3(startX, startY, z),
        new BABYLON.Vector3(startX - size / 2, startY, z),
        new BABYLON.Vector3(startX - size, startY, z),
      ];
      const mesh = BABYLON.Mesh.CreateRibbon(
        "hex" + i,
        [points],
        true,
        false,
        0,
        scene,
        true
      );
      mesh.material = materialBox;
      this.bar.push({
        mesh: mesh,
        path: points,
      });
      startX -= size;
    }

    startY = plane.scaling.y / 2;
    startX = plane.position.x - plane.scaling.x / 2 - 25;
    // size = plane.scaling.y / 10;
    // startY -= size;
    for (let i = 0; i < amount; i++) {
      const z = 0;

      const points = [
        new BABYLON.Vector3(startX, startY, z),
        new BABYLON.Vector3(startX - size / 2, startY - size / 2, z),
        new BABYLON.Vector3(startX, startY - size, z),
      ];
      const mesh = BABYLON.Mesh.CreateRibbon(
        "hex" + i,
        [points],
        true,
        false,
        0,
        scene,
        true
      );
      mesh.material = materialBox;
      this.barRight.push({
        mesh: mesh,
        path: points,
      });
      startY -= size;
    }

    startX = plane.position.x - plane.scaling.x / 2;
    startY = plane.position.y - plane.scaling.y / 2 - 25;
    size = plane.scaling.y / amount;
    for (let i = 0; i < amount; i++) {
      const z = 0;
      const points = [
        new BABYLON.Vector3(startX, startY, z),
        new BABYLON.Vector3(startX + size, startY, z),
        new BABYLON.Vector3(startX + size / 2, startY, z),
      ];
      const mesh = BABYLON.Mesh.CreateRibbon(
        "hex" + i,
        [points],
        true,
        false,
        0,
        scene,
        true
      );
      mesh.material = materialBox;
      this.barBottom.push({
        mesh: mesh,
        path: points,
      });
      startX += size;
    }

    startX = plane.position.x + plane.scaling.x / 2 + 25;
    startY = plane.position.y + plane.scaling.y / 2;
    size = plane.scaling.y / amount;
    startY -= size;
    for (let i = 0; i < amount; i++) {
      const z = 0;

      const points = [
        new BABYLON.Vector3(startX, startY, z),
        new BABYLON.Vector3(startX + size / 2, startY + size / 2, z),
        new BABYLON.Vector3(startX, startY + size, z),
      ];
      const mesh = BABYLON.Mesh.CreateRibbon(
        "hex" + i,
        [points],
        true,
        false,
        0,
        scene,
        true
      );
      mesh.material = materialBox;
      this.barTop.push({
        mesh: mesh,
        path: points,
      });
      startY -= size;
    }
  },
};
export default template;

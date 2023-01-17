# Noterender

This is the code for the visualizer I made. The visualizer is running on [https://noterender.com](https://noterender.com).


![example](https://github.com/denzyldick/noterender/blob/main/example.gif)

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```
### How to

The 3D rendering works with [babylonjs](https://www.babylonjs.com/). If you do not know how to work with 
babylonjs I will recommend you to read their documentation. In the code below you can see a working example of the 
immersive template. 

The are 2 important methods/functions you should implement. The `init` and the `render` function. 
The `init` function will be called 1 time when the template is loaded into the dom. 
The `render` function is where you should add your animation logic. 

```js
import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import LIGHTS from "./components/lights";

const bar = [];
let particleSystem;
let t = 0;
let camera = null;
let plane;
const template = {
  render(fft, config) {
    if (camera === null) {
      return;
    }
    PLANE.render(fft);
    const fftElement1 = fft[fft.length - Math.ceil(fft.length / 10)];

    if (config.options.camera.move === false) {
      t += 0.02;
      const number = fftElement1 * 0.00005;
      console.log(number, "number");
      camera.radius = this.initialRadius - fftElement1;
      camera.alpha = this.initialAlpha + number;
      camera.beta = this.initialBeta + number;
    }
    const colors = config.colors;
    const fftElement = null;

    for (let i = 0; i < this.bar.length; i++) {
      const barElement = this.bar[i];
      if (barElement.vertical === true) {
        barElement.scaling.y = fft[i] * 0.9;
      } else {
        barElement.scaling.x = fft[i] * 0.9;
      }

      if (fftElement1 <= 255 && fftElement1 > 0) {
        const r = Math.ceil(fftElement1 + config.colors.r);
        const g = Math.ceil(fftElement1 + config.colors.g);
        const b = Math.ceil(fftElement1 + config.colors.b);
        barElement.material.diffuseColor = BABYLON.Color3.FromInts(r, g, b);
        barElement.material.specularColor = BABYLON.Color3.FromInts(r, g, b);
      } else {
        barElement.material.ambientColor = BABYLON.Color3.FromInts(
          config.colors.r,
          config.colors.g,
          config.colors.b
        );
      }
    }
    for (let i = 0; i < this.lights.length; i++) {
      const light = this.lights[i];
      if (fftElement1 <= 255 && fftElement1 > 0) {
        const r = Math.ceil(fftElement1 + config.light.r);
        const g = Math.ceil(fftElement1 + config.light.g);
        const b = Math.ceil(fftElement1 + config.light.b);
        console.log(fftElement1, r, g, b);
        light.difuse = BABYLON.Color3.FromInts(r, g, b);
        light.specular = BABYLON.Color3.FromInts(r, g, b);
      }
    }
  },
  init(c, r, nb, scene, width, height, d, config) {
    this.initialRadius = c.radius;
    this.initialAlpha = c.alpha;
    this.initialBeta = c.beta;
    camera = c;
    this.bar = [];
    this.lights = [];
    const light = new BABYLON.DirectionalLight(
      "light1",
      new BABYLON.Vector3(0, 250, -10),
      scene
    );
    light.position = new BABYLON.Vector3(0, 250, 10);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.1;
    this.lights.push(light);
    this.lights.push(
      new BABYLON.PointLight(
        "HemiLight",
        new BABYLON.Vector3(0, 0, 100),
        scene
      ),
      new BABYLON.PointLight("HemiLight", new BABYLON.Vector3(0, 0, 10), scene)
    );

    PLANE.setCoordinates(0, 250, 0);
    PLANE.init(scene, config);

    camera.lockedTarget = PLANE.getPlane();
    height = 500;
    const boxInstance = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
    const materialBox = new BABYLON.StandardMaterial("texture1", scene);
    materialBox.ambientColor = BABYLON.Color3.FromInts(
      config.colors.r,
      config.colors.g,
      config.colors.b
    );
    boxInstance.material = materialBox;
    const amountbars = 10;
    const depth = 100;
    /// Right
    for (let i = 0; i < amountbars; i++) {
      // Add and manipulate meshes in the scene
      const box = boxInstance.createInstance("box" + 1);

      box.position = new BABYLON.Vector3(+width / 2 + 20, 50 * i, depth / 2);
      box.scaling = new BABYLON.Vector3(10, 10, depth);
      this.bar.push(box);
    }

    //LEFT
    for (let i = 0; i < amountbars; i++) {
      // Add and manipulate meshes in the scene
      const box = boxInstance.createInstance("box" + 1);

      box.position = new BABYLON.Vector3(-width / 2 - 20, 50 * i, depth / 2);
      box.scaling = new BABYLON.Vector3(10, 10, depth);
      this.bar.push(box);
    }
    ///  TOP
    for (let i = 0; i < amountbars; i++) {
      // Add and manipulate meshes in the scene
      const box = boxInstance.createInstance("box" + 1);

      box.position = new BABYLON.Vector3(
        -width / 2 + 50 * i,
        height + 20,
        depth / 2
      );
      box.scaling = new BABYLON.Vector3(10, 10, depth);
      box.vertical = true;
      this.bar.push(box);
    }
    /// BOTTOM
    for (let i = 0; i < amountbars; i++) {
      // Add and manipulate meshes in the scene
      const box = boxInstance.createInstance("box" + 1);

      box.position = new BABYLON.Vector3(-width / 2 + 50 * i, -20, depth / 2);
      box.scaling = new BABYLON.Vector3(10, 10, depth);
      box.vertical = true;
      this.bar.push(box);
    }
  },
};
export default template;
```

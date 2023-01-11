import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

const bar = [];
let particleSystem;
let t = 0;
const template = {
  render(fft, config) {
    PLANE.render(fft);
    this.camera.alpha = this.camera.alpha + t * Math.PI;
    let fftSum = fft.reduce((a, b) => a + b);
    if (this.lights.length > 0) {
      for (let i = 0; i < this.lights.length; i++) {
        // this.lights[i].position.z = -(100 / fftSum)
      }
    }
    for (let i = 0; i < this.linesHorizontal.length; i++) {
      this.linesHorizontal[i].position.x = Math.tan(t) * i * 0.08;
      console.log();
      this.linesHorizontal[i].position.z = 300 - fftSum * 0.0008;

      this.linesHorizontal[i].scaling.x = 1000 - fft[i] * 1.9;
    }
    for (let i = 0; i < this.linesVertical.length; i++) {
      this.linesVertical[i].scaling.y = 1000 - fft[i] * 1.99;
      this.linesVertical[i].position.z = 300 - fftSum * 0.0008;
    }
  },
  init(c, r, nb, scene, width, height, depth, config) {
    this.camera = c;
    const radiusAnimation = new BABYLON.Animation(
      "camRadius",
      "radius",
      7,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    const keys1 = [
      {
        frame: 0,
        value: 1000,
      },
      {
        frame: 100,
        value: 800,
      },
    ];
    radiusAnimation.setKeys(keys1);

    let alpha = this.camera.alpha;
    const alphaAnimation = new BABYLON.Animation(
      "camAlpha",
      "alpha",
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
    );
    const keys2 = [
      {
        frame: 0,
        value: 0,
      },
      {
        frame: 100,
        value: 1.8,
      },
    ];
    alphaAnimation.setKeys(keys2);

    const betaAnimation = new BABYLON.Animation(
      "camBeta",
      "beta",
      10,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE__CYCLE
    );
    let value = this.camera.beta;
    const keys3 = [
      {
        frame: 0,
        value: value,
      },
      {
        frame: 50,
        value: 1.8,
      },
      {
        frame: 100,
        value: value,
      },
    ];
    betaAnimation.setKeys(keys3);

    this.camera.animations.push(radiusAnimation);
    // this.camera.animations.push(alphaAnimation)
    this.camera.animations.push(betaAnimation);
    scene.beginAnimation(this.camera, 0, 100, true);

    this.lights = [];
    this.lights.push(
      new BABYLON.PointLight(
        "HemiLight",
        new BABYLON.Vector3(500, 0, -20),
        scene
      )
    );
    this.lights.push(
      new BABYLON.PointLight(
        "HemiLight",
        new BABYLON.Vector3(-500, 0, -20),
        scene
      )
    );
    this.lights.push(
      new BABYLON.PointLight(
        "HemiLight",
        new BABYLON.Vector3(0, 500, -20),
        scene
      )
    );
    this.lights.push(
      new BABYLON.PointLight(
        "HemiLight",
        new BABYLON.Vector3(0, -500, -200),
        scene
      )
    );

    PLANE.setCoordinates(0, 250, 0);
    PLANE.init(scene, config); // Creation of a repeated textured material
    this.camera.lockedTarget = PLANE.getPlane();

    /// Lines
    this.linesHorizontal = [];
    this.linesVertical = [];
    const boxInstance = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
    const materialBox = new BABYLON.StandardMaterial("texture1", scene);
    materialBox.emissiveColor = BABYLON.Color3.FromInts(
      config.colors.r,
      config.colors.g,
      config.colors.b
    );
    materialBox.diffuseColor = BABYLON.Color3.FromInts(255, 0, 40);

    boxInstance.material = materialBox;
    let startY = -400;
    let startX = -1000;
    for (let i = 0; i <= 40; i++) {
      const box = boxInstance.createInstance("box" + 1);
      box.scaling = new BABYLON.Vector3(1000, 40, 10);
      box.position = new BABYLON.Vector3(0, startY + i * 80, 100);
      this.linesHorizontal.push(box);
    }

    for (let i = 0; i <= 40; i++) {
      const box = boxInstance.createInstance("line" + 1);
      box.scaling = new BABYLON.Vector3(40, 1000, 10);
      box.position = new BABYLON.Vector3(startX + i * 80, 0, 100);
      this.linesVertical.push(box);
    }
  },
};
export default template;

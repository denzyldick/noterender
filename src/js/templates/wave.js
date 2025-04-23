import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA from "./components/camera";

let bar = [];
let lights = [];
const template = {
  render(fft, config) {
    // CAMERA.render(fft);
    PLANE.render(fft);
    for (let i = 0; i < bar.length; i++) {
      const barElement = bar[i];
      barElement.scaling.z = fft[i] * 5; // Increase scaling for better visibility
    }

    for (let i = 0; i < lights.length; i++) {
      const light = lights[i];
      const r = 255 - Math.abs(fft[i] * 0.3);
      const g = Math.abs(fft[i] * 0.3);
      const b = Math.abs(fft[i] * 0.3);
      light.diffuse = BABYLON.Color3.FromInts(r, g, b);
    }
  },
  init(c, r, nb, scene, width, height, depth, config) {
    CAMERA.init(c, config);
    lights.push(
      new BABYLON.PointLight(
        "HemiLight",
        new BABYLON.Vector3(0, 0, 100),
        scene,
      ),
      new BABYLON.PointLight(
        "HemiLight",
        new BABYLON.Vector3(0, 500, 10),
        scene,
      ),
    );

    // Center the plane
    PLANE.setCoordinates(0, 0, 0);
    PLANE.init(scene, config);
    c.lockedTarget = PLANE.getPlane();

    height = 200; // Adjust height for proportionality
    width = 200; // Adjust width for proportionality

    const boxInstance = BABYLON.MeshBuilder.CreateBox("box", { size: 10 }, scene); // Increase size for visibility
    const materialBox = new BABYLON.StandardMaterial("texture1", scene);
    materialBox.ambientColor = BABYLON.Color3.FromInts(
      config.colors.r,
      config.colors.g,
      config.colors.b,
    );
    boxInstance.material = materialBox;
    const amountBars = 10;

    /// Right
    for (let i = 0; i < amountBars; i++) {
      // Add and manipulate meshes in the scene
      const box = boxInstance.createInstance("box" + i);

      box.position = new BABYLON.Vector3(+width / 2 + 20, 20 * i, depth + 50); // Position in front of the plane
      box.scaling = new BABYLON.Vector3(10, 10, 10); // Adjust scaling
      bar.push(box);
    }

    //LEFT
    for (let i = 0; i < amountBars; i++) {
      // Add and manipulate meshes in the scene
      const box = boxInstance.createInstance("box" + i);
      box.position = new BABYLON.Vector3(-width / 2 - 20, 20 * i, depth + 50); // Position in front of the plane
      box.scaling = new BABYLON.Vector3(10, 10, 10); // Adjust scaling
      bar.push(box);
    }

    ///  TOP
    for (let i = 0; i < amountBars; i++) {
      // Add and manipulate meshes in the scene
      const box = boxInstance.createInstance("box" + i);
      box.position = new BABYLON.Vector3(-width / 2 + 20 * i, height + 20, depth + 50); // Position in front of the plane
      box.scaling = new BABYLON.Vector3(10, 10, 10); // Adjust scaling
      bar.push(box);
    }

    /// BOTTOM
    for (let i = 0; i < amountBars; i++) {
      const box = boxInstance.createInstance("box" + i);
      box.position = new BABYLON.Vector3(-width / 2 + 20 * i, -20, depth + 50); // Position in front of the plane
      box.scaling = new BABYLON.Vector3(10, 10, 10); // Adjust scaling
      bar.push(box);
    }
  },
};
export default template;

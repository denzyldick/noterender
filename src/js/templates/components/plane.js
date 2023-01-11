import * as BABYLON from "babylonjs";

let width = 300;
let height = 300;
let depth = 200;
let x = 0;
let y = 0;
let z = 0;
let plane;
let particleSystem;

export default {
  setCoordinates(initialX, initialY, initialZ) {
    x = initialX;
    y = initialY;
    z = initialZ;
    this.initialZ = z;
  },
  setScale(startWidth, startHeight, startDepth) {
    width = startWidth;
    height = startHeight;
    depth = startDepth;
  },
  render(fft) {
    let fftSum = fft.reduce((a, b) => a + b);
    plane.scaling.x = fftSum * 0.08 + width;
    plane.scaling.y = fftSum * 0.08 + height;
    particleSystem.maxAngularSpeed = fft[23] * 0.3;
    particleSystem.emitRate = 1000 + fft[32] * 100;

    particleSystem.color1 = BABYLON.Color3.FromInts(0.01 * fft[32], 0, 0);
  },
  init(scene, config) {
    //Creation of a repeated textured material
    const materialPlane = new BABYLON.StandardMaterial("texturePlane", scene);
    materialPlane.diffuseTexture = new BABYLON.Texture(config.emblem, scene);
    materialPlane.specularTexture = new BABYLON.Texture(config.emblem, scene);
    materialPlane.emissiveTexture = new BABYLON.Texture(config.emblem, scene);
    materialPlane.ambientTexture = new BABYLON.Texture(config.emblem, scene);
    materialPlane.diffuseTexture.hasAlpha = true;
    materialPlane.transparencyMode =
      BABYLON.Material.MATERIAL_ALPHATESTANDBLEND;
    materialPlane.useAlphaFromDiffuseTexture = true;
    materialPlane.backFaceCulling = true; //Allways show the front and the back of an element
    //Creation of a plane
    materialPlane.diffuseColor = BABYLON.Color3.FromInts(0, 200, 0);
    plane = BABYLON.MeshBuilder.CreatePlane("plane", {}, scene);
    plane.material = materialPlane;
    plane.position = new BABYLON.Vector3(x, y, z);
    plane.scaling = new BABYLON.Vector3(width, height, depth);
    //// Particle system

    // Create a particle system
    particleSystem = new BABYLON.ParticleSystem("particles", 500, scene);

    //Texture of each particle
    particleSystem.particleTexture = new BABYLON.Texture(
      "/img/templates/Smoke30Frames.png",
      scene
    );

    // Where the particles come from
    particleSystem.emitter = plane; // the starting object, the emitter
    particleSystem.minEmitBox = new BABYLON.Vector3(-1, -1, 0); // Starting all from
    // particleSystem.maxEmitBox = new BABYLON.Vector3(1, 1, 0); // To...

    // Colors of all particles
    particleSystem.color1 = BABYLON.Color3.FromInts(255, 0, 10);
    // particleSystem.color2 = BABYLON.Color3.FromInts(0, 244, 10);
    // particleSystem.colorDead = BABYLON.Color3.FromInts(0, 244, 33);

    // Size of each particle (random between...
    particleSystem.minSize = 1;
    particleSystem.maxSize = 20;

    // Life time of each particle (random between...
    particleSystem.minLifeTime = 0.1;
    particleSystem.maxLifeTime = 5;

    // Emission rate
    particleSystem.emitRate = 1000;

    // Set the gravity of all particles
    particleSystem.gravity = new BABYLON.Vector3(0, 0, -10);

    // Direction of each particle after it has been emitted
    particleSystem.direction1 = new BABYLON.Vector3(0, 0, -1);
    particleSystem.direction2 = new BABYLON.Vector3(0, 0, -1);

    // Angular speed, in radians
    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = 10;

    // Speed
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 10;
    particleSystem.updateSpeed = 0.005;

    // Start the particle system
    particleSystem.start();
  },
  getPlane() {
    return plane;
  },
};

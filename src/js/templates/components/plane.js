import * as BABYLON from "babylonjs";

let baseWidth = 200;
let baseHeight = 200;
let activeWidth = 200;
let activeHeight = 200;
let x = 0;
let y = 0;
let z = 0;
let plane;
let particleSystem;
let sceneRef;

export default {
  setCoordinates(initialX, initialY, initialZ) {
    x = initialX;
    y = initialY;
    z = initialZ;
  },
  
  setScale(width, height) {
    baseWidth = width;
    baseHeight = height;
  },

  render(fft) {
    if (!plane) return;

    // Calculate audio intensity
    let bassSum = 0;
    for (let i = 0; i < 10; i++) bassSum += fft[i];
    const avgBass = bassSum / 10 / 255;

    let midSum = 0;
    for (let i = 10; i < 40; i++) midSum += fft[i];
    const avgMid = midSum / 30 / 255;

    // More reactive scaling
    // Max growth 25% (reduced from 40% for better clarity)
    let scaleFactor = 1 + (avgBass * 0.25) + (avgMid * 0.05);
    scaleFactor = Math.min(scaleFactor, 1.25); 
    
    // Use the active scale captured at init
    plane.scaling.x = activeWidth * scaleFactor;
    plane.scaling.y = activeHeight * scaleFactor;

    // Subtle rotation
    plane.rotation.z = Math.sin(Date.now() * 0.001) * 0.05 + (avgMid * 0.1);

    if (particleSystem) {
        particleSystem.maxAngularSpeed = avgBass * 2;
        particleSystem.emitRate = 100 + (avgBass * 400); // Drastically reduced from 500-2500
        const intensity = 0.4 + avgBass * 0.6;
        particleSystem.color1 = new BABYLON.Color4(intensity, intensity * 0.5, 1, 0.6); // Added alpha
    }
  },

  init(scene, config) {
    sceneRef = scene;
    
    // Capture the scale requested for this template instance
    activeWidth = baseWidth;
    activeHeight = baseHeight;

    // Dispose previous if exists
    if (plane) plane.dispose();
    if (particleSystem) particleSystem.dispose();

    const materialPlane = new BABYLON.StandardMaterial("logoMaterial", scene);
    
    const texture = new BABYLON.Texture(config.emblem || "/img/logo.png", scene);
    texture.hasAlpha = true;
    
    materialPlane.diffuseTexture = texture;
    materialPlane.emissiveTexture = texture;
    materialPlane.useAlphaFromDiffuseTexture = true;
    materialPlane.transparencyMode = BABYLON.Material.MATERIAL_ALPHATESTANDBLEND;
    materialPlane.backFaceCulling = false;
    materialPlane.specularColor = new BABYLON.Color3(0, 0, 0);

    // Create Plane
    plane = BABYLON.MeshBuilder.CreatePlane("logoPlane", { size: 1 }, scene);
    plane.material = materialPlane;
    
    // Initial State
    plane.position = new BABYLON.Vector3(x, y, z);
    plane.scaling = new BABYLON.Vector3(activeWidth, activeHeight, 1);
    
    plane.rotation.y = 0;

    // Particles
    this.initParticles(scene, plane);

    // Reset internal state for NEXT template
    baseWidth = 200;
    baseHeight = 200;
    x = 0;
    y = 0;
    z = 0;
  },

  initParticles(scene, emitter) {
    particleSystem = new BABYLON.ParticleSystem("logoParticles", 500, scene); // Reduced capacity
    particleSystem.particleTexture = new BABYLON.Texture("/img/templates/Smoke30Frames.png", scene);
    particleSystem.emitter = emitter;
    
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.4, -0.4, 0);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.4, 0.4, 0);

    particleSystem.color1 = new BABYLON.Color4(0.1, 0.5, 1.0, 0.8);
    particleSystem.color2 = new BABYLON.Color4(0.1, 0.2, 0.5, 0.5);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);

    particleSystem.minSize = 2; // Reduced from 5
    particleSystem.maxSize = 15; // Reduced from 40
    particleSystem.minLifeTime = 0.4;
    particleSystem.maxLifeTime = 1.0;
    particleSystem.emitRate = 200; // Reduced from 1000
    particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
    particleSystem.direction1 = new BABYLON.Vector3(0, 0, 0.5);
    particleSystem.direction2 = new BABYLON.Vector3(0, 0, 1);
    particleSystem.minEmitPower = 0.5;
    particleSystem.maxEmitPower = 2;
    particleSystem.updateSpeed = 0.01;

    particleSystem.start();
  },

  getPlane() {
    return plane;
  }
};

import * as BABYLON from "babylonjs";

let baseWidth = 200;
let baseHeight = 200;
let activeWidth = 200;
let activeHeight = 200;
let x = 0;
let y = 0;
let z = 0;
let plane;
let sceneRef;
let smoothedBass = 0;
let liquidMesh;
let liquidStyle = "Liquid"; 

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

  setRenderingGroupId(id) {
    if (plane) plane.renderingGroupId = id + 1;
    if (liquidMesh) liquidMesh.renderingGroupId = id;
  },

  render(fft, config) {
    if (!plane) return;
    liquidStyle = config.logoStyle || "Liquid";

    let bassSum = 0;
    for (let i = 0; i < 12; i++) bassSum += fft[i];
    const avgBass = (bassSum / 12 / 255) * (config.sensitivity ? config.sensitivity.bassBoost : 1.0);
    
    smoothedBass += (avgBass - smoothedBass) * 0.15;

    // Only pulse if NOT in "None" mode
    const scaleFactor = (liquidStyle === "None") ? 1 : 1 + (avgBass * 0.2);
    plane.scaling.x = activeWidth * scaleFactor;
    plane.scaling.y = activeHeight * scaleFactor;

    plane.rotation.z = 0;

    if (liquidStyle === "None") return;

    let primaryCol;
    if (config.dynamicColors) {
        const hue = (Date.now() * 0.0005) % 1;
        const rgb = this.hslToRgb(hue, 0.8, 0.5);
        primaryCol = new BABYLON.Color3(rgb.r, rgb.g, rgb.b);
    } else {
        primaryCol = new BABYLON.Color3(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
    }

    if (liquidStyle === "Liquid") {
        this.renderLiquid(fft, primaryCol);
    }
  },

  renderLiquid(fft, color) {
    if (!liquidMesh) return;
    const positions = liquidMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    for (let i = 0; i < positions.length; i += 3) {
        const xP = positions[i];
        const yP = positions[i+1];
        const dist = Math.sqrt(xP*xP + yP*yP);
        if (dist > 0.4) { 
            const angle = Math.atan2(yP, xP);
            const normAngle = (angle + Math.PI) / (Math.PI * 2);
            const fftIdx = Math.floor(normAngle * (fft.length * 0.6));
            const val = fft[fftIdx] || 0;
            const subtleWave = Math.sin(Date.now() * 0.002 + angle * 2) * 0.02;
            const targetDist = 0.5 + (val / 255) * 0.3 + subtleWave;
            positions[i] = Math.cos(angle) * targetDist;
            positions[i+1] = Math.sin(angle) * targetDist;
        }
    }
    liquidMesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    liquidMesh.material.emissiveColor.copyFrom(color);
    liquidMesh.material.alpha = 0.3 + (fft[0]/255) * 0.4;
  },

  init(scene, config) {
    sceneRef = scene;
    activeWidth = baseWidth;
    activeHeight = baseHeight;
    liquidStyle = config.logoStyle || "Liquid";

    if (plane) plane.dispose();
    if (liquidMesh) liquidMesh.dispose();

    // ULTRA Sharp Logo Material
    const materialPlane = new BABYLON.StandardMaterial("logoMaterial", scene);
    
    // Disable mipmaps and use BILINEAR for a crisper look on 2D assets
    const texture = new BABYLON.Texture(config.emblem || "/img/logo.png", scene, true, true, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
    texture.hasAlpha = true;
    texture.anisotropicFilteringLevel = 16;
    
    materialPlane.diffuseTexture = texture;
    materialPlane.emissiveTexture = texture;
    materialPlane.emissiveColor = new BABYLON.Color3(1, 1, 1);
    materialPlane.diffuseColor = new BABYLON.Color3(0, 0, 0); 
    materialPlane.specularColor = new BABYLON.Color3(0, 0, 0);
    
    // Use Alpha Test for cleaner edges
    materialPlane.useAlphaFromDiffuseTexture = true;
    materialPlane.transparencyMode = BABYLON.Material.MATERIAL_ALPHATEST;
    materialPlane.backFaceCulling = false;

    plane = BABYLON.MeshBuilder.CreatePlane("logoPlane", { size: 1 }, scene);
    plane.material = materialPlane;
    plane.position = new BABYLON.Vector3(x, y, z);
    plane.scaling = new BABYLON.Vector3(activeWidth, activeHeight, 1);
    plane.renderingGroupId = 2; 

    if (liquidStyle === "None") {
        baseWidth = 200; baseHeight = 200; x = 0; y = 0; z = 0;
        return;
    }

    if (liquidStyle === "Liquid") {
        liquidMesh = BABYLON.MeshBuilder.CreateDisc("liquid", { radius: 0.5, tessellation: 256, updatable: true }, scene);
        liquidMesh.parent = plane;
        liquidMesh.position.z = 0.1; 
        liquidMesh.renderingGroupId = 1; 
        const liquidMat = new BABYLON.StandardMaterial("liquidMat", scene);
        liquidMat.disableLighting = true;
        liquidMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        liquidMat.alpha = 0.8;
        liquidMesh.material = liquidMat;
    }

    baseWidth = 200; baseHeight = 200; x = 0; y = 0; z = 0;
  },

  hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r, g, b };
  },

  getPlane() {
    return plane;
  }
};

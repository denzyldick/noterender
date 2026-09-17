import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";
import { asset } from "../assets";
import { ensureGlow } from "./components/glow";

let currentScene;
let currentCamera;
let currentTemplateConfig = {};

let worldRoot;              // scaled + centered root for the whole model
let trainRoot;              // moves to the beat, child of worldRoot
let stationRoot;            // static child of worldRoot
let lightMeshes = [];
let growClosures = [];
let loaded = false;
let loadError = false;
let destroyed = false;

let t = 0;
let trainBaseZ = 0;
let trainTop = 0;
let trainVel = 0;
let bassSmooth = 0;
let accentSmooth = 0;

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();

const TRAIN_GROUPS = new Set([
  "DriverCabin", "TechoInterior", "AsientosInteriores", "BajosExterioresTren",
  "LateralesInteriores", "PuertasLaterales", "CabezaTren", "LateralTren",
  "PuertaDelantera", "TechoTren", "SueloInterior",
]);
const LIGHT_GROUPS = new Set([
  "FluorescenteLuz", "Fluorescente", "Semaforo", "LuzTunelLarga", "LuzTunelCorta",
]);

const MODEL_DIR = "assets/station/";
const MODEL_FILE = "subway.gltf";

function groupOf(name) {
  if (!name) return "";
  const m = String(name).match(/_([^_]+)_(\d+)$/) || String(name).match(/_([^_]+)$/);
  return m ? m[1] : "";
}

const template = {
  async init(camera, renderer, nb, scene, width, height, d, config) {
    currentScene = scene;
    currentCamera = camera;
    currentTemplateConfig = config.templates.find(td => td.name === 'station')?.currentConfig || {};
const c = config.templates && config.templates.find(td => td.name === 'station')
    ? config.templates.find(td => td.name === 'station').currentConfig
    : currentTemplateConfig;
    t = 0;
    loaded = false;
    loadError = false;
    destroyed = false;
    trainBaseZ = 0;
    trainVel = 0;
    lightMeshes = [];
    growClosures = [];

    CAMERA_PHYSICS.lock();

    scene.clearColor = new BABYLON.Color4(0.004, 0.006, 0.01, 1);
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.0018;
    scene.fogColor = new BABYLON.Color3(0.004, 0.006, 0.01);

    ensureGlow(scene, 0.9);

    const hemi = new BABYLON.HemisphericLight("stationHemi", new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.55;
    hemi.diffuse = new BABYLON.Color3(1, 1, 1);
    hemi.groundColor = new BABYLON.Color3(0.04, 0.05, 0.09);

    const key = new BABYLON.DirectionalLight("stationKey", new BABYLON.Vector3(-0.55, -0.7, -0.45), scene);
    key.intensity = 1.6;

    const fill = new BABYLON.DirectionalLight("stationFill", new BABYLON.Vector3(0.6, 0.1, 0.9), scene);
    fill.intensity = 0.45;

    if (camera) {
      camera.setTarget(BABYLON.Vector3.Zero());
      camera.radius = 112;
      camera.alpha = 0;
      camera.beta = Math.PI / 2.3;
      camera.fov = 0.5;
    }

    BABYLON.SceneLoader.ImportMeshAsync("", asset("/" + MODEL_DIR), MODEL_FILE, scene)
      .then((result) => {
        if (destroyed || !currentScene) return;
        if (result.meshes.length === 0) {
          loadError = true;
          return;
        }
        onModelLoaded(result, scene, config);
      })
      .catch((err) => {
        loadError = true;
        console.error("Station model failed to load:", err);
      });
  },

  render(fft, config) {
    if (!fft) fft = new Uint8Array(256).fill(0);
    t += 0.01;
    const c = (config.templates && config.templates.find(td => td.name === 'station')) ? config.templates.find(td => td.name === 'station').currentConfig : currentTemplateConfig;

    PLANE.render(fft, config);

    if (config.dynamicColors) {
      const hue = (t * 0.05) % 1;
      const pRGB = hslToRgb(hue, 0.8, 0.55);
      const aRGB = hslToRgb((hue + 0.3) % 1, 0.9, 0.6);
      _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
      _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
    } else {
      _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
      _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
    }

    const boost = config.sensitivity ? config.sensitivity.bassBoost : 1.0;
    let bass = 0;
    for (let i = 0; i < 10; i++) bass += fft[i];
    bass = (bass / 10 / 255) * boost;
    bassSmooth += (bass - bassSmooth) * 0.08;
    accentSmooth += (bass - accentSmooth) * 0.18;

    if (loaded && trainRoot) {
      const trainSpeed = c.trainSpeed || 1.0;
      const reactivity = c.bassReactivity || 1.0;

      // Train pulls toward the platform on the beat; drifts back when quiet
      const targetVel = (0.4 + bassSmooth * 2.6) * trainSpeed * reactivity;
      trainVel += (targetVel - trainVel) * 0.05;
      trainBaseZ += trainVel;
      if (trainBaseZ > trainTop) { trainBaseZ = trainTop; trainVel *= 0.8; }
      if (bassSmooth < 0.25 && trainBaseZ > 0) {
        trainBaseZ -= 0.6;
        if (trainBaseZ < 0) trainBaseZ = 0;
      }
      trainRoot.position.z = trainBaseZ;
    }

    if (currentCamera) {
      currentCamera.setTarget(new BABYLON.Vector3(0, 6 + bassSmooth * 4, 0));
      currentCamera.radius += (106 + accentSmooth * 14 - currentCamera.radius) * 0.04;
      currentCamera.beta += (Math.PI / 2.25 + accentSmooth * 0.04 - currentCamera.beta) * 0.03;
    }

    const plane = PLANE.getPlane();
    if (plane) {
      plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    }
  },

  dispose() {
    destroyed = true;
    if (worldRoot) {
      worldRoot.dispose(true, true);
      worldRoot = null;
    }
    trainRoot = null;
    stationRoot = null;
    lightMeshes = [];
    growClosures = [];
    loaded = false;
    currentScene = null;
    currentCamera = null;
  },
};

function onModelLoaded(result, scene, config) {
  const trainMeshes = [];
  const stationMeshes = [];

  for (const mesh of result.meshes) {
    if (!mesh || !mesh.getBoundingInfo) continue;
    const g = groupOf(mesh.name);
    if (TRAIN_GROUPS.has(g)) {
      trainMeshes.push(mesh);
      if (LIGHT_GROUPS.has(g)) lightMeshes.push(mesh);
    } else {
      if (LIGHT_GROUPS.has(g)) lightMeshes.push(mesh);
      // Hide wireframe copy meshes that often come with the .gltf
      if (groupOf(mesh.name) === "JoinedDecals") continue;
      stationMeshes.push(mesh);
    }
  }

  if (!stationMeshes.length && !trainMeshes.length) {
    loadError = true;
    return;
  }

  // Single root, then scale + center so unscaled work is "model units"
  worldRoot = new BABYLON.TransformNode("stationWorldRoot", scene);
  for (const m of trainMeshes) m.setParent(worldRoot);
  for (const m of stationMeshes) m.setParent(worldRoot);

  const extents = computeExtents(trainMeshes.concat(stationMeshes));

  // target horizontal span in world units (visualizer friendly)
  const targetWidth = 280;
  const maxSpan = Math.max(extents.size.x, extents.size.z);
  const scale = maxSpan > 0 ? targetWidth / maxSpan : 1;

  worldRoot.scaling.setAll(scale);
  worldRoot.position.set(
    -extents.center.x * scale,
    -extents.min.y * scale,
    -extents.center.z * scale
  );

  // Train moves on its own root (child of worldRoot) so it can travel in Z
  if (trainMeshes.length) {
    trainRoot = new BABYLON.TransformNode("trainRoot", scene);
    trainRoot.parent = worldRoot;
    for (const m of trainMeshes) m.setParent(trainRoot);
    trainTop = Math.max((extents.size.z * scale) * 1.2, 30);
  } else {
    trainRoot = null;
  }

  const c = currentTemplateConfig;

  // Logo signboard — floats above the track so it never occludes the train
  const logoW = (c.logoScale || 1.0) * 40;
  PLANE.setScale(logoW, logoW * 0.62);
  PLANE.setCoordinates(0, extents.size.y * scale * 1.0 + 8, 0);
  PLANE.init(scene, config);
  const plane = PLANE.getPlane();
  if (plane) {
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    plane.renderingGroupId = 2;
  }

  registerLightPulse(scene);
  buildEffects(scene, scale, config, c);

  loaded = true;
}

function computeExtents(meshes) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const mesh of meshes) {
    mesh.computeWorldMatrix(true);
    const b = mesh.getBoundingInfo().boundingBox;
    const c = b.centerWorld;
    const e = b.extendSizeWorld;
    minX = Math.min(minX, c.x - e.x); maxX = Math.max(maxX, c.x + e.x);
    minY = Math.min(minY, c.y - e.y); maxY = Math.max(maxY, c.y + e.y);
    minZ = Math.min(minZ, c.z - e.z); maxZ = Math.max(maxZ, c.z + e.z);
  }
  if (!isFinite(minX)) return { min: BABYLON.Vector3.Zero(), center: BABYLON.Vector3.Zero(), size: BABYLON.Vector3.One() };
  return {
    min: new BABYLON.Vector3(minX, minY, minZ),
    center: new BABYLON.Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2),
    size: new BABYLON.Vector3(maxX - minX, maxY - minY, maxZ - minZ),
  };
}

function registerLightPulse(scene) {
  for (const mesh of lightMeshes) {
    const mat = mesh.material;
    if (!mat || !mat.emissiveColor) continue;
    scene.registerBeforeRender(() => {
      if (!loaded || destroyed) return;
      const pulse = 0.55 + accentSmooth * 0.45 + (Math.random() * 0.06);
      mat.emissiveColor.set(_accentColor.r * pulse, _accentColor.g * pulse, _accentColor.b * pulse);
    });
  }
}

function buildEffects(scene, scale, config, c) {
  // Track-edge neon strips
  const stripMat = new BABYLON.StandardMaterial("stationStrips", scene);
  stripMat.disableLighting = true;
  stripMat.emissiveColor.copyFrom(_primaryColor);
  const sx = 120, sy = 0.7, sz = 0.6;
  for (let side = -1; side <= 1; side += 2) {
    const strip = BABYLON.MeshBuilder.CreateBox("stationStrip" + side, { width: sx, height: sy, depth: sz }, scene);
    strip.material = stripMat;
    strip.position.set(side * 14, 0.8, 0);
  }
  scene.registerBeforeRender(() => {
    if (!loaded || destroyed) return;
    const k = 0.45 + accentSmooth * 0.55;
    stripMat.emissiveColor.set(_primaryColor.r * k, _primaryColor.g * k, _primaryColor.b * k);
  });
  growClosures.push(stripMat);

  // Bass-reactive glow platform ring ahead of the train
  const ringMat = new BABYLON.StandardMaterial("stationRing", scene);
  ringMat.disableLighting = true;
  ringMat.emissiveColor.copyFrom(_accentColor);
  const ring = BABYLON.MeshBuilder.CreateTorus("stationRing", { diameter: 130, thickness: 2.4, tessellation: 48 }, scene);
  ring.material = ringMat;
  ring.position.set(0, 1.0, 0);
  ring.rotation.x = Math.PI / 2;
  scene.registerBeforeRender(() => {
    if (!loaded || destroyed) return;
    const k = 0.5 + accentSmooth * 0.5;
    ringMat.emissiveColor.set(_accentColor.r * k, _accentColor.g * k, _accentColor.b * k);
    ring.scaling.setAll(1 + accentSmooth * 0.25);
  });
  growClosures.push(ringMat);
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) { r = g = b = l; } else {
    const hue2rgb = (p, q, t2) => {
      if (t2 < 0) t2 += 1; if (t2 > 1) t2 -= 1;
      if (t2 < 1 / 6) return p + (q - p) * 6 * t2;
      if (t2 < 1 / 2) return q;
      if (t2 < 2 / 3) return p + (q - p) * (2 / 3 - t2) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r, g, b };
}

export default template;
import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";
import { ensureGlow } from "./components/glow";

let currentScene;
let currentCamera;
let t = 0;
let currentTemplateConfig = {};

// World Elements
let buildings = [];
let streetLights = [];
let lightStreaks = [];
let crossRoads = [];
let crossCars = [];

// Street Constants (curve repeats every ROAD_LENGTH so the loop wraps seamlessly)
const ROAD_LENGTH = 1000;
const SEGMENT_COUNT = 8; // Total loop depth 8000 units
const TOTAL_DEPTH = ROAD_LENGTH * SEGMENT_COUNT;
const SPEED = 8.0;
const ROAD_WIDTH = 120;
const SIDEWALK_WIDTH = 60;
const CURVE_AMP = 40;
const CROSS_STEP = 2000;
const CROSS_OFFSET = 1000;
const CROSS_RADIUS = 170;

// Pre-allocated Colors
const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();

let poolMat;
let haloMat;
let buildMatA;
let buildMatB;
let cityHemiLt;
let cityDirLt;

function curveX(z) {
    return Math.sin((z % ROAD_LENGTH) / ROAD_LENGTH * Math.PI * 2) * CURVE_AMP;
}

function curveInfo(z) {
    const d = 4;
    const tx = curveX(z + d) - curveX(z - d);
    const tz = 2 * d;
    const len = Math.sqrt(tx * tx + tz * tz);
    return {
        x: curveX(z),
        z: z,
        nx: tz / len,
        nz: -tx / len,
        angle: Math.atan2(tx, tz),
    };
}

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        currentScene = scene;
        currentCamera = camera;
        t = 0;

        const templateData = config.templates.find(td => td.name === 'city');
        currentTemplateConfig = templateData ? templateData.currentConfig : {};
        const c = currentTemplateConfig;

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 15, -100);
            camera.setTarget(new BABYLON.Vector3(0, 8, 0));
            camera.radius = 100;
            camera.alpha = -Math.PI / 2;
            camera.beta = Math.PI / 2.2;
            camera.inertia = 0;
        }

        scene.clearColor = new BABYLON.Color4(0.005, 0, 0.01, 1);
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.0015;
        scene.fogColor = new BABYLON.Color3(0.005, 0, 0.01);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Logo ---
        PLANE.setScale(45, 45);
        PLANE.setCoordinates(0, 10, 0);
        PLANE.init(scene, config);

        // --- Materials ---
        const roadMat = new BABYLON.StandardMaterial("roadMat", scene);
        roadMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        roadMat.emissiveColor = _primaryColor.scale(0.05);
        roadMat.specularColor = _primaryColor.scale(0.8);
        roadMat.specularPower = 32;

        const sideMat = new BABYLON.StandardMaterial("sideMat", scene);
        sideMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        sideMat.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.02);

        const buildTextA = makeWindowTexture(scene, 12, 16);
        buildMatA = new BABYLON.StandardMaterial("buildMatA", scene);
        buildMatA.diffuseColor = new BABYLON.Color3(0.05, 0.06, 0.08);
        buildMatA.emissiveTexture = buildTextA;
        buildMatA.emissiveColor = _accentColor.scale(0.6);
        buildMatA.specularColor = new BABYLON.Color3(0, 0, 0);

        const buildTextB = makeWindowTexture(scene, 9, 20);
        buildMatB = new BABYLON.StandardMaterial("buildMatB", scene);
        buildMatB.diffuseColor = new BABYLON.Color3(0.04, 0.05, 0.07);
        buildMatB.emissiveTexture = buildTextB;
        buildMatB.emissiveColor = _accentColor.scale(0.6);
        buildMatB.specularColor = new BABYLON.Color3(0, 0, 0);

        cityHemiLt = new BABYLON.HemisphericLight("cityHemi", new BABYLON.Vector3(0.2, 1, 0.4), scene);
        cityHemiLt.intensity = 0.75;
        cityDirLt = new BABYLON.DirectionalLight("cityDir", new BABYLON.Vector3(0.5, -1, 0.25), scene);
        cityDirLt.intensity = 0.85;

        const lightMat = new BABYLON.StandardMaterial("lightMat", scene);
        lightMat.emissiveColor = _accentColor;
        lightMat.disableLighting = true;

        // --- Curved Road + Sidewalks (static geometry, props stream over it) ---
        const HALF = ROAD_WIDTH / 2;
        const samples = [];
        for (let z = -ROAD_LENGTH; z <= TOTAL_DEPTH + ROAD_LENGTH; z += 20) samples.push(z);

        const roadL = samples.map(zz => { const p = curveInfo(zz); return new BABYLON.Vector3(p.x + p.nx * HALF, 0, p.z + p.nz * HALF); });
        const roadR = samples.map(zz => { const p = curveInfo(zz); return new BABYLON.Vector3(p.x - p.nx * HALF, 0, p.z - p.nz * HALF); });
        const roadMesh = BABYLON.MeshBuilder.CreateRibbon("roadCurve", { pathArray: [roadL, roadR], sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
        roadMesh.material = roadMat;

        const swLTop = samples.map(zz => { const p = curveInfo(zz); return new BABYLON.Vector3(p.x + p.nx * (HALF + SIDEWALK_WIDTH), 0.02, p.z + p.nz * (HALF + SIDEWALK_WIDTH)); });
        const swLBot = swLTop.map(v => new BABYLON.Vector3(v.x, -0.3, v.z));
        const swRTop = samples.map(zz => { const p = curveInfo(zz); return new BABYLON.Vector3(p.x - p.nx * (HALF + SIDEWALK_WIDTH), 0.02, p.z - p.nz * (HALF + SIDEWALK_WIDTH)); });
        const swRBot = swRTop.map(v => new BABYLON.Vector3(v.x, -0.3, v.z));
        const swL = BABYLON.MeshBuilder.CreateRibbon("swL", { pathArray: [swLBot, swLTop], sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
        swL.material = sideMat;
        const swR = BABYLON.MeshBuilder.CreateRibbon("swR", { pathArray: [swRBot, swRTop], sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
        swR.material = sideMat;

        // --- Intersections (cross streets) + cross traffic ---
        crossRoads = [];
        crossCars = [];
        const crossBase = BABYLON.MeshBuilder.CreateBox("crossR", { width: CROSS_RADIUS * 2, height: 0.6, depth: 60 }, scene);
        crossBase.material = roadMat;
        crossBase.isVisible = false;

        const carBase = BABYLON.MeshBuilder.CreateBox("car", { width: 2.4, height: 1, depth: 4 }, scene);
        carBase.material = lightMat;
        carBase.isVisible = false;

        for (let k = 0; k < TOTAL_DEPTH / CROSS_STEP; k++) {
            const cz = CROSS_OFFSET + k * CROSS_STEP;
            const p = curveInfo(cz);
            const cr = crossBase.createInstance("cr" + k);
            cr.position.set(p.x, -0.29, p.z);
            cr.rotation.y = p.angle;
            crossRoads.push({ mesh: cr, z: cz, nx: p.nx, nz: p.nz, angle: p.angle });

            for (let j = 0; j < 2; j++) {
                const car = carBase.createInstance("car_" + k + "_" + j);
                const carObj = {
                    mesh: car,
                    crossIdx: k,
                    dir: j === 0 ? 1 : -1,
                    xi: (j === 0 ? -1 : 1) * Math.random() * 120,
                    speed: 1.4 + Math.random() * 1.0,
                };
                car.rotation.y = p.angle + Math.PI / 2;
                crossCars.push(carObj);
            }
        }

        // --- Street Elements (Lights & Streaks) ---
        streetLights = [];
        const pole = BABYLON.MeshBuilder.CreateCylinder("pole", { height: 60, diameter: 2 }, scene);
        const head = BABYLON.MeshBuilder.CreateBox("head", { width: 10, height: 2, depth: 4 }, scene);
        head.position.y = 30;
        head.position.x = 5;
        const lightMesh = BABYLON.Mesh.MergeMeshes([pole, head], true);
        lightMesh.material = sideMat;
        lightMesh.isVisible = false;

        const bulb = BABYLON.MeshBuilder.CreateSphere("bulb", { diameter: 8 }, scene);
        bulb.material = lightMat;
        bulb.isVisible = false;

        // --- Street-Light Pools (glow pools cast on the asphalt) ---
        poolMat = new BABYLON.StandardMaterial("poolMat", scene);
        poolMat.emissiveColor = _accentColor.scale(0.55);
        poolMat.disableLighting = true;
        poolMat.alpha = 0.85;
        poolMat.specularColor = new BABYLON.Color3(0, 0, 0);

        haloMat = new BABYLON.StandardMaterial("haloMat", scene);
        haloMat.emissiveColor = _accentColor.scale(0.25);
        haloMat.disableLighting = true;
        haloMat.alpha = 0.6;
        haloMat.specularColor = new BABYLON.Color3(0, 0, 0);

        const poolBase = BABYLON.MeshBuilder.CreateDisc("pool", { radius: 16, tessellation: 24 }, scene);
        poolBase.rotation.x = Math.PI / 2;
        poolBase.material = poolMat;
        poolBase.isVisible = false;

        const haloBase = BABYLON.MeshBuilder.CreateDisc("halo", { radius: 32, tessellation: 24 }, scene);
        haloBase.rotation.x = Math.PI / 2;
        haloBase.material = haloMat;
        haloBase.isVisible = false;

        for (let i = 0; i < 20; i++) {
            const side = i % 2 === 0 ? 1 : -1;
            const z = (i / 20) * TOTAL_DEPTH;
            const m = lightMesh.createInstance("lp" + i);
            m.position.y = 30;
            const b = bulb.createInstance("lb" + i);
            b.position.y = 58;
            const pool = poolBase.createInstance("pool" + i);
            const halo = haloBase.createInstance("halo" + i);

            streetLights.push({
                mesh: m, bulb: b, pool, halo,
                roadZ: z, side,
                poleLat: (ROAD_WIDTH / 2 + 5) * side,
                bulbLat: (ROAD_WIDTH / 2 - 2) * side,
            });
        }

        // --- Buildings (glass towers with lit windows) ---
        const boxA = BABYLON.MeshBuilder.CreateBox("boxA", { size: 1 }, scene);
        boxA.isVisible = false;
        boxA.material = buildMatA;
        boxA.registerInstancedBuffer("color", 4);
        boxA.instancedBuffers.color = new BABYLON.Color4(_primaryColor.r, _primaryColor.g, _primaryColor.b, 1);

        const boxB = BABYLON.MeshBuilder.CreateBox("boxB", { size: 1 }, scene);
        boxB.isVisible = false;
        boxB.material = buildMatB;
        boxB.registerInstancedBuffer("color", 4);
        boxB.instancedBuffers.color = new BABYLON.Color4(_primaryColor.r, _primaryColor.g, _primaryColor.b, 1);

        buildings = [];
        for (let i = 0; i < 100; i++) {
            const b = (i % 2 === 0 ? boxA : boxB).createInstance("b" + i);
            const side = Math.random() > 0.5 ? 1 : -1;
            let lateral;
            if (i % 5 === 0) {
                lateral = (ROAD_WIDTH/2 + SIDEWALK_WIDTH + 260 + Math.random() * 220) * side;
            } else {
                lateral = (ROAD_WIDTH/2 + SIDEWALK_WIDTH + 8 + Math.random() * 140) * side;
            }
            const z = Math.random() * TOTAL_DEPTH;
            const w = 40 + Math.random() * 80;
            const h = (c.height || 200) * (0.5 + Math.random() * 0.5);

            b.instancedBuffers.color = new BABYLON.Color4(_primaryColor.r, _primaryColor.g, _primaryColor.b, 1);
            buildings.push({ mesh: b, roadZ: z, lateral, w, baseH: h, fftIdx: Math.floor(Math.random() * 128) });
        }

        // --- Traffic Light Streaks (moving along the road surface) ---
        const streakBase = BABYLON.MeshBuilder.CreateBox("stk", { width: 2, height: 0.5, depth: 150 }, scene);
        streakBase.material = lightMat;
        streakBase.isVisible = false;

        lightStreaks = [];
        for (let i = 0; i < 15; i++) {
            const s = streakBase.createInstance("stk" + i);
            const lane = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 30);
            const z = Math.random() * TOTAL_DEPTH;
            lightStreaks.push({ mesh: s, roadZ: z, lane, speedMult: 2 + Math.random() * 4 });
        }

        ensureGlow(scene, 1.4);
    },

    render(fft, config) {
        if (!fft || !fft.length) fft = new Uint8Array(256).fill(0);
        t += 0.01;
        PLANE.render(fft, config);

        const boost = config.sensitivity ? config.sensitivity.bassBoost : 1.0;
        let bass = 0;
        for (let i = 0; i < 10; i++) bass += fft[i];
        bass = (bass / 10 / 255) * boost;
        const pBass = Math.pow(bass, 1.5);

        if (config.dynamicColors) {
            const hue = (t * 0.05) % 1;
            const pRGB = hslToRgb(hue, 0.8, 0.5 + bass * 0.2);
            const aRGB = hslToRgb((hue + 0.3) % 1, 0.9, 0.6 + bass * 0.3);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        const frameSpeed = SPEED * (1 + pBass * 4.0);

        const scroll = (value) => {
            let z = value - frameSpeed;
            if (z < -1000) z += TOTAL_DEPTH;
            return z;
        };

        // --- Street lights + pools stream along the curved road ---
        streetLights.forEach(l => {
            l.roadZ = scroll(l.roadZ);
            const p = curveInfo(l.roadZ);

            l.mesh.position.set(p.x + p.nx * l.poleLat, 30, p.z + p.nz * l.poleLat);
            l.mesh.rotation.y = p.angle + (l.side > 0 ? 0 : Math.PI);

            l.bulb.position.set(p.x + p.nx * l.bulbLat, 58, p.z + p.nz * l.bulbLat);
            l.bulb.material.emissiveColor.copyFrom(_accentColor);

            l.pool.position.set(p.x + p.nx * l.bulbLat, 0.08, p.z + p.nz * l.bulbLat);
            l.halo.position.set(p.x + p.nx * l.bulbLat, 0.06, p.z + p.nz * l.bulbLat);
            const poolScale = 1 + pBass * 0.8;
            const haloScale = 1 + pBass * 0.5;
            l.pool.scaling.set(poolScale, poolScale, 1);
            l.halo.scaling.set(haloScale, haloScale, 1);
        });

        if (poolMat) {
            poolMat.emissiveColor.set(_accentColor.r * 0.55, _accentColor.g * 0.55, _accentColor.b * 0.55);
            haloMat.emissiveColor.set(_accentColor.r * 0.25, _accentColor.g * 0.25, _accentColor.b * 0.25);
        }

        const winBright = 0.55 + bass * 1.4;
        if (buildMatA) {
            buildMatA.emissiveColor.set(_accentColor.r * winBright, _accentColor.g * winBright, _accentColor.b * winBright);
            buildMatB.emissiveColor.set(_accentColor.r * winBright, _accentColor.g * winBright, _accentColor.b * winBright);
        }

        // --- Buildings (pulse with music, follow the curve) ---
        buildings.forEach(b => {
            b.roadZ = scroll(b.roadZ);
            const p = curveInfo(b.roadZ);
            const val = (fft[b.fftIdx % fft.length] / 255) * boost;
            const h = b.baseH * (1 + val * 0.4);
            b.mesh.scaling.set(b.w, h, b.w);
            b.mesh.position.set(p.x + p.nx * b.lateral, h / 2, p.z + p.nz * b.lateral);
            b.mesh.rotation.y = p.angle;
            const intensity = 0.3 + val * 0.7;
            b.mesh.instancedBuffers.color.set(_primaryColor.r * intensity, _primaryColor.g * intensity, _primaryColor.b * intensity, 1);
        });

        // --- Traffic light streaks on the road ---
        lightStreaks.forEach(s => {
            s.roadZ -= frameSpeed * s.speedMult;
            if (s.roadZ < -1000) s.roadZ += TOTAL_DEPTH;
            const p = curveInfo(s.roadZ);
            s.mesh.position.set(p.x + p.nx * s.lane, 2, p.z + p.nz * s.lane);
            s.mesh.rotation.y = p.angle;
            s.mesh.material.emissiveColor.copyFrom(_accentColor);
            s.mesh.scaling.z = 1 + pBass * 3;
        });

        // --- Cross traffic: cars accelerate with the bass ---
        const carBoost = 1 + pBass * 3;
        crossCars.forEach(car => {
            car.xi += car.dir * car.speed * carBoost;
            if (car.xi > CROSS_RADIUS) car.xi = -CROSS_RADIUS;
            else if (car.xi < -CROSS_RADIUS) car.xi = CROSS_RADIUS;

            const cross = crossRoads[car.crossIdx];
            const cx = curveX(cross.z);
            car.mesh.position.set(cx + cross.nx * car.xi, 0.8, cross.z + cross.nz * car.xi);
            car.mesh.material.emissiveColor.copyFrom(_accentColor);
        });

        // --- Dynamic Camera ---
        if (currentCamera) {
            currentCamera.position.set(Math.sin(t*0.5) * 5, 15 + pBass * 10, -120);
            currentCamera.setTarget(new BABYLON.Vector3(0, 10 + pBass * 4, 0));
            currentCamera.radius = 120;
            currentCamera.alpha = -Math.PI / 2;
            currentCamera.beta = Math.PI / 2.1;
        }

        const plane = PLANE.getPlane();
        if (plane) plane.position.set(0, 10 + pBass * 4, 0);

        // --- Street Lights tint the logo while passing ---
        let maxProx = 0;
        const planeZ = plane ? plane.position.z : 0;
        for (let i = 0; i < streetLights.length; i++) {
            const dz = Math.abs(planeZ - streetLights[i].mesh.position.z);
            if (dz < 220) {
                const prox = 1 - dz / 220;
                if (prox > maxProx) maxProx = prox;
            }
        }

        if (plane && plane.material) {
            const tint = Math.min(1, maxProx * 0.9 + pBass * 0.3);
            if (tint > 0.02) {
                plane.material.emissiveColor.set(
                    1 + (_accentColor.r - 1) * tint,
                    1 + (_accentColor.g - 1) * tint,
                    1 + (_accentColor.b - 1) * tint
                );
            } else {
                plane.material.emissiveColor.set(1, 1, 1);
            }
        }
    },

    dispose() {
        currentCamera = null;
        currentScene = null;
        buildings = [];
        streetLights = [];
        lightStreaks = [];
        crossRoads = [];
        crossCars = [];
        if (buildMatA) buildMatA.dispose();
        if (buildMatB) buildMatB.dispose();
        if (cityHemiLt) cityHemiLt.dispose();
        if (cityDirLt) cityDirLt.dispose();
        buildMatA = null;
        buildMatB = null;
        cityHemiLt = null;
        cityDirLt = null;
    }
};

function makeWindowTexture(scene, cols, rows) {
    const size = 256;
    const dt = new BABYLON.DynamicTexture("cityWindows", { width: size, height: size }, scene, true, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
    const ctx = dt.getContext();
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
    const cw = size / cols;
    const rh = size / rows;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (Math.random() > 0.15) {
                const m = 4 + Math.floor(Math.random() * 8);
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                ctx.fillRect(x * cw + m, y * rh + m, cw - m * 2, rh - m * 2);
            }
        }
    }
    dt.update();
    return dt;
}

function hslToRgb(h, s, l) {
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
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r, g, b };
}

export default template;
import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let currentScene;
let currentCamera;
let t = 0;

// World Elements
let roadSegments = [];
let sidewalks = [];
let buildings = [];
let streetLights = [];
let lightStreaks = [];

// Recycler Constants
const ROAD_LENGTH = 1000;
const SEGMENT_COUNT = 8; // Total loop depth 8000 units
const SPEED = 8.0;
const ROAD_WIDTH = 120;
const SIDEWALK_WIDTH = 60;

// Pre-allocated Colors
const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        currentScene = scene;
        currentCamera = camera;
        t = 0;
        
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

        const buildMat = new BABYLON.StandardMaterial("buildMat", scene);
        buildMat.emissiveColor = new BABYLON.Color3(1,1,1);
        buildMat.disableLighting = true;

        const lightMat = new BABYLON.StandardMaterial("lightMat", scene);
        lightMat.emissiveColor = _accentColor;
        lightMat.disableLighting = true;

        // --- Road & Sidewalks ---
        const roadBase = BABYLON.MeshBuilder.CreatePlane("road", { width: ROAD_WIDTH, height: ROAD_LENGTH + 2 }, scene);
        roadBase.rotation.x = Math.PI / 2;
        roadBase.material = roadMat;
        roadBase.isVisible = false;

        const sideBase = BABYLON.MeshBuilder.CreateBox("side", { width: SIDEWALK_WIDTH, height: 2, depth: ROAD_LENGTH }, scene);
        sideBase.material = sideMat;
        sideBase.isVisible = false;

        roadSegments = [];
        sidewalks = [];
        for (let i = 0; i < SEGMENT_COUNT; i++) {
            const z = i * ROAD_LENGTH;
            const r = roadBase.createInstance("r" + i);
            r.position.z = z;
            roadSegments.push(r);

            const sL = sideBase.createInstance("sL" + i);
            sL.position.set(-(ROAD_WIDTH/2 + SIDEWALK_WIDTH/2), -1, z);
            sidewalks.push(sL);

            const sR = sideBase.createInstance("sR" + i);
            sR.position.set((ROAD_WIDTH/2 + SIDEWALK_WIDTH/2), -1, z);
            sidewalks.push(sR);
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

        for (let i = 0; i < 20; i++) {
            const side = i % 2 === 0 ? 1 : -1;
            const z = (i / 20) * (ROAD_LENGTH * SEGMENT_COUNT);
            const m = lightMesh.createInstance("lp" + i);
            m.position.set((ROAD_WIDTH/2 + 5) * side, 30, z);
            if (side > 0) m.rotation.y = Math.PI;

            const b = bulb.createInstance("lb" + i);
            b.position.set((ROAD_WIDTH/2 - 2) * side, 58, z);
            
            streetLights.push({ mesh: m, bulb: b, baseZ: z });
        }

        // --- Buildings ---
        const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
        box.isVisible = false;
        box.material = buildMat;
        box.registerInstancedBuffer("color", 4);

        buildings = [];
        for (let i = 0; i < 100; i++) {
            const b = box.createInstance("b" + i);
            const side = Math.random() > 0.5 ? 1 : -1;
            const lateral = (ROAD_WIDTH/2 + SIDEWALK_WIDTH + 20 + Math.random() * 400) * side;
            const z = Math.random() * (ROAD_LENGTH * SEGMENT_COUNT);
            const w = 40 + Math.random() * 80;
            const h = 100 + Math.pow(Math.random(), 2) * 600;
            
            b.position.set(lateral, h/2, z);
            b.scaling.set(w, h, w);
            b.instancedBuffers.color = new BABYLON.Color4(_primaryColor.r, _primaryColor.g, _primaryColor.b, 1);
            
            buildings.push({ mesh: b, baseH: h, fftIdx: Math.floor(Math.random() * 128) });
        }

        // --- Traffic Light Streaks ---
        const streakBase = BABYLON.MeshBuilder.CreateBox("stk", { width: 2, height: 0.5, depth: 150 }, scene);
        streakBase.material = lightMat;
        streakBase.isVisible = false;

        lightStreaks = [];
        for (let i = 0; i < 15; i++) {
            const s = streakBase.createInstance("stk" + i);
            const lane = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 30);
            const z = Math.random() * (ROAD_LENGTH * SEGMENT_COUNT);
            lightStreaks.push({ mesh: s, baseZ: z, lane, speedMult: 2 + Math.random() * 4 });
        }

        if (!scene.glowLayer) {
            new BABYLON.GlowLayer("glow", scene).intensity = 1.4;
        }
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

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        const frameSpeed = SPEED * (1 + pBass * 4.0);
        const totalWorldDepth = ROAD_LENGTH * SEGMENT_COUNT;

        // --- Move Everything ---
        const recycle = (mesh, offset = 0) => {
            mesh.position.z -= frameSpeed;
            if (mesh.position.z < -1000) mesh.position.z += totalWorldDepth;
        };

        roadSegments.forEach(s => recycle(s));
        sidewalks.forEach(s => recycle(s));
        
        streetLights.forEach(l => {
            recycle(l.mesh);
            l.bulb.position.z = l.mesh.position.z;
            l.bulb.material.emissiveColor.copyFrom(_accentColor);
        });

        buildings.forEach(b => {
            recycle(b.mesh);
            const val = (fft[b.fftIdx % fft.length] / 255) * boost;
            const h = b.baseH * (1 + val * 0.4);
            b.mesh.scaling.y = h;
            b.mesh.position.y = h / 2;
            const intensity = 0.3 + val * 0.7;
            b.mesh.instancedBuffers.color.set(_primaryColor.r * intensity, _primaryColor.g * intensity, _primaryColor.b * intensity, 1);
        });

        lightStreaks.forEach(s => {
            s.mesh.position.z -= frameSpeed * s.speedMult;
            if (s.mesh.position.z < -1000) s.mesh.position.z += totalWorldDepth;
            s.mesh.position.x = s.lane;
            s.mesh.position.y = 2;
            s.mesh.material.emissiveColor.copyFrom(_accentColor);
            s.mesh.scaling.z = 1 + pBass * 5;
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
    },

    dispose() {
        currentCamera = null;
        currentScene = null;
        roadSegments = [];
        sidewalks = [];
        buildings = [];
        streetLights = [];
        lightStreaks = [];
    }
};

export default template;

import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let core;
let facets = [];
let outerRings = [];
let currentTemplateConfig = {};

// GC Safety: Pre-allocated objects
const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const _tempColor4 = new BABYLON.Color4(1, 1, 1, 1);

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;
        
        const templateData = config.templates.find(t => t.name === 'flora');
        currentTemplateConfig = templateData ? templateData.currentConfig : {};

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 0, -400);
            camera.setTarget(BABYLON.Vector3.Zero());
        }

        scene.clearColor = new BABYLON.Color4(0.01, 0, 0.02, 1);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Logo ---
        PLANE.setScale(100, 100);
        PLANE.setCoordinates(0, 0, 0);
        PLANE.init(scene, config);

        // --- THE MATH: Fractal Core ---
        core = new BABYLON.TransformNode("fractalCore", scene);
        
        const facetBase = BABYLON.MeshBuilder.CreateBox("f", { size: 1 }, scene);
        const facetMat = new BABYLON.StandardMaterial("fMat", scene);
        facetMat.emissiveColor = new BABYLON.Color3(1,1,1);
        facetMat.disableLighting = true;
        facetBase.material = facetMat;
        facetBase.isVisible = false;

        facets = [];
        const facetCount = 120;
        for (let i = 0; i < facetCount; i++) {
            const f = facetBase.createInstance("facet" + i);
            const phi = Math.acos(-1 + (2 * i) / facetCount);
            const theta = Math.sqrt(facetCount * Math.PI) * phi;
            const x = 120 * Math.cos(theta) * Math.sin(phi);
            const y = 120 * Math.sin(theta) * Math.sin(phi);
            const z = 120 * Math.cos(phi);
            f.position.set(x, y, z);
            f.lookAt(BABYLON.Vector3.Zero());
            f.parent = core;
            facets.push({ mesh: f, basePos: new BABYLON.Vector3(x, y, z) });
        }

        outerRings = [];
        for (let i = 0; i < 4; i++) {
            const ring = BABYLON.MeshBuilder.CreateTorus("r"+i, { diameter: 300 + i*80, thickness: 1, tessellation: 64 }, scene);
            ring.rotation.x = Math.PI / 2;
            const rMat = new BABYLON.StandardMaterial("rm"+i, scene);
            rMat.emissiveColor = _accentColor;
            rMat.disableLighting = true;
            ring.material = rMat;
            outerRings.push(ring);
        }

        if (!scene.glowLayer) new BABYLON.GlowLayer("glow", scene).intensity = 2.0;
    },

    render(fft, config) {
        if (!fft || !fft.length) fft = new Uint8Array(256).fill(0);
        t += 0.015;
        PLANE.render(fft, config);

        const boost = config.sensitivity ? config.sensitivity.bassBoost : 1.0;
        let bass = 0;
        for (let i = 0; i < 12; i++) bass += fft[i];
        bass = (bass / 12 / 255) * boost;
        const pBass = Math.pow(bass, 1.4);

        if (core) {
            core.rotation.y += 0.01;
            core.rotation.z += 0.005;
            
            const col = config.colors;
            const fLen = facets.length;
            // HIGH PERFORMANCE LOOP: No .forEach, no 'new' allocations
            for (let i = 0; i < fLen; i++) {
                const f = facets[i];
                const fftVal = (fft[i % 128] / 255) * boost;
                const push = 1 + fftVal * 2.5 + pBass * 2.0;
                
                f.mesh.position.set(f.basePos.x * push, f.basePos.y * push, f.basePos.z * push);
                f.mesh.scaling.set(10 * push, 10 * push, 2);
                
                const intensity = 0.2 + fftVal * 1.5;
                _tempColor4.set(col.r/255 * intensity, col.g/255 * intensity, col.b/255 * intensity, 1);
                f.mesh.instancedBuffers.color = _tempColor4;
            }
        }

        const rLen = outerRings.length;
        for (let i = 0; i < rLen; i++) {
            const r = outerRings[i];
            r.rotation.y += 0.02 * (i+1);
            r.rotation.x += 0.01 * (i+1);
            r.scaling.setAll(1 + pBass * (i+1) * 0.2);
            r.material.emissiveColor.set(_accentColor.r * (0.5+pBass), _accentColor.g * (0.5+pBass), _accentColor.b * (0.5+pBass));
        }

        if (currentCamera) {
            currentCamera.radius = 400 - pBass * 150;
            currentCamera.beta = Math.PI / 2 + Math.sin(t) * 0.2;
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        facets = [];
        outerRings = [];
    }
};

export default template;

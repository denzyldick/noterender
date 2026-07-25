import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let cageRings = [];
let currentTemplateConfig = {};

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const RING_COUNT = 3;
const BAR_COUNT = 48;

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 0, 0);
            camera.setTarget(new BABYLON.Vector3(0, 0, 100));
            camera.radius = 1;
            camera.alpha = 0;
            camera.beta = 0;
            camera.fov = 1.4;
        }

        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        PLANE.setScale(60, 60);
        PLANE.setCoordinates(0, 0, 200);
        PLANE.init(scene, config);
        const logoPlane = PLANE.getPlane();
        if (logoPlane) logoPlane.renderingGroupId = 2;

        const barMat = new BABYLON.StandardMaterial("cageMat", scene);
        barMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        barMat.disableLighting = true;

        const baseBar = BABYLON.MeshBuilder.CreateBox("barBase", {
            width: 2,
            height: 1,
            depth: 2
        }, scene);
        baseBar.material = barMat;
        baseBar.isVisible = false;

        for (let r = 0; r < RING_COUNT; r++) {
            const radius = 100 + r * 80;
            const bars = [];
            for (let b = 0; b < BAR_COUNT; b++) {
                const angle = (b / BAR_COUNT) * Math.PI * 2;
                const bar = baseBar.createInstance("bar" + r + "_" + b);
                bar.position.set(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius,
                    (r - (RING_COUNT - 1) / 2) * 60
                );
                bar.rotation.z = -angle;
                bars.push({ mesh: bar, angle: angle, radius: radius, index: b });
            }
            cageRings.push({ bars: bars, radius: radius, index: r });
        }
        baseBar.dispose();

        const centerBar = BABYLON.MeshBuilder.CreateBox("centerBar", {
            width: 2,
            height: 2,
            depth: 120
        }, scene);
        const centerMat = new BABYLON.StandardMaterial("centerMat", scene);
        centerMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        centerMat.disableLighting = true;
        centerBar.material = centerMat;
        centerBar.renderingGroupId = 1;

        const glowSphere = BABYLON.MeshBuilder.CreateSphere("glowSphere", {
            diameter: 10,
            segments: 8
        }, scene);
        const sphereMat = new BABYLON.StandardMaterial("sphereMat", scene);
        sphereMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        sphereMat.disableLighting = true;
        glowSphere.material = sphereMat;
        glowSphere.renderingGroupId = 1;

        if (!scene.glowLayer) {
            new BABYLON.GlowLayer("glow", scene).intensity = 1.5;
        }
    },

    render(fft, config) {
        if (!fft || !fft.length) fft = new Uint8Array(256).fill(0);
        t += 0.005;
        PLANE.render(fft, config);

        const boost = config.sensitivity ? config.sensitivity.bassBoost : 1.0;
        let bass = 0;
        for (let i = 0; i < 6; i++) bass += fft[i];
        bass = (bass / 6 / 255) * boost;
        const pBass = Math.pow(bass, 1.5);

        let treble = 0;
        for (let i = fft.length - 20; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20 / 255) * boost;

        if (config.dynamicColors) {
            const hue = (t * 0.03) % 1;
            const pRGB = hslToRgb(hue, 0.8, 0.5 + bass * 0.2);
            const aRGB = hslToRgb((hue + 0.5) % 1, 0.9, 0.6 + treble * 0.2);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        for (let r = 0; r < cageRings.length; r++) {
            const ring = cageRings[r];
            const ringPhase = t * (0.3 + r * 0.1) + pBass * 2;
            for (let b = 0; b < ring.bars.length; b++) {
                const bar = ring.bars[b];
                const fftIdx = (b + r * 10) % fft.length;
                const val = fft[fftIdx] / 255;
                const scale = 1 + val * 40 * (1 + pBass * 2) + treble * 10;
                bar.mesh.scaling.y = scale;

                const x = Math.cos(bar.angle + ringPhase) * (ring.radius + val * 20 * pBass);
                const y = Math.sin(bar.angle + ringPhase) * (ring.radius + val * 20 * pBass);
                const z = bar.mesh.position.z + Math.sin(t * 2 + bar.angle) * pBass * 10;
                bar.mesh.position.set(x, y, z);

                const intensity = 0.3 + val * 1.5 + pBass * 0.5;
                const col = hslToRgb((b / BAR_COUNT + t * 0.02 + r * 0.1) % 1, 0.9, 0.5 + val * 0.5);
                bar.mesh.material.emissiveColor.set(
                    col.r * intensity,
                    col.g * intensity,
                    col.b * intensity
                );
            }
        }

        if (currentCamera) {
            currentCamera.fov = 1.4 + pBass * 0.5 + treble * 0.3;
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        cageRings = [];
    }
};

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

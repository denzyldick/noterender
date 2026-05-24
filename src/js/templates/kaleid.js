import * as BABYLON from "babylonjs";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let spokes = [];
let currentTemplateConfig = {};
let spokeMat;

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const SPOKE_COUNT = 48;
const SEGMENTS = 64;

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;

        const templateData = config.templates.find(td => td.name === 'kaleid');
        currentTemplateConfig = templateData ? templateData.currentConfig : {};

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 0, -250);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.radius = 250;
        }

        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        spokeMat = new BABYLON.StandardMaterial("spokeMat", scene);
        spokeMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        spokeMat.disableLighting = true;

        const bar = BABYLON.MeshBuilder.CreateBox("bar", {
            width: 0.8,
            height: 1,
            depth: 3
        }, scene);
        bar.material = spokeMat;
        bar.isVisible = false;

        spokes = [];
        for (let s = 0; s < SPOKE_COUNT; s++) {
            const angle = (s / SPOKE_COUNT) * Math.PI * 2;
            const group = [];

            for (let seg = 0; seg < SEGMENTS; seg++) {
                const b = bar.createInstance("s" + s + "_" + seg);
                const dist = 10 + seg * 3.5;
                b.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, 0);
                b.scaling.set(1, 1 + seg * 0.15, 1);
                group.push({ mesh: b, dist: dist, seg: seg });
            }
            spokes.push({ bars: group, angle: angle });
        }

        bar.dispose();

        const ringMat = new BABYLON.StandardMaterial("ringMat2", scene);
        ringMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        ringMat.alpha = 0.1;
        ringMat.disableLighting = true;
        const ring = BABYLON.MeshBuilder.CreateTorus("ring2", {
            diameter: 2 * (10 + (SEGMENTS - 1) * 3.5),
            thickness: 1,
            tessellation: 64
        }, scene);
        ring.material = ringMat;

        if (!scene.glowLayer) {
            new BABYLON.GlowLayer("glow", scene).intensity = 0.6;
        }
    },

    render(fft, config) {
        if (!fft || !fft.length) fft = new Uint8Array(256).fill(0);
        t += 0.005;

        const boost = config.sensitivity ? config.sensitivity.bassBoost : 1.0;
        let bass = 0;
        for (let i = 0; i < 6; i++) bass += fft[i];
        bass = (bass / 6 / 255) * boost;
        const pBass = Math.pow(bass, 1.3);

        let treble = 0;
        for (let i = fft.length - 20; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20 / 255) * boost;

        if (config.dynamicColors) {
            const hue = (t * 0.04) % 1;
            const pRGB = hslToRgb(hue, 0.9, 0.5 + bass * 0.3);
            const aRGB = hslToRgb((hue + 0.3) % 1, 0.8, 0.6 + treble * 0.2);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        for (let s = 0; s < spokes.length; s++) {
            const spoke = spokes[s];
            const rotOffset = t * 0.2 * (0.5 + pBass * 2);

            for (let b = 0; b < spoke.bars.length; b++) {
                const bar = spoke.bars[b];
                const angle = spoke.angle + rotOffset;
                const dist = bar.dist;
                bar.mesh.position.x = Math.cos(angle) * dist;
                bar.mesh.position.y = Math.sin(angle) * dist;

                const fftIdx = (s * 4 + b) % fft.length;
                const val = fft[fftIdx] / 255;
                const barHeight = 1 + val * 30 * (1 + pBass * 2);
                bar.mesh.scaling.y = barHeight;

                const intensity = 0.3 + val * 1.5 + pBass * 0.5;
                const hue = (b / SEGMENTS + s / SPOKE_COUNT + t * 0.02) % 1;
                const col = hslToRgb(hue, 0.9, 0.5 + val * 0.5);
                bar.mesh.material.emissiveColor.set(
                    col.r * intensity,
                    col.g * intensity,
                    col.b * intensity
                );
            }
        }

        if (currentCamera) {
            currentCamera.radius = 250 - pBass * 50;
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        spokes = [];
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

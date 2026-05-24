import * as BABYLON from "babylonjs";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let waveLines = [];
let currentTemplateConfig = {};

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const LINE_COUNT = 5;
const POINTS = 128;

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;

        const templateData = config.templates.find(td => td.name === 'wire');
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

        waveLines = [];
        for (let w = 0; w < LINE_COUNT; w++) {
            const mat = new BABYLON.StandardMaterial("waveMat" + w, scene);
            mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
            mat.disableLighting = true;

            const points = [];
            for (let i = 0; i < POINTS; i++) {
                points.push(new BABYLON.Vector3(
                    (i / POINTS - 0.5) * 300,
                    0,
                    (w - (LINE_COUNT - 1) / 2) * 30
                ));
            }

            const line = BABYLON.MeshBuilder.CreateLines("wave" + w, { points: points, updatable: true }, scene);
            line.color = new BABYLON.Color3(1, 1, 1);
            line.material = mat;

            waveLines.push({
                mesh: line,
                index: w,
                points: points,
                yOffset: (w - (LINE_COUNT - 1) / 2) * 20
            });
        }

        const bgMat = new BABYLON.StandardMaterial("bgMat", scene);
        bgMat.emissiveColor = new BABYLON.Color3(0.01, 0.01, 0.02);
        bgMat.disableLighting = true;
        const bg = BABYLON.MeshBuilder.CreatePlane("bg", { width: 400, height: 250 }, scene);
        bg.position.z = 50;
        bg.material = bgMat;

        if (!scene.glowLayer) {
            new BABYLON.GlowLayer("glow", scene).intensity = 0.5;
        }
    },

    render(fft, config) {
        if (!fft || !fft.length) fft = new Uint8Array(256).fill(0);
        t += 0.008;

        const boost = config.sensitivity ? config.sensitivity.bassBoost : 1.0;
        let bass = 0;
        for (let i = 0; i < 6; i++) bass += fft[i];
        bass = (bass / 6 / 255) * boost;
        const pBass = Math.pow(bass, 1.3);

        if (config.dynamicColors) {
            const hue = (t * 0.03) % 1;
            const pRGB = hslToRgb(hue, 0.7, 0.6 + bass * 0.2);
            const aRGB = hslToRgb((hue + 0.4) % 1, 0.8, 0.7);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        for (let w = 0; w < waveLines.length; w++) {
            const wl = waveLines[w];
            const pts = wl.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            if (!pts) continue;

            for (let i = 0; i < POINTS; i++) {
                const idx = i * 3;
                const fftIdx = Math.floor((i / POINTS) * fft.length);
                const val = fft[fftIdx % fft.length] / 255;
                const wave = Math.sin(i * 0.2 + t * (2 + w * 0.5)) * 10 * (1 + pBass * 2);
                const fftAmp = val * 40 * (1 + (LINE_COUNT - w) * 0.2);
                pts[idx + 1] = wave + fftAmp + wl.yOffset;

                const hue = (i / POINTS + t * 0.05 + w * 0.1) % 1;
                const col = hslToRgb(hue, 0.9, 0.5 + val * 0.5);
                const intensity = 0.3 + val * 0.7 + pBass * 0.5;
                wl.mesh.material.emissiveColor.set(
                    col.r * intensity,
                    col.g * intensity,
                    col.b * intensity
                );
            }
            wl.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, pts);
        }

        if (currentCamera) {
            currentCamera.fov = 1.0 + pBass * 0.3;
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        waveLines = [];
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

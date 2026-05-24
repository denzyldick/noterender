import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let mirrorGroup;
let mirrorMat;
let currentTemplateConfig = {};

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const _tempVec3 = new BABYLON.Vector3();
const MIRROR_COUNT = 8;

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;

        const templateData = config.templates.find(td => td.name === 'kaleid');
        currentTemplateConfig = templateData ? templateData.currentConfig : {};
        const c = currentTemplateConfig;

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 0, -300);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.radius = 300;
        }

        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        PLANE.setScale(100, 100);
        PLANE.setCoordinates(0, 0, 0);
        PLANE.init(scene, config);

        mirrorMat = new BABYLON.StandardMaterial("mirrorMat", scene);
        mirrorMat.emissiveColor = _primaryColor.clone();
        mirrorMat.disableLighting = true;

        const segmentSize = 60;
        mirrorGroup = [];

        const baseBar = BABYLON.MeshBuilder.CreateBox("bar", {
            width: segmentSize,
            height: 3,
            depth: 3
        }, scene);
        baseBar.material = mirrorMat;
        baseBar.isVisible = false;

        const baseRing = BABYLON.MeshBuilder.CreateTorus("ringSeg", {
            diameter: 50,
            thickness: 1.5,
            tessellation: 16
        }, scene);
        baseRing.material = mirrorMat;
        baseRing.isVisible = false;

        const angleStep = (Math.PI * 2) / MIRROR_COUNT;
        for (let m = 0; m < MIRROR_COUNT; m++) {
            const group = new BABYLON.TransformNode("mirror" + m, scene);
            const rot = m * angleStep;

            for (let i = 0; i < 8; i++) {
                const bar = baseBar.createInstance("mBar" + m + "_" + i);
                const dist = 60 + i * 35;
                bar.position.set(dist, (i - 4) * 20, 0);
                bar.scaling.set(1, 1 + Math.sin(i * 1.5) * 0.5, 1);
                bar.parent = group;
            }

            for (let i = 0; i < 4; i++) {
                const ring = baseRing.createInstance("mRing" + m + "_" + i);
                const dist = 80 + i * 60;
                ring.position.set(dist, 0, 0);
                ring.scaling.setAll(1 + i * 0.2);
                ring.parent = group;
            }

            group.rotation.y = rot;
            mirrorGroup.push(group);
        }

        baseBar.dispose();
        baseRing.dispose();

        if (!scene.glowLayer) {
            new BABYLON.GlowLayer("glow", scene).intensity = 2.0;
        }
    },

    render(fft, config) {
        if (!fft || !fft.length) fft = new Uint8Array(256).fill(0);
        t += 0.01;
        PLANE.render(fft, config);

        const boost = config.sensitivity ? config.sensitivity.bassBoost : 1.0;
        let bass = 0;
        for (let i = 0; i < 8; i++) bass += fft[i];
        bass = (bass / 8 / 255) * boost;
        const pBass = Math.pow(bass, 1.5);

        let treble = 0;
        for (let i = fft.length - 25; i < fft.length; i++) treble += fft[i];
        treble = (treble / 25 / 255) * boost;

        if (config.dynamicColors) {
            const hue = (t * 0.04) % 1;
            const pRGB = hslToRgb(hue, 0.8, 0.5 + bass * 0.2);
            const aRGB = hslToRgb((hue + 0.3) % 1, 0.9, 0.6 + treble * 0.2);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (mirrorGroup) {
            const angleStep = (Math.PI * 2) / MIRROR_COUNT;
            for (let m = 0; m < mirrorGroup.length; m++) {
                const group = mirrorGroup[m];
                group.rotation.y += 0.002 * (1 + pBass * 3) * (1 + m * 0.05);
                group.position.y = Math.sin(t * 0.5 + m * 0.5) * pBass * 20;

                const children = group.getChildMeshes();
                for (let c = 0; c < children.length; c++) {
                    const child = children[c];
                    const fftIdx = (m * 16 + c) % fft.length;
                    const val = fft[fftIdx] / 255;
                    const intensity = 0.3 + val * 1.5 + pBass * 0.5;
                    child.material.emissiveColor.set(
                        _primaryColor.r * intensity,
                        _primaryColor.g * intensity * (0.5 + val * 0.5),
                        _primaryColor.b * intensity * (0.3 + val * 0.7)
                    );
                    const s = 1 + val * 2 + pBass;
                    if (child.name.includes("Bar")) {
                        child.scaling.x = s;
                    }
                }
            }
        }

        if (currentCamera) {
            currentCamera.radius = 300 - pBass * 80;
            currentCamera.alpha += 0.003 * (1 + pBass * 2);
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        mirrorGroup = [];
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

import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let curtains = [];
let starField;
let currentTemplateConfig = {};

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const CURTAIN_COUNT = 7;
const CURTAIN_SEGMENTS = 64;

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, -50, -350);
            camera.setTarget(new BABYLON.Vector3(0, 100, 0));
            camera.radius = 350;
            camera.beta = Math.PI / 4;
            camera.fov = 1.0;
        }

        scene.clearColor = new BABYLON.Color4(0, 0, 0.02, 1);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        PLANE.setScale(100, 100);
        PLANE.setCoordinates(0, 0, 250);
        PLANE.init(scene, config);
        const logoPlane = PLANE.getPlane();
        if (logoPlane) logoPlane.renderingGroupId = 1;

        const starBox = BABYLON.MeshBuilder.CreateBox("s", { size: 1 }, scene);
        starField = new BABYLON.SolidParticleSystem("stars", scene);
        starField.addShape(starBox, 400);
        starBox.dispose();
        const starMesh = starField.buildMesh();
        starMesh.material = new BABYLON.StandardMaterial("starMat", scene);
        starMesh.material.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.5);
        starMesh.material.disableLighting = true;
        starField.initParticles = () => {
            for (let p = 0; p < starField.nbParticles; p++) {
                const part = starField.particles[p];
                part.position.set(
                    (Math.random() - 0.5) * 2000,
                    (Math.random() - 0.5) * 1000 + 200,
                    (Math.random() - 0.5) * 2000 - 500
                );
                part.scaling.setAll(1 + Math.random() * 3);
                part.color = new BABYLON.Color4(0.3, 0.3, 0.5, 0.6);
            }
        };
        starField.initParticles();
        starField.setParticles();

        for (let c = 0; c < CURTAIN_COUNT; c++) {
            const mat = new BABYLON.StandardMaterial("curtainMat" + c, scene);
            mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
            mat.disableLighting = true;
            mat.alpha = 0.3 + c * 0.05;

            const ribbonPath = [];
            for (let i = 0; i < CURTAIN_SEGMENTS; i++) {
                const x = (i / CURTAIN_SEGMENTS - 0.5) * 1200;
                const y = 300 - (i / CURTAIN_SEGMENTS) * 400;
                const z = (c - (CURTAIN_COUNT - 1) / 2) * 80;
                ribbonPath.push(new BABYLON.Vector3(x, y, z));
            }

            const curtain = BABYLON.MeshBuilder.CreateLines("curtain" + c, {
                points: ribbonPath,
                updatable: true
            }, scene);
            curtain.color = new BABYLON.Color3(0.3, 0.8, 0.6);
            curtain.material = mat;
            curtains.push({
                mesh: curtain,
                index: c,
                basePath: ribbonPath,
                phase: Math.random() * Math.PI * 2
            });
        }

        if (!scene.glowLayer) {
            new BABYLON.GlowLayer("glow", scene).intensity = 0.6;
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
            const hue = (t * 0.02) % 1;
            const pRGB = hslToRgb(hue, 0.7, 0.5 + bass * 0.3);
            const aRGB = hslToRgb((hue + 0.5) % 1, 0.8, 0.6 + treble * 0.2);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        for (let c = 0; c < curtains.length; c++) {
            const cur = curtains[c];
            const pts = cur.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            if (!pts) continue;

            const speed = 1 + pBass * 3 + treble * 2;
            for (let i = 0; i < CURTAIN_SEGMENTS; i++) {
                const idx = i * 3;
                const fftIdx = (i * 4 + c * 10) % fft.length;
                const val = fft[fftIdx] / 255;
                const wave1 = Math.sin(i * 0.1 + t * speed + cur.phase) * 60 * (1 + pBass * 2);
                const wave2 = Math.sin(i * 0.05 + t * speed * 0.5) * 30 * val;
                pts[idx + 1] = cur.basePath[i].y + wave1 + wave2;
                pts[idx] = cur.basePath[i].x + Math.sin(i * 0.08 + t * speed * 0.7 + cur.phase) * 40 * val;
            }
            cur.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, pts);

            const hue = (c / CURTAIN_COUNT + t * 0.02) % 1;
            const col = hslToRgb(hue, 0.8, 0.5 + pBass * 0.3);
            const intensity = 0.3 + pBass * 0.7 + treble * 0.5;
            cur.mesh.material.emissiveColor.set(
                col.r * intensity,
                col.g * intensity,
                col.b * intensity
            );
            cur.mesh.material.alpha = 0.2 + pBass * 0.3 + treble * 0.2;
        }

        if (currentCamera) {
            currentCamera.fov = 1.0 + pBass * 0.2;
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        curtains = [];
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

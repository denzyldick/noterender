import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let plasmaMesh;
let plasmaPositions;
let currentTemplateConfig = {};

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const GRID = 64;

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;

        const templateData = config.templates.find(td => td.name === 'flux');
        currentTemplateConfig = templateData ? templateData.currentConfig : {};

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 0, -200);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.radius = 200;
        }

        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        PLANE.setScale(120, 120);
        PLANE.setCoordinates(0, 0, 0);
        PLANE.init(scene, config);

        const mat = new BABYLON.StandardMaterial("plasmaMat", scene);
        mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        mat.disableLighting = true;

        plasmaMesh = BABYLON.MeshBuilder.CreateGround("plasma", {
            width: 300,
            height: 300,
            subdivisions: GRID,
            updatable: true
        }, scene);
        plasmaMesh.material = mat;
        plasmaPositions = plasmaMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);

        const colors = [];
        const totalVerts = (GRID + 1) * (GRID + 1);
        for (let i = 0; i < totalVerts; i++) {
            colors.push(1, 0, 0, 1);
        }
        plasmaMesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);

        const fogMat = new BABYLON.StandardMaterial("fogMat", scene);
        fogMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
        fogMat.alpha = 0.3;
        const fogPlane = BABYLON.MeshBuilder.CreatePlane("fog", {
            width: 400,
            height: 400
        }, scene);
        fogPlane.position.z = 50;
        fogPlane.material = fogMat;

        if (!scene.glowLayer) {
            new BABYLON.GlowLayer("glow", scene).intensity = 0.6;
        }
    },

    render(fft, config) {
        if (!fft || !fft.length) fft = new Uint8Array(256).fill(0);
        t += 0.01;
        PLANE.render(fft, config);

        const boost = config.sensitivity ? config.sensitivity.bassBoost : 1.0;
        let bass = 0;
        for (let i = 0; i < 6; i++) bass += fft[i];
        bass = (bass / 6 / 255) * boost;
        const pBass = Math.pow(bass, 1.4);

        if (config.dynamicColors) {
            const hue = (t * 0.05) % 1;
            const pRGB = hslToRgb(hue, 0.8, 0.5 + bass * 0.3);
            const aRGB = hslToRgb((hue + 0.5) % 1, 0.9, 0.6);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (plasmaMesh && plasmaPositions) {
            const positions = plasmaMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            const colors = plasmaMesh.getVerticesData(BABYLON.VertexBuffer.ColorKind);
            if (positions && colors) {
                const cols = GRID + 1;
                const halfSize = 150;
                for (let i = 0; i <= GRID; i++) {
                    for (let j = 0; j <= GRID; j++) {
                        const idx = (i * cols + j) * 3;
                        const cIdx = (i * cols + j) * 4;
                        const nx = (j / GRID - 0.5) * 2;
                        const ny = (i / GRID - 0.5) * 2;

                        const dist = Math.sqrt(nx * nx + ny * ny);
                        const wave = Math.sin(dist * 8 - t * 3 + pBass * 4) * 0.5 +
                                    Math.sin(nx * 6 + t * 2) * 0.3 +
                                    Math.sin(ny * 6 + t * 2.5) * 0.3;

                        positions[idx + 1] = wave * 20 * (1 + pBass * 2);

                        const r = 0.5 + 0.5 * Math.sin(dist * 10 - t * 2 + pBass * 3);
                        const g = 0.5 + 0.5 * Math.sin(nx * 8 + ny * 6 + t * 3 + bass * 5);
                        const b = 0.5 + 0.5 * Math.sin(ny * 8 - t * 1.5 + pBass * 2);

                        colors[cIdx] = _primaryColor.r * (0.3 + r * 0.7);
                        colors[cIdx + 1] = _accentColor.g * (0.3 + g * 0.7);
                        colors[cIdx + 2] = _primaryColor.b * (0.3 + b * 0.7);
                        colors[cIdx + 3] = 0.6 + dist * 0.4;
                    }
                }
                plasmaMesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
                plasmaMesh.updateVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
                plasmaMesh.refreshBoundingInfo();
            }
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        plasmaPositions = null;
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

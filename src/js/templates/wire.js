import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let ribbon;
let ribbonMat;
let ribbonPositions;
let currentTemplateConfig = {};

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const _tempVec3 = new BABYLON.Vector3();
const RIBBON_POINTS = 128;
const RIBBON_WIDTH = 80;

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
            camera.position.set(0, 0, -200);
            camera.setTarget(new BABYLON.Vector3(0, 0, 100));
            camera.radius = 200;
            camera.alpha = -Math.PI / 2;
            camera.beta = Math.PI / 2.8;
        }

        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.003;
        scene.fogColor = new BABYLON.Color3(0, 0, 0.02);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        PLANE.setScale(60, 60);
        PLANE.setCoordinates(0, -30, 100);
        PLANE.init(scene, config);
        const plane = PLANE.getPlane();
        if (plane) plane.renderingGroupId = 1;

        ribbonMat = new BABYLON.StandardMaterial("ribbonMat", scene);
        ribbonMat.emissiveColor = _primaryColor.clone();
        ribbonMat.disableLighting = true;

        const path = [];
        for (let i = 0; i < RIBBON_POINTS; i++) {
            path.push(new BABYLON.Vector3(0, 0, i * 4));
        }

        const ribbonShape = [
            new BABYLON.Vector3(-RIBBON_WIDTH / 2, 0, 0),
            new BABYLON.Vector3(RIBBON_WIDTH / 2, 0, 0)
        ];

        ribbon = BABYLON.MeshBuilder.CreateRibbon("ribbon", {
            pathArray: [path],
            sideOrientation: BABYLON.Mesh.DOUBLESIDE,
            updatable: true
        }, scene);
        ribbon.material = ribbonMat;

        const positions = ribbon.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        ribbonPositions = positions ? positions.slice() : [];

        const starBox = BABYLON.MeshBuilder.CreateBox("s", { size: 1 }, scene);
        const stars = new BABYLON.SolidParticleSystem("stars", scene);
        stars.addShape(starBox, 300);
        starBox.dispose();
        const starMesh = stars.buildMesh();
        starMesh.material = new BABYLON.StandardMaterial("starMat", scene);
        starMesh.material.emissiveColor = _accentColor.clone();
        starMesh.material.disableLighting = true;
        stars.initParticles = () => {
            for (let p = 0; p < stars.nbParticles; p++) {
                const part = stars.particles[p];
                part.position.set(
                    (Math.random() - 0.5) * 1000,
                    (Math.random() - 0.5) * 500,
                    200 + Math.random() * 600
                );
                part.scaling.setAll(1 + Math.random() * 3);
                part.color = new BABYLON.Color4(0.3, 0.3, 0.5, 0.6);
            }
        };
        stars.initParticles();
        stars.setParticles();

        if (!scene.glowLayer) {
            new BABYLON.GlowLayer("glow", scene).intensity = 1.2;
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
        const pBass = Math.pow(bass, 1.3);

        let treble = 0;
        for (let i = fft.length - 20; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20 / 255) * boost;

        if (config.dynamicColors) {
            const hue = (t * 0.04) % 1;
            const pRGB = hslToRgb(hue, 0.5, 0.6 + bass * 0.2);
            const aRGB = hslToRgb((hue + 0.5) % 1, 0.6, 0.7 + treble * 0.2);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (ribbon && ribbonPositions) {
            const positions = ribbon.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            if (positions) {
                for (let i = 0; i < RIBBON_POINTS; i++) {
                    const idx = i * 6;
                    const fftIdx = Math.floor((i / RIBBON_POINTS) * fft.length);
                    const val = fft[fftIdx % fft.length] / 255;
                    const bassInfluence = pBass * (1 - i / RIBBON_POINTS);
                    const y = val * 60 + bassInfluence * 30 + Math.sin(i * 0.3 + t * 2) * 5;

                    if (idx + 1 < positions.length) {
                        positions[idx + 1] = y;
                    }
                    if (idx + 4 < positions.length) {
                        positions[idx + 4] = y;
                    }

                    const zPos = positions[idx + 2];
                    const zWidth = RIBBON_WIDTH / 2 * (1 + val * 1.5 + pBass * 2);
                    if (idx < positions.length) {
                        positions[idx] = -zWidth;
                    }
                    if (idx + 3 < positions.length) {
                        positions[idx + 3] = zWidth;
                    }
                }
                ribbon.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
                ribbon.refreshBoundingInfo();
            }

            ribbonMat.emissiveColor.set(
                _primaryColor.r * (0.5 + pBass * 2),
                _primaryColor.g * (0.5 + pBass * 2),
                _primaryColor.b * (0.5 + pBass * 2)
            );
        }

        if (currentCamera) {
            _tempVec3.set(0, 0, -200 + pBass * 40);
            currentCamera.setPosition(_tempVec3);
            currentCamera.fov = 0.8 + treble * 0.3;
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        ribbonPositions = [];
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

import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let gridMesh;
let gridMat;
let ripples = [];
let currentTemplateConfig = {};

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const GRID_SIZE = 50;

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;
        ripples = [];

        const templateData = config.templates.find(td => td.name === 'static');
        currentTemplateConfig = templateData ? templateData.currentConfig : {};

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 100, -200);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.radius = 250;
            camera.beta = Math.PI / 3;
        }

        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        PLANE.setScale(100, 100);
        PLANE.setCoordinates(0, 0, 80);
        PLANE.init(scene, config);
        const plane = PLANE.getPlane();
        if (plane) plane.renderingGroupId = 1;

        gridMat = new BABYLON.StandardMaterial("gridMat", scene);
        gridMat.wireframe = true;
        gridMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        gridMat.disableLighting = true;
        gridMat.alpha = 0.6;

        gridMesh = BABYLON.MeshBuilder.CreateGround("grid", {
            width: 300,
            height: 300,
            subdivisions: GRID_SIZE,
            updatable: true
        }, scene);
        gridMesh.material = gridMat;

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
        const pBass = Math.pow(bass, 1.5);

        let treble = 0;
        for (let i = fft.length - 20; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20 / 255) * boost;

        if (bass > 0.5) {
            ripples.push({
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200,
                radius: 5,
                speed: 2 + pBass * 3,
                life: 1.0
            });
        }

        if (config.dynamicColors) {
            const hue = (t * 0.04) % 1;
            const pRGB = hslToRgb(hue, 0.8, 0.5 + bass * 0.3);
            const aRGB = hslToRgb((hue + 0.4) % 1, 0.9, 0.6 + treble * 0.2);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (gridMesh) {
            const positions = gridMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            if (positions) {
                const cols = GRID_SIZE + 1;
                const halfSize = 150;
                for (let i = 0; i <= GRID_SIZE; i++) {
                    for (let j = 0; j <= GRID_SIZE; j++) {
                        const idx = (i * cols + j) * 3;
                        const x = positions[idx];
                        const z = positions[idx + 2];
                        let y = 0;

                        for (let r = 0; r < ripples.length; r++) {
                            const rip = ripples[r];
                            const dx = x - rip.x;
                            const dz = z - rip.y;
                            const dist = Math.sqrt(dx * dx + dz * dz);
                            const wave = Math.sin(dist * 0.05 - rip.radius * 0.1) * rip.life;
                            y += Math.max(0, wave * 8 * (1 - dist / rip.radius));
                        }

                        y += Math.sin(x * 0.05 + t * 2) * pBass * 3;
                        y += Math.sin(z * 0.05 + t * 1.5) * pBass * 2;
                        positions[idx + 1] = y;
                    }
                }
                gridMesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
                gridMesh.refreshBoundingInfo();
            }

            gridMat.emissiveColor.set(
                _primaryColor.r * (0.3 + pBass),
                _primaryColor.g * (0.3 + pBass),
                _primaryColor.b * (0.3 + pBass)
            );
            gridMat.alpha = 0.3 + pBass * 0.5;
        }

        for (let r = ripples.length - 1; r >= 0; r--) {
            ripples[r].radius += ripples[r].speed * (1 + pBass);
            ripples[r].life -= 0.01;
            if (ripples[r].life <= 0 || ripples[r].radius > 400) {
                ripples.splice(r, 1);
            }
        }

        if (currentCamera) {
            currentCamera.radius = 250 - pBass * 60;
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        ripples = [];
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

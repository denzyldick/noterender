import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let noiseSPS;
let scanlines;
let chromaticPP;
let glitchIntensity = 0;
let currentTemplateConfig = {};

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const _tempVec3 = new BABYLON.Vector3();

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;
        glitchIntensity = 0;

        const templateData = config.templates.find(td => td.name === 'static');
        currentTemplateConfig = templateData ? templateData.currentConfig : {};

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 0, -200);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.radius = 200;
        }

        scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.02, 1);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        PLANE.setScale(120, 120);
        PLANE.setCoordinates(0, 0, 0);
        PLANE.init(scene, config);

        const box = BABYLON.MeshBuilder.CreateBox("n", { size: 2 }, scene);
        noiseSPS = new BABYLON.SolidParticleSystem("noise", scene, { updatable: true });
        noiseSPS.addShape(box, 800);
        box.dispose();
        const noiseMesh = noiseSPS.buildMesh();
        noiseMesh.material = new BABYLON.StandardMaterial("noiseMat", scene);
        noiseMesh.material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        noiseMesh.material.disableLighting = true;
        noiseMesh.renderingGroupId = 2;

        noiseSPS.initParticles = () => {
            for (let p = 0; p < noiseSPS.nbParticles; p++) {
                const part = noiseSPS.particles[p];
                part.position.set(
                    (Math.random() - 0.5) * 400,
                    (Math.random() - 0.5) * 400,
                    (Math.random() - 0.5) * 100 - 50
                );
                part.scaling.setAll(2 + Math.random() * 6);
                part.color = new BABYLON.Color4(0.3, 0.3, 0.3, 0.15);
            }
        };
        noiseSPS.initParticles();
        noiseSPS.setParticles();

        const scanMat = new BABYLON.StandardMaterial("scanMat", scene);
        scanMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
        scanMat.alpha = 0.08;
        scanMat.disableLighting = true;
        scanlines = BABYLON.MeshBuilder.CreatePlane("scanlines", {
            width: 400,
            height: 400,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE,
            updatable: true
        }, scene);
        scanlines.position.z = -50;
        scanlines.material = scanMat;
        scanlines.renderingGroupId = 2;

        const centerGlow = BABYLON.MeshBuilder.CreateSphere("glowSphere", {
            diameter: 60,
            segments: 16
        }, scene);
        const glowMat = new BABYLON.StandardMaterial("glowMat", scene);
        glowMat.emissiveColor = _accentColor.scale(0.1);
        glowMat.disableLighting = true;
        centerGlow.material = glowMat;

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
        for (let i = 0; i < 8; i++) bass += fft[i];
        bass = (bass / 8 / 255) * boost;
        const pBass = Math.pow(bass, 1.6);

        let treble = 0;
        for (let i = fft.length - 20; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20 / 255) * boost;

        if (config.dynamicColors) {
            const hue = (t * 0.05) % 1;
            const pRGB = hslToRgb(hue, 0.1, 0.3 + bass * 0.4);
            const aRGB = hslToRgb((hue + 0.5) % 1, 0.3, 0.4 + treble * 0.5);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        glitchIntensity = pBass > 0.5 ? pBass : Math.max(0, glitchIntensity - 0.02);

        if (noiseSPS) {
            for (let p = 0; p < noiseSPS.nbParticles; p++) {
                const part = noiseSPS.particles[p];
                if (Math.random() > 0.95 + glitchIntensity * 0.05) {
                    part.position.x += (Math.random() - 0.5) * 20 * (1 + glitchIntensity * 3);
                }
                const alpha = 0.1 + glitchIntensity * 0.5 + treble * 0.3;
                part.color.set(
                    _accentColor.r * (0.3 + glitchIntensity),
                    _accentColor.g * (0.3 + glitchIntensity),
                    _accentColor.b * (0.3 + glitchIntensity),
                    Math.min(0.6, alpha)
                );
            }
            noiseSPS.setParticles();
        }

        if (currentCamera) {
            if (glitchIntensity > 0.3 && Math.random() > 0.7) {
                _tempVec3.set(
                    (Math.random() - 0.5) * glitchIntensity * 20,
                    (Math.random() - 0.5) * glitchIntensity * 10,
                    -200 + Math.random() * glitchIntensity * 30
                );
                currentCamera.setPosition(_tempVec3);
            }
            currentCamera.fov = 0.9 + treble * 0.3 + glitchIntensity * 0.2;
        }

        if (scanlines) {
            const scanMat = scanlines.material;
            scanMat.emissiveColor.set(
                _primaryColor.r * (0.05 + pBass * 0.1),
                _primaryColor.g * (0.05 + pBass * 0.1),
                _primaryColor.b * (0.05 + pBass * 0.1)
            );
            scanMat.alpha = 0.05 + glitchIntensity * 0.2;
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
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

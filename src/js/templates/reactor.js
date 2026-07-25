import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let mainTorus;
let beams = [];
let shockwaveRings = [];
let centerGlow;
let currentTemplateConfig = {};

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const BEAM_COUNT = 16;

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 0, -450);
            camera.setTarget(new BABYLON.Vector3(0, 0, 0));
            camera.radius = 450;
            camera.beta = Math.PI / 3;
        }

        scene.clearColor = new BABYLON.Color4(0.01, 0, 0.01, 1);
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.0005;
        scene.fogColor = new BABYLON.Color3(0.01, 0, 0.02);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        PLANE.setScale(100, 100);
        PLANE.setCoordinates(0, -200, 300);
        PLANE.init(scene, config);
        const logoPlane = PLANE.getPlane();
        if (logoPlane) logoPlane.renderingGroupId = 2;

        mainTorus = BABYLON.MeshBuilder.CreateTorus("mainTorus", {
            diameter: 100,
            thickness: 4,
            tessellation: 48
        }, scene);
        const torusMat = new BABYLON.StandardMaterial("torusMat", scene);
        torusMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        torusMat.disableLighting = true;
        mainTorus.material = torusMat;

        const innerTorus = BABYLON.MeshBuilder.CreateTorus("innerTorus", {
            diameter: 40,
            thickness: 2,
            tessellation: 32
        }, scene);
        const innerMat = new BABYLON.StandardMaterial("innerMat", scene);
        innerMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        innerMat.disableLighting = true;
        innerTorus.material = innerMat;

        centerGlow = BABYLON.MeshBuilder.CreateSphere("centerGlow", {
            diameter: 20,
            segments: 16
        }, scene);
        const glowMat = new BABYLON.StandardMaterial("glowMat", scene);
        glowMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        glowMat.disableLighting = true;
        centerGlow.material = glowMat;

        const beamMat = new BABYLON.StandardMaterial("beamMat", scene);
        beamMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        beamMat.disableLighting = true;
        beamMat.alpha = 0.6;

        for (let i = 0; i < BEAM_COUNT; i++) {
            const angle = (i / BEAM_COUNT) * Math.PI * 2;
            const beam = BABYLON.MeshBuilder.CreateBox("beam" + i, {
                width: 1.5,
                height: 0.5,
                depth: 60
            }, scene);
            beam.position.set(
                Math.cos(angle) * 50,
                Math.sin(angle) * 50,
                0
            );
            beam.rotation.z = -angle;
            beam.material = beamMat;
            beams.push({ mesh: beam, angle: angle });
        }

        const ringMat = new BABYLON.StandardMaterial("ringMat", scene);
        ringMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        ringMat.disableLighting = true;

        for (let i = 0; i < 3; i++) {
            const ring = BABYLON.MeshBuilder.CreateTorus("shock" + i, {
                diameter: 0.5,
                thickness: 0.3,
                tessellation: 32
            }, scene);
            ring.material = ringMat;
            ring.isVisible = false;
            shockwaveRings.push({
                mesh: ring,
                active: false,
                progress: 0
            });
        }

        if (!scene.glowLayer) {
            new BABYLON.GlowLayer("glow", scene).intensity = 2.0;
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
            const pRGB = hslToRgb(hue, 0.8, 0.4 + bass * 0.3);
            const aRGB = hslToRgb((hue + 0.3) % 1, 0.9, 0.6 + treble * 0.3);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        const pulse = 1 + Math.sin(t * 4) * 0.05 * (1 + pBass * 3);
        mainTorus.scaling.setAll(pulse);
        mainTorus.rotation.x += 0.003 * (1 + pBass * 2);
        mainTorus.rotation.y += 0.005 * (1 + pBass * 2 + treble);

        const torusIntensity = 0.5 + pBass * 1.5 + treble * 0.5;
        mainTorus.material.emissiveColor.set(
            _primaryColor.r * torusIntensity,
            _primaryColor.g * torusIntensity,
            _primaryColor.b * torusIntensity
        );

        centerGlow.scaling.setAll(1 + pBass * 0.5);
        centerGlow.material.emissiveColor.set(
            _accentColor.r * (1 + pBass),
            _accentColor.g * (1 + pBass),
            _accentColor.b * (1 + pBass)
        );

        for (let i = 0; i < beams.length; i++) {
            const b = beams[i];
            const angle = b.angle + t * 0.2;
            const dist = 50 + fft[(i * 5) % fft.length] / 255 * 40 * (1 + pBass * 2);
            b.mesh.position.set(
                Math.cos(angle) * dist,
                Math.sin(angle) * dist,
                0
            );
            b.mesh.rotation.z = -angle;
            const beamIntensity = 0.3 + fft[(i * 5) % fft.length] / 255 * 1.5 + pBass * 0.5;
            b.mesh.material.emissiveColor.set(
                _accentColor.r * beamIntensity,
                _accentColor.g * beamIntensity * 0.6,
                _accentColor.b * beamIntensity
            );
        }

        if (pBass > 0.3 && !shockwaveRings.some(r => r.active)) {
            for (const ring of shockwaveRings) {
                if (!ring.active) {
                    ring.active = true;
                    ring.progress = 0;
                    ring.mesh.isVisible = true;
                    ring.mesh.position.set(0, 0, 0);
                    break;
                }
            }
        }

        for (const ring of shockwaveRings) {
            if (ring.active) {
                ring.progress += 0.01 * (1 + pBass * 2);
                const scale = ring.progress * 8;
                ring.mesh.scaling.set(scale, scale, scale);
                ring.mesh.material.emissiveColor.set(
                    _accentColor.r * (1 - ring.progress) * 2,
                    _accentColor.g * (1 - ring.progress) * 2,
                    _accentColor.b * (1 - ring.progress) * 2
                );
                ring.mesh.material.alpha = Math.max(0, 1 - ring.progress);
                if (ring.progress >= 1) {
                    ring.active = false;
                    ring.mesh.isVisible = false;
                }
            }
        }

        if (currentCamera) {
            currentCamera.radius = 450 - pBass * 50;
            currentCamera.alpha += 0.002 * (1 + pBass);
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        beams = [];
        shockwaveRings = [];
        mainTorus = null;
        centerGlow = null;
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

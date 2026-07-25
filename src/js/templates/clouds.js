import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let cloudPuffs = [];
let currentTemplateConfig = {};

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const PUFF_COUNT = 600;

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 0, -300);
            camera.setTarget(new BABYLON.Vector3(0, 40, 0));
            camera.radius = 300;
            camera.beta = Math.PI / 3;
            camera.fov = 1.2;
        }

        scene.clearColor = new BABYLON.Color4(0.03, 0.03, 0.06, 1);
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.0025;
        scene.fogColor = new BABYLON.Color3(0.03, 0.03, 0.06);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        PLANE.setScale(80, 80);
        PLANE.setCoordinates(0, 50, 200);
        PLANE.init(scene, config);
        const logoPlane = PLANE.getPlane();
        if (logoPlane) logoPlane.renderingGroupId = 1;

        const puffMat = new BABYLON.StandardMaterial("puffMat", scene);
        puffMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        puffMat.disableLighting = true;
        puffMat.alpha = 0.35;

        for (let i = 0; i < PUFF_COUNT; i++) {
            const size = 20 + Math.random() * 60;
            const puff = BABYLON.MeshBuilder.CreateSphere("puff" + i, {
                diameter: size,
                segments: 8
            }, scene);
            puff.position.set(
                (Math.random() - 0.5) * 2000,
                20 + Math.random() * 300,
                (Math.random() - 0.5) * 2000
            );
            puff.material = puffMat;
            puff.scaling.set(1, 0.4 + Math.random() * 0.3, 1);
            cloudPuffs.push({
                mesh: puff,
                basePos: puff.position.clone(),
                size: size,
                speed: 0.3 + Math.random() * 1.5,
                drift: Math.random() * Math.PI * 2,
                floatOffset: Math.random() * 100
            });
        }

        if (!scene.glowLayer) {
            new BABYLON.GlowLayer("glow", scene).intensity = 0.4;
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
        const pBass = Math.pow(bass, 1.6);

        let treble = 0;
        for (let i = fft.length - 20; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20 / 255) * boost;

        if (config.dynamicColors) {
            const hue = (t * 0.03) % 1;
            const pRGB = hslToRgb(hue, 0.4, 0.6 + bass * 0.2);
            const aRGB = hslToRgb((hue + 0.3) % 1, 0.6, 0.7 + treble * 0.2);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        const pLen = cloudPuffs.length;
        const burstForce = pBass > 0.6 ? pBass * 10 : 0;
        for (let i = 0; i < pLen; i++) {
            const cp = cloudPuffs[i];
            const pos = cp.mesh.position;
            pos.x += Math.sin(t * cp.speed + cp.drift) * 0.3;
            pos.y += Math.sin(t * cp.speed * 0.5 + cp.floatOffset) * 0.2;
            pos.z += Math.cos(t * cp.speed + cp.drift) * 0.3;

            if (burstForce > 0) {
                const dir = pos.subtract(cp.basePos).normalize();
                pos.addInPlace(dir.scale(burstForce * 2));
                pos.x += (Math.random() - 0.5) * burstForce;
            }

            const alpha = 0.15 + pBass * 0.2 + treble * 0.15;
            const tint = 0.5 + pBass * 0.5;
            cp.mesh.material.emissiveColor.set(
                _accentColor.r * tint,
                _accentColor.g * tint,
                _accentColor.b * tint
            );
            cp.mesh.material.alpha = Math.min(0.45, alpha);
        }

        if (currentCamera) {
            currentCamera.radius = 300 - pBass * 60;
            currentCamera.fov = 1.2 + treble * 0.2;
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        cloudPuffs = [];
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

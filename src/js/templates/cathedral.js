import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let pillars = [];
let roseWindow = [];
let roseMat;
let currentTemplateConfig = {};

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 0, -400);
            camera.setTarget(new BABYLON.Vector3(0, 0, 200));
            camera.radius = 400;
            camera.beta = Math.PI / 2.5;
        }

        scene.clearColor = new BABYLON.Color4(0.01, 0.01, 0.02, 1);
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.0008;
        scene.fogColor = new BABYLON.Color3(0.01, 0.01, 0.03);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        PLANE.setScale(120, 120);
        PLANE.setCoordinates(0, 0, 300);
        PLANE.init(scene, config);
        const logoPlane = PLANE.getPlane();
        if (logoPlane) logoPlane.renderingGroupId = 2;

        const pillarMat = new BABYLON.StandardMaterial("pillarMat", scene);
        pillarMat.emissiveColor = new BABYLON.Color3(0.1, 0.08, 0.12);
        pillarMat.disableLighting = true;

        const basePillar = BABYLON.MeshBuilder.CreateCylinder("pillarBase", {
            height: 300,
            diameterTop: 8,
            diameterBottom: 12
        }, scene);
        basePillar.material = pillarMat;
        basePillar.isVisible = false;

        const baseArch = BABYLON.MeshBuilder.CreateBox("archBase", {
            width: 8,
            height: 4,
            depth: 120
        }, scene);
        baseArch.material = pillarMat;
        baseArch.isVisible = false;

        for (let side = -1; side <= 1; side += 2) {
            for (let d = 0; d < 6; d++) {
                const p = basePillar.createInstance("pillar" + side + "_" + d);
                p.position.set(side * 200, -120, d * 120);
                pillars.push({ mesh: p, baseZ: d * 120, side: side, baseX: side * 200, type: "pillar" });
            }
            for (let a = 0; a < 5; a++) {
                const arch = baseArch.createInstance("arch" + side + "_" + a);
                arch.position.set(side * 100, 40, a * 120 + 60);
                arch.scaling.set(1 + Math.sin(a) * 0.3, 1, 1);
                pillars.push({ mesh: arch, baseZ: a * 120 + 60, side: side, baseX: side * 100, type: "arch", index: a });
            }
        }
        basePillar.dispose();
        baseArch.dispose();

        roseMat = new BABYLON.StandardMaterial("roseMat", scene);
        roseMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        roseMat.disableLighting = true;

        const centerDisc = BABYLON.MeshBuilder.CreateDisc("roseCenter", {
            radius: 30,
            tessellation: 32
        }, scene);
        centerDisc.position.z = 350;
        centerDisc.material = roseMat;
        roseWindow.push(centerDisc);

        for (let i = 0; i < 6; i++) {
            const ring = BABYLON.MeshBuilder.CreateTorus("roseRing" + i, {
                diameter: 40 + i * 30,
                thickness: 1.5,
                tessellation: 48
            }, scene);
            ring.position.z = 350;
            ring.material = roseMat;
            roseWindow.push(ring);
        }

        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            const ray = BABYLON.MeshBuilder.CreateBox("ray" + i, {
                width: 2,
                height: 60,
                depth: 0.5
            }, scene);
            ray.position.set(Math.cos(angle) * 40, Math.sin(angle) * 40, 350);
            ray.rotation.z = -angle;
            ray.material = roseMat;
            roseWindow.push(ray);
        }

        if (!scene.glowLayer) {
            new BABYLON.GlowLayer("glow", scene).intensity = 1.2;
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
            const hue = (t * 0.02) % 1;
            const pRGB = hslToRgb(hue, 0.6, 0.3 + bass * 0.3);
            const aRGB = hslToRgb((hue + 0.4) % 1, 0.7, 0.5 + treble * 0.3);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        const shake = pBass > 0.4 ? pBass * 8 : 0;
        for (let i = 0; i < pillars.length; i++) {
            const p = pillars[i];
            if (shake > 0) {
                p.mesh.position.x = p.baseX + (Math.random() - 0.5) * shake;
            } else {
                p.mesh.position.x += (p.baseX - p.mesh.position.x) * 0.1;
            }
            const intensity = 0.1 + pBass * 0.4 + (p.index !== undefined ? fft[p.index * 10 % fft.length] / 255 * 0.5 : 0);
            p.mesh.material.emissiveColor.set(
                _primaryColor.r * intensity,
                _primaryColor.g * intensity * 0.7,
                _primaryColor.b * intensity * 0.5
            );
        }

        const roseHue = (t * 0.03) % 1;
        for (let i = 0; i < roseWindow.length; i++) {
            const r = roseWindow[i];
            const hue = (roseHue + i * 0.05 + treble * 0.2) % 1;
            const col = hslToRgb(hue, 0.9, 0.4 + pBass * 0.3 + treble * 0.2);
            const intensity = 0.3 + pBass + treble * 1.5;
            r.material.emissiveColor.set(
                col.r * intensity,
                col.g * intensity,
                col.b * intensity
            );
            r.rotation.z += 0.002 * (1 + pBass * 2);
        }

        if (currentCamera) {
            currentCamera.radius = 400 - pBass * 60;
            currentCamera.alpha += 0.001 * (1 + pBass);
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        pillars = [];
        roseWindow = [];
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

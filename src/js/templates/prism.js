import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let prisms = [];
let t = 0;
let currentTemplateConfig = {};

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;
        
        const templateData = config.templates.find(t => t.name === 'prism');
        currentTemplateConfig = templateData ? templateData.currentConfig : {};
        const c = currentTemplateConfig;

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 0, -400);
            camera.setTarget(BABYLON.Vector3.Zero());
        }

        scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.05, 1);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Logo ---
        PLANE.setScale(150, 150);
        PLANE.setCoordinates(0, 0, 0);
        PLANE.init(scene, config);

        // --- Prism Refractive Material ---
        const prismMat = new BABYLON.PBRMaterial("prismMat", scene);
        prismMat.metallic = 0.9;
        prismMat.roughness = 0.1;
        prismMat.indexOfRefraction = 2.4;
        prismMat.alpha = 0.5;
        prismMat.directIntensity = 0.5;
        prismMat.environmentIntensity = 0.5;
        prismMat.cameraExposure = 0.6;
        prismMat.cameraContrast = 1.6;
        prismMat.emissiveColor = _accentColor.scale(0.3);

        const basePrism = BABYLON.MeshBuilder.CreatePolyhedron("baseP", { type: 1, size: 20 }, scene);
        basePrism.material = prismMat;
        basePrism.isVisible = false;

        prisms = [];
        const count = c.prismCount || 40;
        for (let i = 0; i < count; i++) {
            const p = basePrism.createInstance("prism" + i);
            const angle = (i / count) * Math.PI * 2;
            const radius = 250 + Math.random() * 150;
            p.position.set(Math.cos(angle) * radius, (Math.random()-0.5)*300, Math.sin(angle) * radius);
            p.rotation.set(Math.random(), Math.random(), Math.random());
            prisms.push({ mesh: p, angle, radius, rotVel: new BABYLON.Vector3(Math.random()*0.02, Math.random()*0.02, Math.random()*0.02) });
        }

        if (!scene.glowLayer) new BABYLON.GlowLayer("glow", scene).intensity = 1.6;
    },

    render(fft, config) {
        if (!fft || !fft.length) fft = new Uint8Array(256).fill(0);
        const c = currentTemplateConfig;
        t += 0.005;
        PLANE.render(fft, config);

        const boost = config.sensitivity ? config.sensitivity.bassBoost : 1.0;
        let bass = 0;
        for (let i = 0; i < 6; i++) bass += fft[i];
        bass = (bass / 6 / 255) * boost;
        const pBass = Math.pow(bass, 1.4);

        let treble = 0;
        for (let i = fft.length-20; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20 / 255) * boost;

        if (config.dynamicColors) {
            const hue = (t * 0.05) % 1;
            const pRGB = hslToRgb(hue, 0.7, 0.6 + bass * 0.2);
            const aRGB = hslToRgb((hue + 0.6) % 1, 0.8, 0.5 + treble * 0.3);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        const prismMat = prisms.length > 0 ? prisms[0].mesh.material : null;
        if (prismMat) {
            prismMat.emissiveColor.copyFrom(_accentColor.scale(0.3 * (1 + pBass * 3)));
        }

        prisms.forEach((p, i) => {
            const speed = (c.speed || 1.0) * (0.01 + pBass * 0.1);
            p.angle += speed;
            p.mesh.position.x = Math.cos(p.angle) * p.radius;
            p.mesh.position.z = Math.sin(p.angle) * p.radius;
            
            p.mesh.rotation.addInPlace(p.rotVel.scale(1 + treble * 10));
            p.mesh.scaling.setAll(1 + pBass * 2);
        });

        if (currentCamera) {
            currentCamera.radius = 400 - pBass * 100;
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        prisms = [];
    }
};

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();

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

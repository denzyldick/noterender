import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let knot;
let sps;
let currentTemplateConfig = {};

// GC Safety: Pre-allocated objects
const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;
        
        const templateData = config.templates.find(t => t.name === 'aether');
        currentTemplateConfig = templateData ? templateData.currentConfig : {};

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 0, -350);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.radius = 350;
            camera.alpha = -Math.PI / 2;
            camera.beta = Math.PI / 2;
        }

        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        // --- Logo ---
        PLANE.setScale(120, 120);
        PLANE.setCoordinates(0, 0, 0);
        PLANE.init(scene, config);

        // --- THE MATH: Parametric Torus Knot ---
        // P and Q define the winding. 
        knot = BABYLON.MeshBuilder.CreateTorusKnot("knot", {
            radius: 120,
            tube: 1.2,
            radialSegments: 48,
            tubularSegments: 16,
            p: 3,
            q: 7,
            updatable: false
        }, scene);
        
        const mat = new BABYLON.StandardMaterial("knotMat", scene);
        mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        mat.disableLighting = true;
        mat.wireframe = true;
        knot.material = mat;

        // --- Particle Swarm ---
        sps = new BABYLON.SolidParticleSystem("swarm", scene, { updatable: true });
        const sphere = BABYLON.MeshBuilder.CreateSphere("s", { diameter: 2 }, scene);
        sps.addShape(sphere, 250);
        sphere.dispose();
        const mesh = sps.buildMesh();
        mesh.material = new BABYLON.StandardMaterial("swarmMat", scene);
        mesh.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        mesh.material.disableLighting = true;

        sps.initParticles = () => {
            for (let p = 0; p < sps.nbParticles; p++) {
                const part = sps.particles[p];
                part.angle = Math.random() * Math.PI * 2;
                part.dist = 160 + Math.random() * 120;
                part.speed = 0.005 + Math.random() * 0.015;
                part.yOffset = (Math.random() - 0.5) * 100;
            }
        };
        sps.initParticles();
        sps.setParticles();

        if (!scene.glowLayer) {
            new BABYLON.GlowLayer("glow", scene).intensity = 0.8;
        }
    },

    render(fft, config) {
        if (!fft || !fft.length) fft = new Uint8Array(256).fill(0);
        t += 0.01;
        PLANE.render(fft, config);

        const boost = (config.sensitivity && config.sensitivity.bassBoost) ? config.sensitivity.bassBoost : 1.0;
        let bass = 0;
        for (let i = 0; i < 10; i++) bass += fft[i];
        bass = (bass / 10 / 255) * boost;
        const pBass = Math.pow(bass, 1.8);

        let treble = 0;
        const tStart = Math.max(0, fft.length - 30);
        for (let i = tStart; i < fft.length; i++) treble += fft[i];
        treble = (treble / (fft.length - tStart) / 255) * boost;

        if (config.dynamicColors) {
            const hue = (t * 0.08) % 1;
            const pRGB = hslToRgb(hue, 0.7, 0.5 + bass * 0.2);
            const aRGB = hslToRgb((hue + 0.5) % 1, 0.8, 0.6 + treble * 0.3);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (knot) {
            knot.rotation.y += 0.005 + pBass * 0.05;
            knot.rotation.z += 0.002;
            const s = 1.0 + pBass * 0.6;
            knot.scaling.set(s, s, s);
            knot.material.emissiveColor.set(_primaryColor.r * (0.4 + pBass*2), _primaryColor.g * (0.4 + pBass*2), _primaryColor.b * (0.4 + pBass*2));
        }

        if (sps) {
            sps.mesh.material.emissiveColor.set(_accentColor.r, _accentColor.g, _accentColor.b);
            
            const pCount = sps.nbParticles;
            for (let p = 0; p < pCount; p++) {
                const part = sps.particles[p];
                part.angle += part.speed * (1 + treble * 15);
                const d = part.dist * (1 + pBass * 0.4);
                part.position.x = Math.cos(part.angle) * d;
                part.position.y = Math.sin(part.angle) * d + part.yOffset;
                part.position.z = Math.sin(part.angle * 0.5) * 50;
                part.scaling.setAll(1 + treble * 10);
            }
            sps.setParticles();
        }

        if (currentCamera) {
            currentCamera.fov = 1.0 + pBass * 0.3;
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        if (knot) knot.dispose();
        if (sps) {
            if (sps.mesh) sps.mesh.dispose();
            sps.dispose();
        }
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

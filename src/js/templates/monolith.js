import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let monolith;
let cubeSPS;
let t = 0;
let currentTemplateConfig = {};

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;
        
        const templateData = config.templates.find(t => t.name === 'monolith');
        currentTemplateConfig = templateData ? templateData.currentConfig : {};
        const c = currentTemplateConfig;

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 80, -300);
            camera.setTarget(BABYLON.Vector3.Zero());
        }

        scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.02, 1);
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.002;

        // --- Logo ---
        PLANE.setScale(120, 120);
        PLANE.setCoordinates(0, 0, 50);
        PLANE.init(scene, config);

        // --- Monolith ---
        monolith = BABYLON.MeshBuilder.CreateBox("monolith", { width: 100, height: 180, depth: 40 }, scene);
        const monMat = new BABYLON.StandardMaterial("monMat", scene);
        monMat.diffuseColor = new BABYLON.Color3(0,0,0);
        monMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        monMat.specularColor = new BABYLON.Color3(1,1,1);
        monMat.specularPower = 128;
        monolith.material = monMat;

        // --- Cube Grid SPS ---
        cubeSPS = new BABYLON.SolidParticleSystem("cubeGrid", scene, { updatable: true });
        const box = BABYLON.MeshBuilder.CreateBox("b", { size: 1 }, scene);
        cubeSPS.addShape(box, c.cubeCount || 400);
        box.dispose();
        const mesh = cubeSPS.buildMesh();
        mesh.material = new BABYLON.StandardMaterial("cubeMat", scene);
        mesh.material.emissiveColor = new BABYLON.Color3(1,1,1);
        mesh.material.disableLighting = true;

        cubeSPS.initParticles = () => {
            for (let p = 0; p < cubeSPS.nbParticles; p++) {
                const part = cubeSPS.particles[p];
                part.position.set((Math.random()-0.5)*1000, (Math.random()-0.5)*1000, (Math.random()-0.5)*1000);
                part.scaling.setAll(5 + Math.random()*15);
                part.velocity = new BABYLON.Vector3(0,0,0);
                part.originalPos = part.position.clone();
            }
        };
        cubeSPS.initParticles();
        cubeSPS.setParticles();

        if (!scene.glowLayer) new BABYLON.GlowLayer("glow", scene).intensity = 1.5;
    },

    render(fft, config) {
        if (!fft || !fft.length) fft = new Uint8Array(256).fill(0);
        const c = currentTemplateConfig;
        t += 0.01;
        PLANE.render(fft, config);

        const boost = config.sensitivity ? config.sensitivity.bassBoost : 1.0;
        let bass = 0;
        for (let i = 0; i < 10; i++) bass += fft[i];
        bass = (bass / 10 / 255) * boost;
        const pBass = Math.pow(bass, 1.5);

        if (config.dynamicColors) {
            const hue = (t * 0.04) % 1;
            const pRGB = hslToRgb(hue, 0.6, 0.4 + bass * 0.3);
            const aRGB = hslToRgb((hue + 0.5) % 1, 0.7, 0.5 + bass * 0.2);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (monolith) {
            monolith.rotation.y += 0.005;
            monolith.scaling.set(1 + pBass*0.2, 1 + pBass*0.1, 1 + pBass*0.2);
            monolith.material.emissiveColor.set(_primaryColor.r * pBass, _primaryColor.g * pBass, _primaryColor.b * pBass);
        }

        if (cubeSPS) {
            for (let p = 0; p < cubeSPS.nbParticles; p++) {
                const part = cubeSPS.particles[p];
                // Gravitational pull to center on bass
                const dir = BABYLON.Vector3.Zero().subtract(part.position).normalize();
                part.position.addInPlace(dir.scale(pBass * 20));
                
                // Vertical jitter on treble
                const trebleVal = fft[p % 128] / 255;
                part.position.y += Math.sin(t*10 + p) * trebleVal * 10;
                
                // Reset if too close
                if (part.position.length() < 100) {
                    part.position.set((Math.random()-0.5)*1200, (Math.random()-0.5)*1200, (Math.random()-0.5)*1200);
                }
            }
            cubeSPS.setParticles();
            cubeSPS.mesh.material.emissiveColor.set(_accentColor.r, _accentColor.g, _accentColor.b);
        }

        if (currentCamera) {
            currentCamera.alpha += 0.002;
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        if (monolith) monolith.dispose();
        if (cubeSPS) cubeSPS.mesh.dispose();
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

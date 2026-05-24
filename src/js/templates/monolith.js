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

        if (monolith) {
            monolith.rotation.y += 0.005;
            monolith.scaling.set(1 + pBass*0.2, 1 + pBass*0.1, 1 + pBass*0.2);
            const col = config.colors;
            monolith.material.emissiveColor.set(col.r/255 * pBass, col.g/255 * pBass, col.b/255 * pBass);
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
            const lCol = config.light;
            cubeSPS.mesh.material.emissiveColor.set(lCol.r/255, lCol.g/255, lCol.b/255);
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

export default template;

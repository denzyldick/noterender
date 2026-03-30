import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let t = 0;
let rings = [];
let stars;
let sceneRef;
let tunnelGroup;
let currentCamera;

// Pre-allocated for performance
const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;
        
        // DISABLE cinematic camera for this template
        CAMERA_PHYSICS.lock();

        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        
        // --- Fog for Depth ---
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.002;
        scene.fogColor = new BABYLON.Color3(0, 0, 0);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Camera ---
        if (camera) {
            camera.setTarget(new BABYLON.Vector3(0, 0, 400));
            camera.setPosition(new BABYLON.Vector3(0, 0, -100));
        }

        // --- Logo ---
        PLANE.setScale(120, 120);
        PLANE.setCoordinates(0, 0, 400); 
        PLANE.init(scene, config);
        const logoPlane = PLANE.getPlane();
        if (logoPlane) {
            logoPlane.renderingGroupId = 1; 
        }

        // --- Infinite Tunnel of Rings ---
        rings = [];
        tunnelGroup = new BABYLON.TransformNode("tunnel", scene);
        const ringMat = new BABYLON.StandardMaterial("ringMat", scene);
        ringMat.emissiveColor.copyFrom(_primaryColor);
        ringMat.disableLighting = true;
        ringMat.wireframe = true;

        for (let i = 0; i < 40; i++) {
            const ring = BABYLON.MeshBuilder.CreateTorus(`ring${i}`, {
                diameter: 400, thickness: 5, tessellation: i % 2 === 0 ? 3 : 6
            }, scene);
            ring.material = ringMat;
            ring.position.z = i * 40;
            ring.parent = tunnelGroup;
            ring.renderingGroupId = 0;
            rings.push({ mesh: ring, initialZ: i * 40, rotSpeed: 0.01 + Math.random() * 0.02 });
        }

        // --- Star Field ---
        stars = new BABYLON.SolidParticleSystem("stars", scene);
        const p = BABYLON.MeshBuilder.CreateBox("p", { size: 1.5 }, scene);
        stars.addShape(p, 1000);
        p.dispose();
        const starMesh = stars.buildMesh();
        starMesh.material = new BABYLON.StandardMaterial("starMat", scene);
        starMesh.material.emissiveColor.copyFrom(_accentColor);
        starMesh.material.disableLighting = true;
        starMesh.renderingGroupId = 0;

        stars.initParticles = () => {
            for (let p = 0; p < stars.nbParticles; p++) {
                const part = stars.particles[p];
                this.resetStar(part);
                part.position.z = Math.random() * 2000;
            }
        };
        stars.initParticles();
        stars.setParticles();

        if (!scene.glowLayer) new BABYLON.GlowLayer("glow", scene);
    },

    resetStar(part) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 200 + Math.random() * 800;
        part.position.x = Math.cos(angle) * radius;
        part.position.y = Math.sin(angle) * radius;
        part.position.z = 2000;
        part.velocity = 5 + Math.random() * 15;
    },

    render(fft, config) {
        if (!fft) fft = new Uint8Array(256).fill(0);
        t += 0.01;
        let bass = 0;
        for (let i = 0; i < 10; i++) bass += fft[i];
        bass = (bass / 10) / 255;

        let treble = 0;
        const tStart = Math.max(0, fft.length - 20);
        for (let i = tStart; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20) / 255;

        PLANE.render(fft, config);

        if (config.dynamicColors) {
            _primaryColor.set(bass, 0.5, 1-bass);
            _accentColor.set(1-treble, 0.2, treble);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        // --- Tunnel Animation ---
        rings.forEach((r) => {
            r.mesh.position.z -= 2 * (1 + bass * 5);
            r.mesh.rotation.z += r.rotSpeed * (1 + bass * 2);
            if (r.mesh.position.z < -100) r.mesh.position.z = 1500;
            
            // Pulse color
            r.mesh.material.emissiveColor.set(_primaryColor.r * (0.4 + bass), _primaryColor.g * (0.4 + bass), _primaryColor.b * (0.4 + bass));
        });

        // --- Stars ---
        if (stars) {
            for (let p = 0; p < stars.nbParticles; p++) {
                const part = stars.particles[p];
                part.position.z -= part.velocity * (1 + bass * 10);
                if (part.position.z < -100) this.resetStar(part);
            }
            stars.setParticles();
            stars.mesh.material.emissiveColor.copyFrom(_accentColor);
        }

        // --- Camera Motion ---
        if (currentCamera) {
            currentCamera.setTarget(new BABYLON.Vector3(0, 0, 400));

            if (config.options && config.options.camera && config.options.camera.move) {
                const orbitRadius = 20 * bass;
                const orbitSpeed = t * 0.5;
                
                currentCamera.position.x = Math.cos(orbitSpeed) * orbitRadius;
                currentCamera.position.y = Math.sin(orbitSpeed) * orbitRadius;
                currentCamera.fov = 0.8 + bass * 0.15;
            } else {
                currentCamera.position.x = 0;
                currentCamera.position.y = 0;
                currentCamera.fov = 0.8;
            }
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        rings = [];
    }
};

export default template;

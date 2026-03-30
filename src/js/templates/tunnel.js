import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let t = 0;
let piles = [];
let sceneRef;
let tunnelGroup;
let starField;
let energyLines = [];
let currentCamera;

// Pre-allocated for performance
const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const _tempVec3 = new BABYLON.Vector3();

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;
        
        // EXCLUSIVELY claim the camera to prevent orbit logic from crashing it
        CAMERA_PHYSICS.lock();

        scene.clearColor = new BABYLON.Color4(0, 0, 0.02, 1);
        
        // --- Fog for Depth ---
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.0012;
        scene.fogColor = new BABYLON.Color3(0, 0, 0.05);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Camera Setup ---
        if (camera) {
            camera.setTarget(new BABYLON.Vector3(0, 0, 400));
            camera.setPosition(new BABYLON.Vector3(0, 0, -200));
        }

        // --- Logo ---
        PLANE.setScale(120, 120);
        PLANE.setCoordinates(0, 0, 400);
        PLANE.init(scene, config);
        const logoPlane = PLANE.getPlane();
        if (logoPlane) {
            logoPlane.renderingGroupId = 2;
        }

        // --- Tunnel of Piles ---
        piles = [];
        tunnelGroup = new BABYLON.TransformNode("tunnel", scene);
        
        const sectionCount = 25;
        const pilesPerSection = 24; // 6 per side
        const tunnelSize = 500;
        const sectionSpacing = 80;

        for (let i = 0; i < sectionCount; i++) {
            const z = i * sectionSpacing;
            for (let j = 0; j < pilesPerSection; j++) {
                const pile = BABYLON.MeshBuilder.CreateBox(`pile_${i}_${j}`, {
                    width: 15,
                    height: 15,
                    depth: 60
                }, scene);

                const side = Math.floor(j / 6);
                const posInSide = (j % 6) - 2.5;
                const offset = posInSide * 90;

                if (side === 0) { // Top
                    pile.position.set(offset, tunnelSize/2, z);
                } else if (side === 1) { // Bottom
                    pile.position.set(offset, -tunnelSize/2, z);
                } else if (side === 2) { // Left
                    pile.position.set(-tunnelSize/2, offset, z);
                    pile.rotation.z = Math.PI / 2;
                } else if (side === 3) { // Right
                    pile.position.set(tunnelSize/2, offset, z);
                    pile.rotation.z = Math.PI / 2;
                }

                const mat = new BABYLON.StandardMaterial(`pileMat_${i}_${j}`, scene);
                mat.emissiveColor = _primaryColor.clone();
                mat.disableLighting = true;
                pile.material = mat;
                pile.parent = tunnelGroup;
                pile.renderingGroupId = 1;

                piles.push({
                    mesh: pile,
                    initialZ: z,
                    side: side,
                    index: j,
                    baseX: pile.position.x,
                    baseY: pile.position.y
                });
            }
        }

        // --- Energy Lines (Background) ---
        energyLines = [];
        for(let i=0; i<4; i++) {
            const line = BABYLON.MeshBuilder.CreateBox(`line_${i}`, { width: 2, height: 2, depth: 4000 }, scene);
            const offset = tunnelSize / 2 + 20;
            if(i === 0) line.position.set(offset, offset, 1500);
            if(i === 1) line.position.set(-offset, offset, 1500);
            if(i === 2) line.position.set(offset, -offset, 1500);
            if(i === 3) line.position.set(-offset, -offset, 1500);
            
            const lineMat = new BABYLON.StandardMaterial(`lineMat_${i}`, scene);
            lineMat.emissiveColor.copyFrom(_accentColor);
            lineMat.disableLighting = true;
            line.material = lineMat;
            line.renderingGroupId = 0;
            energyLines.push(line);
        }

        // --- Star Field ---
        starField = new BABYLON.SolidParticleSystem("stars", scene);
        const p = BABYLON.MeshBuilder.CreateBox("p", { size: 3 }, scene);
        starField.addShape(p, 400);
        p.dispose();
        const starMesh = starField.buildMesh();
        starMesh.material = new BABYLON.StandardMaterial("starMat", scene);
        starMesh.material.emissiveColor.copyFrom(_accentColor);
        starMesh.material.disableLighting = true;
        starMesh.renderingGroupId = 0;

        starField.initParticles = () => {
            for (let p = 0; p < starField.nbParticles; p++) {
                const part = starField.particles[p];
                this.resetStar(part);
                part.position.z = Math.random() * 4000;
            }
        };
        starField.initParticles();
        starField.setParticles();

        if (!scene.glowLayer) {
            new BABYLON.GlowLayer("glow", scene);
        }
    },

    resetStar(part) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 600 + Math.random() * 1200;
        part.position.x = Math.cos(angle) * radius;
        part.position.y = Math.sin(angle) * radius;
        part.position.z = 4000;
        part.velocity = 15 + Math.random() * 30;
    },

    render(fft, config) {
        if (!fft) fft = new Uint8Array(256).fill(0);
        t += 0.01; 
        
        let bass = 0;
        for (let i = 0; i < 10; i++) bass += fft[i];
        bass = (bass / 10) / 255;

        let mid = 0;
        for (let i = 10; i < 60; i++) mid += fft[i];
        mid = (mid / 50) / 255;

        let treble = 0;
        for (let i = fft.length - 30; i < fft.length; i++) treble += fft[i];
        treble = (treble / 30) / 255;

        PLANE.render(fft, config);

        if (config.dynamicColors) {
            _primaryColor.set(bass, mid * 0.3, 1 - bass);
            _accentColor.set(1 - treble, 0.5, treble);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        // --- Tunnel Animation ---
        const tunnelSpeed = 8 * (1 + bass * 4);
        piles.forEach((p) => {
            p.mesh.position.z -= tunnelSpeed;
            if (p.mesh.position.z < -300) p.mesh.position.z += 25 * 80;

            const freqVal = fft[p.index * 4 % fft.length] / 255;
            const intensity = 0.3 + freqVal * 1.5;
            p.mesh.material.emissiveColor.set(_primaryColor.r * intensity, _primaryColor.g * intensity, _primaryColor.b * intensity);

            const scale = 1 + freqVal * 4 * (1 + bass);
            if (p.side === 0) { // Top
                p.mesh.scaling.y = scale;
                p.mesh.position.y = 250 - (scale * 7.5) + 7.5;
            } else if (p.side === 1) { // Bottom
                p.mesh.scaling.y = scale;
                p.mesh.position.y = -250 + (scale * 7.5) - 7.5;
            } else if (p.side === 2) { // Left
                p.mesh.scaling.x = scale;
                p.mesh.position.x = -250 + (scale * 7.5) - 7.5;
            } else if (p.side === 3) { // Right
                p.mesh.scaling.x = scale;
                p.mesh.position.x = 250 - (scale * 7.5) + 7.5;
            }
        });

        // --- Energy Lines ---
        energyLines.forEach(line => {
            line.material.emissiveColor.copyFrom(_accentColor);
            line.scaling.set(1 + bass * 2, 1 + bass * 2, 1);
        });

        // --- Stars ---
        if (starField) {
            for (let p = 0; p < starField.nbParticles; p++) {
                const part = starField.particles[p];
                part.position.z -= part.velocity * (1 + bass * 6);
                if (part.position.z < -300) this.resetStar(part);
            }
            starField.setParticles();
            starField.mesh.material.emissiveColor.copyFrom(_accentColor);
        }

        // --- CUSTOM TUNNEL CAMERA MOTION ---
        if (currentCamera) {
            // Look at the centered plane
            currentCamera.setTarget(new BABYLON.Vector3(0, 0, 400));

            if (config.options && config.options.camera && config.options.camera.move) {
                const orbitRadius = 80 + (bass * 40); // Pulse radius with bass
                const orbitSpeed = t * 0.5; // Constant slow rotation
                
                _tempVec3.set(Math.cos(orbitSpeed) * orbitRadius, Math.sin(orbitSpeed) * orbitRadius, -200);
                currentCamera.setPosition(_tempVec3);
                
                // Add a slight "banking" roll
                currentCamera.rotation.z = -orbitSpeed * 0.5;
            } else {
                _tempVec3.set(0, 0, -200);
                currentCamera.setPosition(_tempVec3);
                currentCamera.rotation.z = 0;
            }
            
            currentCamera.fov = 0.8 + bass * 0.15;
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        piles = [];
        energyLines = [];
    }
};

export default template;

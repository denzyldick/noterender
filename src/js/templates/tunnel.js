import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let t = 0;
let piles = [];
let sceneRef;
let tunnelGroup;
let starField;
let energyLines = [];

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        sceneRef = scene;
        scene.clearColor = new BABYLON.Color4(0, 0, 0.02, 1);
        
        // --- Fog for Depth ---
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.0012;
        scene.fogColor = new BABYLON.Color3(0, 0, 0.05);

        const primary = new BABYLON.Color3(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        const accent = new BABYLON.Color3(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Camera ---
        camera.setPosition(new BABYLON.Vector3(0, 0, -200));
        camera.setTarget(new BABYLON.Vector3(0, 0, 1000));

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
                mat.emissiveColor = primary.clone();
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
            lineMat.emissiveColor = accent;
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
        starMesh.material.emissiveColor = accent;
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
        t += 0.02;
        
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

        const primary = config.dynamicColors ? 
            new BABYLON.Color3(bass, mid * 0.3, 1 - bass) : 
            new BABYLON.Color3(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        
        const accent = config.dynamicColors ? 
            new BABYLON.Color3(1 - treble, 0.5, treble) : 
            new BABYLON.Color3(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Tunnel Animation ---
        const tunnelSpeed = 8 * (1 + bass * 4);
        piles.forEach((p) => {
            p.mesh.position.z -= tunnelSpeed;
            
            if (p.mesh.position.z < -300) {
                p.mesh.position.z += 25 * 80;
            }

            // Audio-reactive coloring
            const freqVal = fft[p.index * 4 % fft.length] / 255;
            const intensity = 0.3 + freqVal * 1.5;
            p.mesh.material.emissiveColor.set(
                primary.r * intensity,
                primary.g * intensity,
                primary.b * intensity
            );

            // Reactive scaling (piles grow inwards)
            const scale = 1 + freqVal * 4 * (1 + bass);
            if (p.side === 0) { // Top
                p.mesh.scaling.y = scale;
                p.mesh.position.y = (500/2) - (scale * 7.5) + 7.5;
            } else if (p.side === 1) { // Bottom
                p.mesh.scaling.y = scale;
                p.mesh.position.y = (-500/2) + (scale * 7.5) - 7.5;
            } else if (p.side === 2) { // Left
                p.mesh.scaling.x = scale;
                p.mesh.position.x = (-500/2) + (scale * 7.5) - 7.5;
            } else if (p.side === 3) { // Right
                p.mesh.scaling.x = scale;
                p.mesh.position.x = (500/2) - (scale * 7.5) + 7.5;
            }
        });

        // --- Energy Lines ---
        energyLines.forEach(line => {
            line.material.emissiveColor = accent;
            line.scaling.x = 1 + bass * 2;
            line.scaling.y = 1 + bass * 2;
        });

        // --- Stars ---
        if (starField) {
            for (let p = 0; p < starField.nbParticles; p++) {
                const part = starField.particles[p];
                part.position.z -= part.velocity * (1 + bass * 6);
                if (part.position.z < -300) this.resetStar(part);
            }
            starField.setParticles();
            starField.mesh.material.emissiveColor = accent;
        }

        // --- Camera Dynamics ---
        const cam = sceneRef.activeCamera;
        if (cam) {
            cam.position.x = Math.sin(t * 0.4) * 30 * bass;
            cam.position.y = Math.cos(t * 0.4) * 30 * bass;
            cam.rotation.z = Math.sin(t * 0.15) * 0.15;
            cam.fov = 0.8 + bass * 0.2;
        }
    }
};

export default template;

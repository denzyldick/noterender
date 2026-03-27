import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let buildings = [];
let lightStreaks = [];
let road;
let roadMaterial;
let sun;
let sunMat;
let glitchGrid;
let glitchParticles;
let t = 0;

const CONFIG = {
    rows: 40,
    cols: 14,
    streetWidth: 70,
    blockSize: 12,
    gap: 15,
    speed: 1.8,
    skyColor: new BABYLON.Color4(0.02, 0.0, 0.05, 1),
};

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        scene.clearColor = CONFIG.skyColor;
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.005;
        scene.fogColor = new BABYLON.Color3(0.02, 0, 0.05);

        const primary = new BABYLON.Color3(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        const accent = new BABYLON.Color3(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Camera ---
        camera.position = new BABYLON.Vector3(0, 25, -80);
        camera.setTarget(new BABYLON.Vector3(0, 10, 100));

        // --- Logo ---
        PLANE.setScale(30, 30);
        PLANE.setCoordinates(0, 18, 25);
        PLANE.init(scene, config);

        // --- Glitch Grid Background (Math Driven) ---
        glitchGrid = BABYLON.MeshBuilder.CreateGround("glitchGrid", { width: 4000, height: 4000, subdivisions: 100 }, scene);
        glitchGrid.position.y = -1;
        glitchGrid.position.z = 1000;
        const gridMat = new BABYLON.StandardMaterial("gridMat", scene);
        gridMat.wireframe = true;
        gridMat.emissiveColor = primary;
        gridMat.disableLighting = true;
        glitchGrid.material = gridMat;

        // --- Matrix-style Glitch Particles ---
        glitchParticles = new BABYLON.SolidParticleSystem("glitchParticles", scene);
        const pShape = BABYLON.MeshBuilder.CreateBox("p", { width: 0.5, height: 10, depth: 0.5 }, scene);
        glitchParticles.addShape(pShape, 500);
        pShape.dispose();
        const pMesh = glitchParticles.buildMesh();
        pMesh.material = new BABYLON.StandardMaterial("pMat", scene);
        pMesh.material.emissiveColor = accent;
        pMesh.material.disableLighting = true;

        glitchParticles.initParticles = () => {
            for (let p = 0; p < glitchParticles.nbParticles; p++) {
                const particle = glitchParticles.particles[p];
                this.resetGlitchParticle(particle);
            }
        };
        glitchParticles.initParticles();
        glitchParticles.setParticles();

        // --- Retro Sun ---
        sun = BABYLON.MeshBuilder.CreateDisc("sun", { radius: 150, tessellation: 64 }, scene);
        sun.position.z = 800;
        sun.position.y = 80;
        sunMat = new BABYLON.StandardMaterial("sunMat", scene);
        sunMat.emissiveColor = primary;
        sunMat.disableLighting = true;
        sun.material = sunMat;

        // --- Neon Road ---
        road = BABYLON.MeshBuilder.CreateGround("road", { width: CONFIG.streetWidth, height: 2000 }, scene);
        road.position.z = 500;
        roadMaterial = new BABYLON.StandardMaterial("roadMat", scene);
        roadMaterial.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        roadMaterial.emissiveColor = primary;
        road.material = roadMaterial;

        // --- Buildings ---
        const baseBox = BABYLON.MeshBuilder.CreateBox("baseBox", { size: 1 }, scene);
        baseBox.isVisible = false;
        baseBox.registerInstancedBuffer("color", 4);

        buildings = [];
        const segmentSize = CONFIG.blockSize + CONFIG.gap;
        for (let row = 0; row < CONFIG.rows; row++) {
            const zPos = row * segmentSize - 50;
            for (let col = 0; col < CONFIG.cols; col++) {
                const isLeft = col < CONFIG.cols / 2;
                const x = isLeft ? 
                    -(CONFIG.streetWidth/2) - (col + 1) * segmentSize : 
                    (CONFIG.streetWidth/2) + (col - CONFIG.cols/2 + 1) * segmentSize;

                const instance = baseBox.createInstance("b" + row + "_" + col);
                instance.position.set(x, 0, zPos);
                instance.instancedBuffers.color = new BABYLON.Color4(primary.r, primary.g, primary.b, 1);
                buildings.push({ mesh: instance, fftIdx: Math.floor(Math.random() * 64) });
            }
        }

        // --- Light Streaks ---
        lightStreaks = [];
        const streakBase = BABYLON.MeshBuilder.CreateBox("streak", { width: 0.5, height: 0.1, depth: 40 }, scene);
        streakBase.isVisible = false;
        for (let i = 0; i < 15; i++) {
            const streak = streakBase.createInstance("streak" + i);
            this.resetStreak(streak);
            lightStreaks.push(streak);
        }

        if (!scene.glowLayer) new BABYLON.GlowLayer("glow", scene);
    },

    resetGlitchParticle(particle) {
        particle.position.x = (Math.random() - 0.5) * 2000;
        particle.position.y = 500 + Math.random() * 500;
        particle.position.z = Math.random() * 1000;
        particle.velocity = 5 + Math.random() * 15;
    },

    resetStreak(streak) {
        const isLeft = Math.random() > 0.5;
        streak.position.x = isLeft ? -15 : 15;
        streak.position.y = 0.5;
        streak.position.z = 600 + Math.random() * 600;
    },

    render(fft, config) {
        t += 0.02;
        PLANE.render(fft);

        let bass = 0;
        for (let i = 0; i < 8; i++) bass += fft[i];
        bass = (bass / 8) / 255;

        let treble = 0;
        for (let i = fft.length - 20; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20) / 255;

        let primary, accent;
        if (config.dynamicColors) {
            primary = new BABYLON.Color3(0.5, bass, 1 - bass);
            accent = new BABYLON.Color3(1 - treble, 0.5, treble);
        } else {
            primary = new BABYLON.Color3(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            accent = new BABYLON.Color3(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        // --- Pulse Sun & Grid ---
        if (sunMat) {
            sun.scaling.setAll(1.0 + bass * 0.3);
            sunMat.emissiveColor.set(primary.r * (0.5+bass), primary.g * (0.5+bass), primary.b * (0.5+bass));
        }
        if (glitchGrid) {
            glitchGrid.position.z -= CONFIG.speed * 2;
            if (glitchGrid.position.z < 0) glitchGrid.position.z = 1000;
            glitchGrid.material.emissiveColor.set(primary.r * (0.5+bass), primary.g * (0.2+bass), primary.b * (0.4+bass));
        }

        // --- Glitch Particles ---
        if (glitchParticles) {
            for (let p = 0; p < glitchParticles.nbParticles; p++) {
                const particle = glitchParticles.particles[p];
                particle.position.y -= particle.velocity * (1 + bass * 3);
                if (particle.position.y < -100) this.resetGlitchParticle(particle);
            }
            glitchParticles.setParticles();
            glitchParticles.mesh.material.emissiveColor = accent;
        }

        const segmentSize = CONFIG.blockSize + CONFIG.gap;
        const totalDepth = CONFIG.rows * segmentSize;

        buildings.forEach(b => {
            b.mesh.position.z -= CONFIG.speed * (1 + bass * 0.8);
            if (b.mesh.position.z < -100) b.mesh.position.z += totalDepth;

            const val = fft[b.fftIdx] / 255;
            const h = 5 + val * 150;
            b.mesh.scaling.set(CONFIG.blockSize, h, CONFIG.blockSize);
            b.mesh.position.y = h / 2;

            b.mesh.instancedBuffers.color = new BABYLON.Color4(primary.r * (0.5+val), primary.g * val, primary.b * (0.5+val), 1);
        });

        lightStreaks.forEach(s => {
            s.position.z -= CONFIG.speed * 6;
            if (s.position.z < -100) this.resetStreak(s);
        });
    }
};

export default template;

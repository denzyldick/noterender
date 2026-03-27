import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let ground;
let sun;
let sunMat;
let digitalAurora;
let t = 0;

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        scene.clearColor = new BABYLON.Color4(0.01, 0.01, 0.05, 1);
        
        const primary = new BABYLON.Color3(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        const accent = new BABYLON.Color3(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Retro Atmosphere ---
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.004;
        scene.fogColor = new BABYLON.Color3(0.1, 0, 0.2);

        // --- Logo ---
        PLANE.setScale(40, 40);
        PLANE.setCoordinates(0, 25, 40);
        PLANE.init(scene, config);

        // --- Digital Aurora Background ---
        digitalAurora = new BABYLON.SolidParticleSystem("aurora", scene);
        const ribbonShape = BABYLON.MeshBuilder.CreatePlane("r", { width: 2000, height: 5 }, scene);
        digitalAurora.addShape(ribbonShape, 50);
        ribbonShape.dispose();
        const auroraMesh = digitalAurora.buildMesh();
        auroraMesh.material = new BABYLON.StandardMaterial("auroraMat", scene);
        auroraMesh.material.emissiveColor = accent;
        auroraMesh.material.alpha = 0.3;
        auroraMesh.material.disableLighting = true;

        digitalAurora.initParticles = () => {
            for (let p = 0; p < digitalAurora.nbParticles; p++) {
                const part = digitalAurora.particles[p];
                part.position.set(0, 200 + p * 10, 800);
                part.props = { offset: p * 0.2 };
            }
        };
        digitalAurora.initParticles();
        digitalAurora.setParticles();

        // --- Giant Retro Sun ---
        sun = BABYLON.MeshBuilder.CreateDisc("sun", { radius: 120, tessellation: 64 }, scene);
        sun.position.z = 600;
        sun.position.y = 100;
        sunMat = new BABYLON.StandardMaterial("sunMat", scene);
        sunMat.emissiveColor = primary;
        sunMat.disableLighting = true;
        sun.material = sunMat;

        // --- Camera ---
        camera.setPosition(new BABYLON.Vector3(0, 35, -150));
        camera.setTarget(new BABYLON.Vector3(0, 10, 50));

        // --- Moving Terrain ---
        ground = BABYLON.MeshBuilder.CreateGround("g", { width: 1500, height: 1500, subdivisions: 64, updatable: true }, scene);
        const mat = new BABYLON.StandardMaterial("m", scene);
        mat.wireframe = true;
        mat.emissiveColor = primary;
        ground.material = mat;

        if (!scene.glowLayer) new BABYLON.GlowLayer("glow", scene);
    },

    render(fft, config) {
        t += 0.005;
        PLANE.render(fft);

        let bass = 0;
        for (let i = 0; i < 10; i++) bass += fft[i];
        bass = (bass / 10) / 255;

        let treble = 0;
        for (let i = fft.length - 20; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20) / 255;

        let primary, accent;
        if (config.dynamicColors) {
            primary = new BABYLON.Color3(1 - bass, 0.4, bass);
            accent = new BABYLON.Color3(0.3, treble, 1 - treble);
        } else {
            primary = new BABYLON.Color3(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            accent = new BABYLON.Color3(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (digitalAurora) {
            for (let p = 0; p < digitalAurora.nbParticles; p++) {
                const part = digitalAurora.particles[p];
                part.position.x = Math.sin(t * 2 + part.props.offset) * 200;
                part.rotation.z = Math.cos(t + part.props.offset) * 0.2;
                part.scaling.y = 1 + bass * 8;
                part.color = new BABYLON.Color4(accent.r, accent.g, accent.b, 0.4);
            }
            digitalAurora.setParticles();
        }

        if (sunMat) {
            sun.scaling.setAll(1.0 + bass * 0.4);
            sunMat.emissiveColor.set(primary.r * (0.8 + bass * 0.2), primary.g * (0.2 + bass * 0.8), primary.b * 0.2);
        }

        const positions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            const zMod = (z + t * 500) % 1500 - 750;
            let y = Math.sin(x * 0.02) * Math.cos(zMod * 0.02) * 40;
            const musicImpact = (fft[i % 64] / 255) * 60;
            y += musicImpact;
            if (y > 20) y += bass * 30;
            positions[i + 1] = y;
        }
        ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        ground.material.emissiveColor.set(primary.r * (0.5+bass), primary.g * (0.5+bass), primary.b * (0.5+bass));
    }
};

export default template;

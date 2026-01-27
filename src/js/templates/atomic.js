import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let electrons = [];
let nucleus = [];
let t = 0;

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.1, 1);

        // Light
        const light = new BABYLON.PointLight("l", new BABYLON.Vector3(0, 0, 0), scene);
        light.intensity = 1.5;
        light.diffuse = new BABYLON.Color3(0.4, 0.8, 1);

        // Init Logo
        PLANE.init(scene, config);
        // Position Logo behind atom
        const logo = PLANE.getPlane();
        if (logo) {
            logo.position.z = 20;
            logo.scaling.setAll(10);
        }

        camera.setPosition(new BABYLON.Vector3(0, 0, -40));

        // Nucleus (Protons/Neutrons)
        // Cluster of spheres
        nucleus = [];
        const nPart = 10;
        for (let i = 0; i < nPart; i++) {
            const s = BABYLON.MeshBuilder.CreateSphere("n" + i, { diameter: 1.5 }, scene);
            const mat = new BABYLON.StandardMaterial("nm" + i, scene);
            mat.diffuseColor = i % 2 === 0 ? new BABYLON.Color3(1, 0, 0) : new BABYLON.Color3(0.8, 0.8, 0.8);
            s.material = mat;

            // Random pack position
            s.position.set(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );

            nucleus.push({ mesh: s, basePos: s.position.clone() });
        }

        // Electrons
        electrons = [];
        const nElec = 6;
        for (let i = 0; i < nElec; i++) {
            const s = BABYLON.MeshBuilder.CreateSphere("e" + i, { diameter: 0.5 }, scene);
            const mat = new BABYLON.StandardMaterial("em" + i, scene);
            mat.emissiveColor = new BABYLON.Color3(0, 1, 1);
            mat.disableLighting = true;
            s.material = mat;

            // Trail - using ParticleSystem
            const particleSystem = new BABYLON.ParticleSystem("ep" + i, 100, scene);
            particleSystem.emitter = s;
            particleSystem.particleTexture = new BABYLON.Texture("/img/templates/Smoke30Frames.png", scene);
            particleSystem.minSize = 0.2;
            particleSystem.maxSize = 0.5;
            particleSystem.minLifeTime = 0.1;
            particleSystem.maxLifeTime = 0.4;
            particleSystem.emitRate = 200;
            particleSystem.color1 = new BABYLON.Color4(0, 1, 1, 1);
            particleSystem.colorDead = new BABYLON.Color4(0, 0, 1, 0);
            particleSystem.start();

            electrons.push({
                mesh: s,
                angle: Math.random() * Math.PI * 2,
                speed: 0.05 + Math.random() * 0.05,
                radius: 8 + Math.random() * 5,
                axis: new BABYLON.Vector3(Math.random(), Math.random(), Math.random()).normalize()
            });
        }
    },

    render(fft, config) {
        t += 0.02;

        // Render Logo
        PLANE.render(fft);

        // Reactivity
        let energy = 0;
        for (let i = 0; i < 128; i++) energy += fft[i];
        energy = energy / 128 / 255; // 0-1

        // 1. Nucleus Vibration
        // High energy -> High vibration
        nucleus.forEach(p => {
            const jitter = 0.1 + energy * 2.0;
            p.mesh.position.x = p.basePos.x + (Math.random() - 0.5) * jitter;
            p.mesh.position.y = p.basePos.y + (Math.random() - 0.5) * jitter;
            p.mesh.position.z = p.basePos.z + (Math.random() - 0.5) * jitter;
        });

        // 2. Electron Orbits
        // Speed increases with energy
        // Radius expands slightly
        electrons.forEach(e => {
            e.angle += e.speed * (1 + energy * 4); // Speed up significantly

            const rotationQuat = BABYLON.Quaternion.RotationAxis(e.axis, e.angle);
            const baseVec = new BABYLON.Vector3(e.radius * (1 + energy), 0, 0);

            const pos = baseVec.applyRotationQuaternion(rotationQuat);
            e.mesh.position.copyFrom(pos);
        });
    }
};

export default template;

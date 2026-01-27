import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let trails = [];
let time = 0;

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        // High contrast lighting
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.5;

        // Init Logo
        PLANE.init(scene, config);
        // Center it
        const logo = PLANE.getPlane();
        if (logo) {
            logo.position.y = 0;
            logo.scaling.setAll(15);
        }

        camera.setPosition(new BABYLON.Vector3(0, 0, -100));

        // Lissajous Knot Parameters
        // We will create multiple trails
        trails = [];
        const trailCount = 32;

        for (let i = 0; i < trailCount; i++) {
            const sphere = BABYLON.MeshBuilder.CreateSphere("t_" + i, { diameter: 1.5, segments: 16 }, scene);
            const mat = new BABYLON.StandardMaterial("m_" + i, scene);
            mat.emissiveColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
            mat.disableLighting = true;
            sphere.material = mat;

            // Trail component
            // Note: BabylonJS has a TrailMesh, but for simplicity we'll just animate the head sphere
            // and using a particle system for the trail is often better mathematically looking

            const particleSystem = new BABYLON.ParticleSystem("particles", 200, scene);
            particleSystem.emitter = sphere;
            particleSystem.particleTexture = new BABYLON.Texture("/img/templates/Smoke30Frames.png", scene); // Assuming exists or generic
            particleSystem.minSize = 0.5;
            particleSystem.maxSize = 2.0;
            particleSystem.minLifeTime = 0.5;
            particleSystem.maxLifeTime = 1.5;
            particleSystem.emitRate = 50;
            particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
            particleSystem.color1 = new BABYLON.Color4(mat.emissiveColor.r, mat.emissiveColor.g, mat.emissiveColor.b, 1.0);
            particleSystem.color2 = new BABYLON.Color4(0, 0, 0, 0);
            particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
            particleSystem.start();

            trails.push({
                mesh: sphere,
                offset: i * (Math.PI / trailCount),
                fftIndex: Math.floor((i / trailCount) * 64),
                params: {
                    a: 3 + Math.floor(Math.random() * 3),
                    b: 2 + Math.floor(Math.random() * 3),
                    delta: Math.PI / 2
                }
            });
        }
    },

    render(fft, config) {
        time += 0.01;

        // Render Logo
        PLANE.render(fft);

        // Constants A and B can be modulated by music
        // Curve: x = A*sin(a*t + delta), y = B*sin(b*t), z = C*cos(...)

        // Calculate global energy for curve scale
        let energy = 0;
        for (let i = 0; i < 30; i++) energy += fft[i];
        energy = (energy / 30) / 255;

        const scale = 30 + energy * 30; // Expand curve with volume

        trails.forEach(trail => {
            const val = fft[trail.fftIndex] / 255; // 0-1

            // Modulate 'a' and 'b' parameters slightly with music to wiggle the knot
            const t_mod = time + val;

            const a = trail.params.a;
            const b = trail.params.b;
            const delta = trail.params.offset;

            // Lissajous 3D
            // x = A sin(at + delta)
            // y = B sin(bt)
            // z = C cos(at + bt) -- Creates a knot-like structure

            const x = scale * Math.sin(a * t_mod + delta);
            const y = scale * Math.sin(b * t_mod);
            const z = scale * Math.cos(a * t_mod + b * t_mod);

            trail.mesh.position.x = x;
            trail.mesh.position.y = y;
            trail.mesh.position.z = z;

            // Color intensity
            trail.mesh.material.emissiveColor.scaleToRef(0.5 + val, trail.mesh.material.emissiveColor);
        });
    }
};

export default template;

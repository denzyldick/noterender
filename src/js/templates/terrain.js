import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let ground;
let t = 0;

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        scene.clearColor = new BABYLON.Color4(0.0, 0.05, 0.1, 1);
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        scene.fogDensity = 0.01;
        scene.fogColor = new BABYLON.Color3(0.0, 0.05, 0.1);

        const light = new BABYLON.HemisphericLight("l", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.8;

        // Init Logo
        PLANE.init(scene, config);
        const logo = PLANE.getPlane();
        if (logo) {
            logo.position.y = 20; // Float above
            logo.position.z = 20;
            logo.scaling.setAll(15);
        }

        camera.setPosition(new BABYLON.Vector3(0, 20, -100));
        camera.setTarget(new BABYLON.Vector3(0, 0, 50));

        // Create Ground Mesh
        // Updatable for vertex manipulation
        ground = BABYLON.MeshBuilder.CreateGround("g", { width: 200, height: 200, subdivisions: 50, updatable: true }, scene);

        const mat = new BABYLON.StandardMaterial("m", scene);
        mat.wireframe = true;
        mat.emissiveColor = new BABYLON.Color3(0, 1, 1);
        mat.disableLighting = true;
        ground.material = mat;
    },

    render(fft, config) {
        t += 0.02;

        // Render Logo
        PLANE.render(fft);

        if (!ground) return;

        // Get vertex data
        const positions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        if (!positions) return;

        // We only update Y
        // positions is [x, y, z, x, y, z...]

        // Map FFT bass to overall height
        let bass = 0;
        for (let i = 0; i < 10; i++) bass += fft[i];
        bass = bass / 10 / 255;

        const subdivisions = 50;
        const size = 200;

        // Update Vertices
        // Wave function: y = sin(x + t) * cos(z + t)
        // We add some FFT jitter

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];

            // Multi-frequency wave
            // Low freq wave (Terrain)
            let y = Math.sin(x * 0.1 + t) * Math.cos(z * 0.1 + t) * 5;

            // Med freq ripple (fft driven)
            y += Math.sin(x * 0.3 - t * 2) * bass * 10;

            // Distance fade (optional, but fog handles it)

            positions[i + 1] = y;
        }

        ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);

        // Color Cycle
        ground.material.emissiveColor.r = 0.2 + bass;
        ground.material.emissiveColor.g = 1 - bass;
        ground.material.emissiveColor.b = 1.0;
    }
};

export default template;

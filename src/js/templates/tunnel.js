import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let rings = [];
let t = 0;

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        // Init Logo
        PLANE.init(scene, config);
        // Center big logo
        const logo = PLANE.getPlane();
        if (logo) {
            logo.position.z = 80;
            logo.scaling.setAll(20);
        } // Logo sits deep in tunnel

        camera.setPosition(new BABYLON.Vector3(0, 0, 0)); // Inside tunnel

        // Tunnel Rings
        rings = [];
        const numRings = 50;
        const spacing = 5;

        const torus = BABYLON.MeshBuilder.CreateTorus("t", { diameter: 10, thickness: 0.2, tessellation: 32 }, scene);
        torus.isVisible = false;

        const mat = new BABYLON.StandardMaterial("m", scene);
        mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        mat.disableLighting = true; // Neon

        for (let i = 0; i < numRings; i++) {
            const instance = torus.createInstance("r_" + i);
            instance.position.z = i * spacing;

            rings.push({
                mesh: instance,
                baseZ: i * spacing,
                fftIndex: Math.floor(i % 32)
            });
        }

        this.spacing = spacing;
        this.totalDepth = numRings * spacing;
    },

    render(fft, config) {
        t += 0.5; // Speed

        // Render Logo
        PLANE.render(fft);

        // Move rings
        let loopT = t % this.totalDepth;

        rings.forEach(r => {
            let z = r.baseZ - loopT;
            while (z < -10) {
                z += this.totalDepth;
            }
            r.mesh.position.z = z;

            // React
            const val = fft[r.fftIndex] / 255;

            // Radius pulse (Scale)
            const scale = 1 + val * 0.5;
            r.mesh.scaling.set(scale, scale, scale);

            // Rotation
            r.mesh.rotation.z += 0.01 + val * 0.05;
        });
    }
};

export default template;

import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let points = [];
let t = 0;
// Lorenz Attractor Constants
const sigma = 10;
const rho = 28;
const beta = 8 / 3;

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.05, 1);

        const light = new BABYLON.PointLight("l", new BABYLON.Vector3(0, 0, 0), scene);
        light.intensity = 1;

        // Init Logo
        PLANE.init(scene, config);
        // Center it slightly offset 
        const logo = PLANE.getPlane();
        if (logo) {
            logo.position.y = 10;
            logo.position.z = -20;
            logo.scaling.setAll(10);
        }

        camera.setPosition(new BABYLON.Vector3(0, 0, -80));

        // We will render the attractor as a trail of instances or particles
        // Let's use instances of small cubes for a "digital" math look
        const box = BABYLON.MeshBuilder.CreateBox("root", { size: 0.8 }, scene);
        box.isVisible = false;

        // Instanced color
        box.registerInstancedBuffer("color", 4);
        box.instancedBuffers.color = new BABYLON.Color4(1, 1, 1, 1);

        const numPoints = 2000;
        points = [];

        let x = 0.1, y = 0, z = 0;

        // Pre-calculate an initial path to distribute points along the attractor
        for (let i = 0; i < numPoints; i++) {
            // Lorenz equations
            // dx/dt = sigma * (y - x)
            // dy/dt = x * (rho - z) - y
            // dz/dt = x * y - beta * z
            const dt = 0.01;
            const dx = sigma * (y - x);
            const dy = x * (rho - z) - y;
            const dz = x * y - beta * z;

            x += dx * dt;
            y += dy * dt;
            z += dz * dt;

            const instance = box.createInstance("i_" + i);
            instance.position.set(x, y, z - 25); // center z a bit

            points.push({
                mesh: instance,
                x: x, y: y, z: z,
                // Each point has a slight offset in simulation "time" or state
                // But for animation, we will flow them
                speedVal: Math.random()
            });
        }
    },

    render(fft, config) {
        // We want the whole structure to rotate
        t += 0.005;

        // Render Logo
        PLANE.render(fft);

        // Calculate Flow Speed from Volume
        let volume = 0;
        for (let i = 0; i < 50; i++) volume += fft[i];
        volume = (volume / 50) / 255;

        const dtBase = 0.005 + volume * 0.02; // Time step increases with volume

        // Update simulation for all points
        // To make it look like a flow, we just iterate the simulation for each point from its current position

        points.forEach((p, i) => {
            const dx = sigma * (p.y - p.x);
            const dy = p.x * (rho - p.z) - p.y;
            const dz = p.x * p.y - beta * p.z;

            p.x += dx * dtBase;
            p.y += dy * dtBase;
            p.z += dz * dtBase;

            p.mesh.position.set(p.x, p.y, p.z - 25);

            // Color based on speed/position and Audio
            // High Z usually means "far", let's map color to velocity or position
            const velocity = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const hue = (velocity * 2 + i * 0.1 + t * 50) % 360;

            // Audio reactive color pulse
            const fftVal = fft[i % 64] / 255; // chaotic mapping

            const r = 0.5 + 0.5 * Math.sin(t + i * 0.01);
            const g = fftVal;
            const b = 1.0 - fftVal;

            p.mesh.instancedBuffers.color = new BABYLON.Color4(r, g, b, 1);
        });

        // Orbit Camera slowly
        // Actually template usually has a fixed camera, let's rotate the root or points?
        // We'll rotate camera manually if needed, but existing templates set position.
        // Let's rotate the 'group' by rotating positions if we had a parent. 
        // Since instances have absolute positions, we can apply rotation matrix or just let the attractor be.
        // The attractor shape is 3D enough.
    }
};

export default template;

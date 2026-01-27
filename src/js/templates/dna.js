import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let pairs = [];
let t = 0;

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        scene.clearColor = new BABYLON.Color4(0.05, 0.0, 0.1, 1);

        const light = new BABYLON.HemisphericLight("l", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 1.0;

        // Init Logo
        PLANE.init(scene, config);
        // Center big logo to right/left? Or center.
        const logo = PLANE.getPlane();
        if (logo) {
            logo.scaling.setAll(10);
            logo.position.x = 20; // Offset
        }

        camera.setPosition(new BABYLON.Vector3(0, 0, -40));

        // Double Helix
        pairs = [];
        const count = 40;
        const heightTotal = 60;
        const radius = 5;
        const turns = 2;

        const sphereBase = BABYLON.MeshBuilder.CreateSphere("s", { diameter: 1 }, scene);
        sphereBase.isVisible = false;

        const linkBase = BABYLON.MeshBuilder.CreateCylinder("c", { diameter: 0.2, height: radius * 2 }, scene);
        linkBase.isVisible = false;
        linkBase.rotation.z = Math.PI / 2;

        const mat1 = new BABYLON.StandardMaterial("m1", scene);
        mat1.emissiveColor = new BABYLON.Color3(0, 1, 0.5);
        const mat2 = new BABYLON.StandardMaterial("m2", scene);
        mat2.emissiveColor = new BABYLON.Color3(1, 0, 0.5);
        const matLink = new BABYLON.StandardMaterial("ml", scene);
        matLink.emissiveColor = new BABYLON.Color3(1, 1, 1);

        for (let i = 0; i < count; i++) {
            const y = (i / count) * heightTotal - heightTotal / 2;
            const angle = (i / count) * Math.PI * 2 * turns;

            // Strand 1
            const s1 = sphereBase.createInstance("s1_" + i);
            s1.material = mat1;

            // Strand 2
            const s2 = sphereBase.createInstance("s2_" + i);
            s2.material = mat2;

            // Link
            const link = linkBase.createInstance("l_" + i);
            link.material = matLink;

            pairs.push({
                s1: s1,
                s2: s2,
                link: link,
                yBase: y,
                angleBase: angle,
                fftIndex: Math.floor((i / count) * 64)
            });
        }
    },

    render(fft, config) {
        t += 0.02;

        // Render Logo
        PLANE.render(fft);

        // Rotate DNA
        const rotSpeed = 0.5;

        pairs.forEach(p => {
            const val = fft[p.fftIndex] / 255;

            // Audio Twist
            const currentAngle = p.angleBase + t * rotSpeed + val * 0.5;

            // Expansion (Breathing)
            const currentRadius = 5 + val * 2;

            const x1 = Math.cos(currentAngle) * currentRadius;
            const z1 = Math.sin(currentAngle) * currentRadius;

            const x2 = Math.cos(currentAngle + Math.PI) * currentRadius;
            const z2 = Math.sin(currentAngle + Math.PI) * currentRadius;

            p.s1.position.set(x1, p.yBase, z1);
            p.s2.position.set(x2, p.yBase, z2);

            p.link.position.set(0, p.yBase, 0);
            p.link.rotation.y = -currentAngle; // Rotate cylinder to match spheres
            p.link.scaling.y = (currentRadius * 2) / (5 * 2); // Scale length (it's actually 'height' for cylinder on Y, but we rotated Z, so scaling Y stretches X axis local... wait. Cylinder height is Y. Rot Z 90 -> height is X world. So scaling Y scales length.)

            // Color Pulse
            p.s1.scaling.setAll(1 + val);
            p.s2.scaling.setAll(1 + val);
        });
    }
};

export default template;

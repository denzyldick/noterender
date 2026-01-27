import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let grid;
let t = 0;

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        scene.clearColor = new BABYLON.Color4(0.05, 0.0, 0.1, 1); // Vaporwave dark purple
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.015;
        scene.fogColor = new BABYLON.Color3(0.05, 0.0, 0.1);

        // Init Logo
        PLANE.init(scene, config);
        // Be the sun! Or in front of sun.
        const logo = PLANE.getPlane();
        if (logo) {
            logo.position.z = 80;
            logo.position.y = 10;
            logo.scaling.setAll(20);
        }

        camera.setPosition(new BABYLON.Vector3(0, 5, -30));
        camera.setTarget(new BABYLON.Vector3(0, 0, 50));

        // Sun
        const sun = BABYLON.MeshBuilder.CreateSphere("sun", { diameter: 40 }, scene);
        sun.position.z = 100;
        sun.position.y = 10;
        const sunMat = new BABYLON.StandardMaterial("sunM", scene);
        sunMat.emissiveColor = new BABYLON.Color3(1, 0.5, 0); // Orange/Red
        sunMat.disableLighting = true;
        sun.material = sunMat;

        // Grid
        const gridSize = 200;
        const subdivisions = 60;
        grid = BABYLON.MeshBuilder.CreateGround("g", { width: gridSize, height: gridSize, subdivisions: subdivisions, updatable: true }, scene);

        const mat = new BABYLON.StandardMaterial("m", scene);
        mat.wireframe = true;
        mat.emissiveColor = new BABYLON.Color3(0, 1, 1); // Neon Cyan
        mat.alpha = 0.5;
        grid.material = mat;

        this.grid = grid;
        this.sun = sun;
    },

    render(fft, config) {
        t += 0.05;

        // Render Logo
        PLANE.render(fft);

        if (!this.grid) return;

        // Animate Grid
        const positions = this.grid.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        if (!positions) return;

        let bass = 0;
        for (let i = 0; i < 10; i++) bass += fft[i];
        bass = bass / 10 / 255;

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2]; // Depth

            const phase = z * 0.2 + t * 2;

            // Rolling hills
            let y = Math.abs(x) > 10 ? Math.sin(x * 0.1) * 2 : 0; // Valley in middle

            // FFT displacement
            const zNorm = Math.abs(z) / 100;
            y += Math.sin(phase) * (bass * 5 * zNorm);

            positions[i + 1] = y - 5; // offset down
        }

        this.grid.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);

        // Sun Pulse
        const scale = 1 + bass * 0.2;
        this.sun.scaling.setAll(scale);
    }
};

export default template;

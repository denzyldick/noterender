import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let shards = [];
let t = 0;

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        scene.clearColor = new BABYLON.Color4(0.02, 0, 0.05, 1);

        // Multi-color lights
        const l1 = new BABYLON.PointLight("l1", new BABYLON.Vector3(20, 20, 20), scene);
        l1.diffuse = new BABYLON.Color3(1, 0, 1);
        const l2 = new BABYLON.PointLight("l2", new BABYLON.Vector3(-20, -10, 0), scene);
        l2.diffuse = new BABYLON.Color3(0, 1, 1);

        // Init Logo
        PLANE.init(scene, config);
        // Center big logo
        const logo = PLANE.getPlane();
        if (logo) {
            logo.scaling.setAll(15);
            logo.position.z = 10;
        }

        camera.setPosition(new BABYLON.Vector3(0, 0, -50));

        // Crystal Shards
        shards = [];
        const count = 50;

        const mat = new BABYLON.StandardMaterial("shardMat", scene);
        mat.alpha = 0.8;
        mat.specularColor = new BABYLON.Color3(1, 1, 1);
        mat.backFaceCulling = false;

        for (let i = 0; i < count; i++) {
            const type = Math.floor(Math.random() * 3);
            let mesh;
            if (type === 0) mesh = BABYLON.MeshBuilder.CreatePolyhedron("p" + i, { type: 1, size: 2 }, scene); // Tetra
            else if (type === 1) mesh = BABYLON.MeshBuilder.CreateCylinder("c" + i, { diameterTop: 0, diameterBottom: 2, height: 4, tessellation: 4 }, scene); // Pyramid
            else mesh = BABYLON.MeshBuilder.CreatePolyhedron("p" + i, { type: 2, size: 1.5 }, scene); // Octa

            mesh.material = mat;

            // Random pos
            mesh.position.set(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 20
            );
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

            shards.push({
                mesh: mesh,
                rotSpeed: new BABYLON.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05),
                fftIndex: Math.floor(Math.random() * 64)
            });
        }
    },

    render(fft, config) {
        t += 0.01;

        // Render Logo
        PLANE.render(fft);

        shards.forEach(s => {
            const val = fft[s.fftIndex] / 255;

            // Rotate
            s.mesh.rotation.addInPlace(s.rotSpeed.scale(1 + val * 5)); // Spin faster

            // Scale pulse
            const scale = 1 + val;
            s.mesh.scaling.set(scale, scale, scale);

            // Float
            s.mesh.position.y += Math.sin(t + s.mesh.position.x) * 0.05;
        });
    }
};

export default template;

import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let camera;
let sceneRef;
let buildings = [];
let props = []; // For streetlights, bus stops, etc.
let roadMarkings = [];
let smoothedFFT = [];
let road;
let roadMaterial;

const CONFIG = {
    rows: 40,
    cols: 20,
    streetWidth: 60,
    blockSize: 10,
    gap: 10,
    speed: 1.5,
    skyColor: new BABYLON.Color3(0.01, 0.01, 0.05),
    fogStart: 100,
    fogEnd: 500
};

const template = {
    init(c, r, nb, scene, width, height, d, config) {
        camera = c;
        sceneRef = scene;

        if (!camera) {
            console.error("Camera not provided to template init");
            return;
        }

        scene.ambientColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        scene.fogStart = CONFIG.fogStart;
        scene.fogEnd = CONFIG.fogEnd;
        scene.fogColor = CONFIG.skyColor;

        // Camera
        camera.position = new BABYLON.Vector3(0, 20, -60);
        camera.setTarget(new BABYLON.Vector3(0, 10, 100));

        // Lights
        const hemiLight = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
        hemiLight.intensity = 0.3;

        // Directional light simulating moon/city glow
        const dirLight = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(1, -2, 1), scene);
        dirLight.intensity = 0.5;

        // --- Logo (Plane) Setup ---
        // Smaller and lower as requested
        PLANE.setCoordinates(0, 6, 40);
        PLANE.setScale(4, 4, 1);
        PLANE.init(scene, config);

        // --- Road Setup ---
        // Static ground plane for the road base
        // We will animate the texture to simulate movement
        const roadWidth = CONFIG.streetWidth - 10;
        const roadDepth = 1000;
        road = BABYLON.MeshBuilder.CreateGround("road", { width: roadWidth, height: roadDepth }, scene);
        road.position.z = 200; // Extend forward

        roadMaterial = new BABYLON.StandardMaterial("roadMat", scene);
        roadMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        roadMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

        // Create a procedural road texture using dynamic texture or just simple color
        // To simulate movement without external image assets, we can use a repeating pattern
        // Or we can just use geometry for the markings (easier to control style).
        // Let's use geometry for markings (middle lines)
        road.material = roadMaterial;


        // -- Props Setup (Street Lights, Bus Stops, Road Lines) --
        props = [];

        // 1. Street Lamp Mesh (Instance Source)
        const lampMat = new BABYLON.StandardMaterial("lampMat", scene);
        lampMat.diffuseColor = BABYLON.Color3.Gray();

        const bulbMat = new BABYLON.StandardMaterial("bulbMat", scene);
        bulbMat.emissiveColor = new BABYLON.Color3(1, 0.9, 0.5); // Warm light
        bulbMat.diffuseColor = new BABYLON.Color3(1, 0.9, 0.5);

        const pole = BABYLON.MeshBuilder.CreateCylinder("pole", { height: 15, diameter: 0.5 }, scene);
        pole.material = lampMat;
        pole.position.y = 7.5;

        const arm = BABYLON.MeshBuilder.CreateBox("arm", { width: 4, height: 0.3, depth: 0.3 }, scene);
        arm.position.y = 14;
        arm.position.x = 2; // Overhang
        arm.material = lampMat;

        const bulb = BABYLON.MeshBuilder.CreateBox("bulb", { size: 1 }, scene);
        bulb.position.x = 3.5;
        bulb.position.y = 13.5;
        bulb.material = bulbMat;

        // Merge into one mesh for instancing
        const streetLamp = BABYLON.Mesh.MergeMeshes([pole, arm, bulb], true, true, undefined, false, true);
        streetLamp.isVisible = false;


        // 2. Bus Stop Mesh
        const busStopMat = new BABYLON.StandardMaterial("busStopMat", scene);
        busStopMat.diffuseColor = BABYLON.Color3.Teal();

        const bsWall = BABYLON.MeshBuilder.CreateBox("bsWall", { width: 0.5, height: 6, depth: 4 }, scene);
        bsWall.position.y = 3;
        bsWall.position.x = -2;

        const bsRoof = BABYLON.MeshBuilder.CreateBox("bsRoof", { width: 5, height: 0.2, depth: 5 }, scene);
        bsRoof.position.y = 6;

        const bsSeat = BABYLON.MeshBuilder.CreateBox("bsSeat", { width: 1, height: 1, depth: 4 }, scene);
        bsSeat.position.y = 0.5;

        const busStop = BABYLON.Mesh.MergeMeshes([bsWall, bsRoof, bsSeat], true, true, undefined, false, true);
        busStop.material = busStopMat;
        busStop.isVisible = false;


        // 3. Road Stripe
        const stripeMat = new BABYLON.StandardMaterial("stripeMat", scene);
        stripeMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        const stripeBase = BABYLON.MeshBuilder.CreatePlane("stripe", { width: 1, height: 8 }, scene);
        stripeBase.rotation.x = Math.PI / 2;
        stripeBase.material = stripeMat;
        stripeBase.isVisible = false;


        // --- Spawn Loop for Props & Buildings ---
        buildings = [];

        const matBuilding = new BABYLON.StandardMaterial("matBuilding", scene);
        matBuilding.diffuseColor = new BABYLON.Color3(1, 1, 1); // White to allow instance color to show efficiently
        matBuilding.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Reduced emissive so it doesn't wash out
        matBuilding.specularColor = new BABYLON.Color3(1, 1, 1); // Sharp vivid spectral

        const baseBox = BABYLON.MeshBuilder.CreateBox("baseBox", { size: 1 }, scene);
        baseBox.material = matBuilding;
        baseBox.isVisible = false;


        // Grid generation
        // We extend the grid deeper to ensure seamless scrolling
        const gridRows = CONFIG.rows;
        const segmentSize = CONFIG.blockSize + CONFIG.gap;

        // Register instanced buffer for color
        baseBox.registerInstancedBuffer("color", 4);
        baseBox.instancedBuffers.color = new BABYLON.Color4(0.1, 0.1, 0.2, 1); // Default

        for (let row = 0; row < gridRows; row++) {
            const zPos = row * segmentSize - 50;

            // 1. Buildings
            for (let col = 0; col < CONFIG.cols; col++) {
                const halfCols = CONFIG.cols / 2;
                let x = 0;

                // Split into left and right banks
                if (col < halfCols) {
                    x = -(CONFIG.streetWidth / 2) - (halfCols - col) * segmentSize;
                } else {
                    x = (CONFIG.streetWidth / 2) + (col - halfCols + 1) * segmentSize;
                }

                const instance = baseBox.createInstance("b_" + row + "_" + col);
                instance.position.x = x;
                instance.position.z = zPos;
                instance.position.y = 0;

                // Init Color
                instance.instancedBuffers.color = new BABYLON.Color4(0.05, 0.05, 0.1, 1);

                buildings.push({
                    mesh: instance,
                    fftIndex: Math.floor(Math.random() * 64)
                });
            }

            // 2. Street Lights (Every 4 rows approx 80 units)
            if (row % 4 === 0) {
                // Left Light
                const leftLamp = streetLamp.createInstance("lamp_l_" + row);
                leftLamp.position.x = - (CONFIG.streetWidth / 2) - 2;
                leftLamp.position.z = zPos;
                // Rotate to face road
                leftLamp.rotation.y = Math.PI; // Face right
                props.push(leftLamp);

                // Right Light
                const rightLamp = streetLamp.createInstance("lamp_r_" + row);
                rightLamp.position.x = (CONFIG.streetWidth / 2) + 2;
                rightLamp.position.z = zPos;

                leftLamp.rotation.y = 0;
                rightLamp.rotation.y = Math.PI;

                props.push(rightLamp);
            }

            // 3. Bus Stops (Every 15 rows, alternating sides)
            if (row % 15 === 0) {
                const xPos = (row % 30 === 0) ? (CONFIG.streetWidth / 2) + 8 : -(CONFIG.streetWidth / 2) - 8;
                const stop = busStop.createInstance("busstop_" + row);
                stop.position.x = xPos;
                stop.position.z = zPos;
                stop.rotation.y = (xPos > 0) ? -Math.PI / 2 : Math.PI / 2; // Face the road
                props.push(stop);
            }

            // 4. Road Stripes (Center Line)
            // Every row (frequency)
            if (row % 2 === 0) {
                const stripe = stripeBase.createInstance("stripe_" + row);
                stripe.position.x = 0;
                stripe.position.y = 0.1; // Just above road
                stripe.position.z = zPos;
                props.push(stripe);
            }
        }
    },

    render(fft, config) {
        if (!fft) return;

        // Init smoothedFFT
        if (!smoothedFFT || smoothedFFT.length !== fft.length) {
            smoothedFFT = new Array(fft.length).fill(0);
        }
        const smoothingFactor = 0.15;
        for (let i = 0; i < fft.length; i++) {
            smoothedFFT[i] = smoothedFFT[i] + (fft[i] - smoothedFFT[i]) * smoothingFactor;
        }

        // Render Logo
        PLANE.render(fft);

        // Animate Logo bob & Clamp Size
        const logo = PLANE.getPlane();
        if (logo) {
            const time = performance.now() * 0.001;
            logo.position.y = 8 + Math.sin(time * 2) * 0.5;

            // Clamp size to avoid hitting buildings
            const maxSize = 20;
            if (logo.scaling.x > maxSize) {
                const scale = maxSize / logo.scaling.x;
                logo.scaling.x = maxSize;
                logo.scaling.y = logo.scaling.y * scale;
            }
            if (logo.scaling.y > maxSize) logo.scaling.y = maxSize;
        }

        // Scroll Logic
        const scrollSpeed = CONFIG.speed;
        const segmentSize = CONFIG.blockSize + CONFIG.gap;
        const totalDepth = CONFIG.rows * segmentSize;
        const resetZ = -100; // Point where objects wrap around
        const startZ = (CONFIG.rows * segmentSize) - 100 - segmentSize; // Approximate start point for wrapping

        // Move Buildings
        buildings.forEach((b) => {
            b.mesh.position.z -= scrollSpeed;
            if (b.mesh.position.z < resetZ) {
                b.mesh.position.z += totalDepth;
            }

            // FFT Audio React
            const val = smoothedFFT[b.fftIndex] || 0;
            const targetHeight = 5 + (val / 255) * 80;
            b.mesh.scaling.y = targetHeight;
            b.mesh.scaling.x = CONFIG.blockSize;
            b.mesh.scaling.z = CONFIG.blockSize;
            b.mesh.position.y = targetHeight / 2;

            // Color Reaction - INTENSE NEON
            const intensity = val / 255;

            // Amp up the intensity curve
            const boosted = Math.min(1, intensity * 1.5); // Reach max brightness earlier

            // Vibrant Neon Scheme (Pink/Purple/Cyan mix)
            const r = boosted * 1.5; // push towards red/pink
            const g = boosted * 0.2; // keep green low for purple tint
            const bCol = 0.2 + boosted * 1.5; // push blue

            b.mesh.instancedBuffers.color = new BABYLON.Color4(r, g, bCol, 1);
        });

        // Move Props (Lights, Bus Stops, Stripes)
        // All props created in the loop share the same Z periodicity
        props.forEach((prop) => {
            prop.position.z -= scrollSpeed;
            if (prop.position.z < resetZ) {
                prop.position.z += totalDepth;
            }
        });
    }
};

export default template;

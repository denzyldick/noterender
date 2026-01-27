import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let stars = [];
let t = 0;

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        // Scene setup
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        // Light
        const light = new BABYLON.PointLight("omni", new BABYLON.Vector3(0, 0, 0), scene);
        light.diffuse = new BABYLON.Color3(1, 0.8, 0.6);
        light.intensity = 1.5;

        // Init Logo
        PLANE.init(scene, config);
        // Center it
        const logo = PLANE.getPlane();
        if (logo) {
            logo.position.y = 0;
            logo.scaling.setAll(20);
        }

        // Camera adjustment
        camera.setPosition(new BABYLON.Vector3(0, 100, -200));
        camera.setTarget(BABYLON.Vector3.Zero());

        // Create Galaxy Particles
        // Use a solid particle system for performance with thousands of stars
        const starMaterial = new BABYLON.StandardMaterial("starMat", scene);
        starMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        starMaterial.disableLighting = true;

        const sps = new BABYLON.SolidParticleSystem("sps", scene);
        const starShape = BABYLON.MeshBuilder.CreateSphere("s", { diameter: 1, segments: 2 }, scene);

        // Galaxy Parameters
        const numStars = 4000;
        const arms = 3;
        const armSpread = 0.5;
        const coreRadius = 10;
        const maxRadius = 150;

        sps.addShape(starShape, numStars);
        starShape.dispose();

        const mesh = sps.buildMesh();
        mesh.material = starMaterial;

        // Initialize particles in spiral
        sps.initParticles = () => {
            for (let p = 0; p < sps.nbParticles; p++) {
                const particle = sps.particles[p];

                // Random distance from center, favoring core
                const r = Math.pow(Math.random(), 3) * maxRadius + coreRadius;

                // Spiral angle + random spread
                const spiralAngle = p % arms * (2 * Math.PI / arms);
                const theta = spiralAngle + (r * 0.1) + (Math.random() - 0.5) * armSpread;

                // Random height deviation
                const y = (Math.random() - 0.5) * (maxRadius - r) * 0.2;

                particle.position.x = r * Math.cos(theta);
                particle.position.z = r * Math.sin(theta);
                particle.position.y = y;

                // Store original data for animation
                particle.props = {
                    r: r,
                    theta: theta,
                    y: y,
                    speed: 0.001 + Math.random() * 0.005
                };

                // Color based on radius (Hot core, cold edges)
                const colorRatio = 1 - (r / maxRadius);
                particle.color = new BABYLON.Color4(
                    0.5 + colorRatio * 0.5,
                    0.5 + colorRatio * 0.3,
                    0.8 + colorRatio * 0.2,
                    1
                );

                particle.scale = new BABYLON.Vector3(
                    0.5 + Math.random(),
                    0.5 + Math.random(),
                    0.5 + Math.random()
                );
            }
        };

        sps.initParticles();
        sps.setParticles();

        this.sps = sps;
    },

    render(fft, config) {
        if (!this.sps) return;

        t += 0.01;

        // Render Logo
        PLANE.render(fft);

        // Analyze FFT
        // Bass (0-10) -> Core Scale/Pulse
        // Mids -> Rotation Speed
        // Highs -> Sparkling individual stars

        let bass = 0;
        for (let i = 0; i < 10; i++) bass += fft[i];
        bass = (bass / 10) / 255; // 0.0 - 1.0

        let mid = 0;
        for (let i = 20; i < 60; i++) mid += fft[i];
        mid = (mid / 40) / 255;

        // Update particles
        for (let p = 0; p < this.sps.nbParticles; p++) {
            const particle = this.sps.particles[p];
            const props = particle.props;

            // Rotation
            const rotationSpeed = props.speed * (1 + mid * 5); // Speed up with music
            props.theta += rotationSpeed;

            particle.position.x = props.r * Math.cos(props.theta);
            particle.position.z = props.r * Math.sin(props.theta);

            // Pulse height with bass
            particle.position.y = props.y * (1 + bass * 2);

            // Core glow/expansion
            if (props.r < 30) {
                const scale = 1 + bass * 3;
                particle.scale.x = scale;
                particle.scale.y = scale;
                particle.scale.z = scale;
            } else {
                // Random twinkle for outer stars based on high freq index
                const fftIndex = Math.floor((p / this.sps.nbParticles) * 128);
                const val = fft[fftIndex] / 255;
                const targetScale = 1 + val * 2;
                particle.scale.x = targetScale;
                particle.scale.y = targetScale;
                particle.scale.z = targetScale;
            }
        }

        this.sps.setParticles();
    }
};

export default template;

import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let particles = [];
let t = 0;

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        // Init Logo
        PLANE.init(scene, config);
        // Center it. Since sphere flow is around radius 10, let's put it inside if transparent or make it huge outside.
        // Let's make it float above.
        const logo = PLANE.getPlane();
        if (logo) {
            logo.position.y = 20;
            logo.scaling.setAll(10);
        }

        camera.setPosition(new BABYLON.Vector3(0, 0, -30));

        // SPS for Sphere Flow
        const box = BABYLON.MeshBuilder.CreateBox("b", { size: 0.2 }, scene);
        const sps = new BABYLON.SolidParticleSystem("sps", scene);
        sps.addShape(box, 3000);
        box.dispose();

        const mesh = sps.buildMesh();
        const mat = new BABYLON.StandardMaterial("m", scene);
        mat.emissiveColor = new BABYLON.Color3(0.5, 0.8, 1);
        mesh.material = mat;

        const r = 10;

        sps.initParticles = () => {
            for (let p = 0; p < sps.nbParticles; p++) {
                const particle = sps.particles[p];

                // Random point on sphere
                // theta [0, PI], phi [0, 2PI]
                // Uniform distribution requires acos
                const u = Math.random();
                const v = Math.random();
                const theta = 2 * Math.PI * u;
                const phi = Math.acos(2 * v - 1);

                particle.position.x = r * Math.sin(phi) * Math.cos(theta);
                particle.position.y = r * Math.sin(phi) * Math.sin(theta);
                particle.position.z = r * Math.cos(phi);

                particle.velocity = {
                    theta: theta,
                    phi: phi
                };

                // Initial random color
                particle.color = new BABYLON.Color4(Math.random(), Math.random(), 1, 1);
            }
        };

        sps.initParticles();
        sps.setParticles();

        this.sps = sps;
        this.radius = r;
    },

    render(fft, config) {
        t += 0.01;

        // Render Logo
        PLANE.render(fft);

        if (!this.sps) return;

        const r = this.radius;

        this.sps.particles.forEach((p, i) => {
            // Flow field logic
            // Move along phi/theta based on noise or math function
            // Curl noise simulation simplified:
            // dTheta = sin(phi * 5 + t)
            // dPhi = cos(theta * 5 + t)

            const noise = Math.sin(p.velocity.phi * 3 + t) * Math.cos(p.velocity.theta * 3 + t);

            // Speed modulated by FFT
            const val = fft[i % 64] / 255;
            const speed = 0.02 + val * 0.05;

            p.velocity.theta += speed;
            p.velocity.phi += speed * noise;

            // Update Position
            p.position.x = r * Math.sin(p.velocity.phi) * Math.cos(p.velocity.theta);
            p.position.y = r * Math.sin(p.velocity.phi) * Math.sin(p.velocity.theta);
            p.position.z = r * Math.cos(p.velocity.phi);

            // Pulse out
            const flowR = r + val * 2;
            p.position.scaleInPlace(flowR / r);

            // Color
            p.color.r = val;
            p.color.g = 1 - val;
        });

        this.sps.setParticles();
    }
};

export default template;

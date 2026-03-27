import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let sun;
let vls;
let asteroids;
let sceneRef;
let t = 0;

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        sceneRef = scene;
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        const primary = new BABYLON.Color3(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        const accent = new BABYLON.Color3(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Camera ---
        camera.setPosition(new BABYLON.Vector3(0, 0, -600));
        camera.setTarget(BABYLON.Vector3.Zero());

        // --- Logo ---
        PLANE.setScale(150, 150);
        PLANE.setCoordinates(0, 0, 0);
        PLANE.init(scene, config);
        const logoPlane = PLANE.getPlane();
        if (logoPlane) {
            logoPlane.renderingGroupId = 1; // Ensure logo is ALWAYS in front
            logoPlane.position.z = -10; // Move slightly forward
        }

        // --- Central Sun ---
        sun = BABYLON.MeshBuilder.CreateSphere("sun", { segments: 32, diameter: 120 }, scene);
        const sunMat = new BABYLON.StandardMaterial("sunMat", scene);
        sunMat.emissiveColor = primary;
        sunMat.disableLighting = true;
        sun.material = sunMat;
        sun.renderingGroupId = 0;

        // --- Volumetric Rays ---
        vls = new BABYLON.VolumetricLightScatteringPostProcess('vls', 1.0, camera, sun, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, renderer, false);
        vls.exposure = 0.2;
        vls.decay = 0.95;
        vls.weight = 0.8;
        vls.density = 0.5;

        // --- Asteroid Belt ---
        asteroids = new BABYLON.SolidParticleSystem("asteroids", scene);
        const rock = BABYLON.MeshBuilder.CreatePolyhedron("rock", { type: 1, size: 5 }, scene);
        asteroids.addShape(rock, 300);
        rock.dispose();
        const asterMesh = asteroids.buildMesh();
        asterMesh.material = new BABYLON.StandardMaterial("asterMat", scene);
        asterMesh.material.emissiveColor = accent.scale(0.5);
        asterMesh.material.disableLighting = true;
        asterMesh.renderingGroupId = 0;

        asteroids.initParticles = () => {
            for (let p = 0; p < asteroids.nbParticles; p++) {
                const part = asteroids.particles[p];
                const angle = Math.random() * Math.PI * 2;
                const radius = 280 + Math.random() * 180;
                part.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 80, Math.sin(angle) * radius);
                part.rotation.set(Math.random(), Math.random(), Math.random());
                // Slower base speed
                part.props = { angle, radius, speed: 0.002 + Math.random() * 0.005 };
            }
        };
        asteroids.initParticles();
        asteroids.setParticles();

        if (!scene.glowLayer) new BABYLON.GlowLayer("glow", scene);
    },

    render(fft, config) {
        t += 0.005; // Slower time progression
        let bass = 0;
        for (let i = 0; i < 10; i++) bass += fft[i];
        bass = (bass / 10) / 255;

        let treble = 0;
        for (let i = fft.length - 20; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20) / 255;

        PLANE.render(fft);

        let primary, accent;
        if (config.dynamicColors) {
            primary = new BABYLON.Color3(bass, 0.4, 1 - bass);
            accent = new BABYLON.Color3(1 - treble, treble, 0.5);
        } else {
            primary = new BABYLON.Color3(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            accent = new BABYLON.Color3(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (sun) {
            const s = 1.0 + bass * 0.4;
            sun.scaling.set(s, s, s);
            sun.material.emissiveColor.set(primary.r * (0.8 + bass * 0.2), primary.g * (0.8 + bass * 0.2), primary.b * (0.8 + bass * 0.2));
            vls.exposure = 0.05 + bass * 0.3;
        }

        if (asteroids) {
            for (let p = 0; p < asteroids.nbParticles; p++) {
                const part = asteroids.particles[p];
                // Orbit moves with music
                part.props.angle += part.props.speed * (1 + bass * 8);
                part.position.x = Math.cos(part.props.angle) * part.props.radius;
                part.position.z = Math.sin(part.props.angle) * part.props.radius;
                
                // Spin with treble
                part.rotation.y += 0.01 * (1 + treble * 5);
                
                // Scale pulse
                const pScale = 1 + bass * 1.5;
                part.scaling.set(pScale, pScale, pScale);
            }
            asteroids.setParticles();
            asteroids.mesh.material.emissiveColor.set(accent.r * (0.5 + bass), accent.g * (0.5 + bass), accent.b * (0.5 + bass));
        }
    }
};

export default template;

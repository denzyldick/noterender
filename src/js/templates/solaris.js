import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sun;
let vls;
let asteroids;
let sceneRef;
let t = 0;
let currentCamera;

// Pre-allocated objects
const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;
        
        // Claim the camera exclusively
        CAMERA_PHYSICS.lock();

        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Camera ---
        if (camera) {
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.setPosition(new BABYLON.Vector3(0, 0, -400));
        }

        // --- Logo ---
        PLANE.setScale(150, 150);
        PLANE.setCoordinates(0, 0, 0);
        PLANE.init(scene, config);
        const logoPlane = PLANE.getPlane();
        if (logoPlane) {
            logoPlane.renderingGroupId = 1;
            logoPlane.position.z = -10; 
        }

        // --- Central Sun ---
        sun = BABYLON.MeshBuilder.CreateSphere("sun", { segments: 32, diameter: 120 }, scene);
        const sunMat = new BABYLON.StandardMaterial("sunMat", scene);
        sunMat.emissiveColor.copyFrom(_primaryColor);
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
        asterMesh.material.emissiveColor = _accentColor.scale(0.5);
        asterMesh.material.disableLighting = true;
        asterMesh.renderingGroupId = 0;

        asteroids.initParticles = () => {
            for (let p = 0; p < asteroids.nbParticles; p++) {
                const part = asteroids.particles[p];
                const angle = Math.random() * Math.PI * 2;
                const radius = 280 + Math.random() * 180;
                part.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 80, Math.sin(angle) * radius);
                part.rotation.set(Math.random(), Math.random(), Math.random());
                part.props = { angle, radius, speed: 0.002 + Math.random() * 0.005 };
            }
        };
        asteroids.initParticles();
        asteroids.setParticles();

        if (!scene.glowLayer) new BABYLON.GlowLayer("glow", scene);
    },

    render(fft, config) {
        if (!fft) fft = new Uint8Array(256).fill(0);
        t += 0.005;
        let bass = 0;
        const bassEnd = Math.min(fft.length, 10);
        for (let i = 0; i < bassEnd; i++) bass += fft[i];
        bass = (bass / bassEnd) / 255;

        let treble = 0;
        const trebleStart = Math.max(0, fft.length - 20);
        for (let i = trebleStart; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20) / 255;

        PLANE.render(fft, config);

        if (config.dynamicColors) {
            _primaryColor.set(bass, 0.4, 1 - bass);
            _accentColor.set(1 - treble, treble, 0.5);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (sun) {
            const s = 1.0 + bass * 0.4;
            sun.scaling.set(s, s, s);
            sun.material.emissiveColor.set(_primaryColor.r * (0.8 + bass * 0.2), _primaryColor.g * (0.8 + bass * 0.2), _primaryColor.b * (0.8 + bass * 0.2));
            vls.exposure = 0.05 + bass * 0.3;
        }

        if (currentCamera) {
            currentCamera.setTarget(BABYLON.Vector3.Zero());
            
            if (config.options && config.options.camera && config.options.camera.move) {
                const orbitRadius = 15 * bass;
                const orbitSpeed = t * 0.3;
                currentCamera.position.x = Math.cos(orbitSpeed) * orbitRadius;
                currentCamera.position.y = Math.sin(orbitSpeed) * orbitRadius;
            } else {
                currentCamera.position.x = 0;
                currentCamera.position.y = 0;
            }
        }

        if (asteroids) {
            for (let p = 0; p < asteroids.nbParticles; p++) {
                const part = asteroids.particles[p];
                part.props.angle += part.props.speed * (1 + bass * 8);
                part.position.x = Math.cos(part.props.angle) * part.props.radius;
                part.position.z = Math.sin(part.props.angle) * part.props.radius;
                part.rotation.y += 0.01 * (1 + treble * 5);
                const pScale = 1 + bass * 1.5;
                part.scaling.set(pScale, pScale, pScale);
            }
            asteroids.setParticles();
            asteroids.mesh.material.emissiveColor.set(_accentColor.r * (0.5 + bass), _accentColor.g * (0.5 + bass), _accentColor.b * (0.5 + bass));
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
    }
};

export default template;

import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let ground;
let sun;
let sunMat;
let digitalAurora;
let t = 0;
let currentCamera;

// Pre-allocated objects for performance
const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const _tempVec3 = new BABYLON.Vector3();
const _tempColor4 = new BABYLON.Color4(1, 1, 1, 1);

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        currentCamera = camera;
        t = 0;
        
        // Claim the camera exclusively
        CAMERA_PHYSICS.lock();

        scene.clearColor = new BABYLON.Color4(0.01, 0.01, 0.05, 1);
        
        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Retro Atmosphere ---
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.004;
        scene.fogColor.set(0.1, 0, 0.2);

        // --- Logo ---
        PLANE.setScale(120, 120);
        PLANE.setCoordinates(0, 0, 0);
        PLANE.init(scene, config);

        // --- Digital Aurora Background ---
        digitalAurora = new BABYLON.SolidParticleSystem("aurora", scene);
        const ribbonShape = BABYLON.MeshBuilder.CreatePlane("r", { width: 2000, height: 5 }, scene);
        digitalAurora.addShape(ribbonShape, 50);
        ribbonShape.dispose();
        const auroraMesh = digitalAurora.buildMesh();
        auroraMesh.material = new BABYLON.StandardMaterial("auroraMat", scene);
        auroraMesh.material.emissiveColor.copyFrom(_accentColor);
        auroraMesh.material.alpha = 0.3;
        auroraMesh.material.disableLighting = true;

        digitalAurora.initParticles = () => {
            for (let p = 0; p < digitalAurora.nbParticles; p++) {
                const part = digitalAurora.particles[p];
                part.position.set(0, 200 + p * 10, 800);
                part.props = { offset: p * 0.2 };
            }
        };
        digitalAurora.initParticles();
        digitalAurora.setParticles();

        // --- Giant Retro Sun ---
        sun = BABYLON.MeshBuilder.CreateDisc("sun", { radius: 120, tessellation: 64 }, scene);
        sun.isVisible = false; 
        sun.position.z = 600;
        sun.position.y = 100;
        sunMat = new BABYLON.StandardMaterial("sunMat", scene);
        sunMat.emissiveColor.copyFrom(_primaryColor);
        sunMat.disableLighting = true;
        sun.material = sunMat;

        // --- Camera ---
        if (camera) {
            camera.setTarget(new BABYLON.Vector3(0, 0, 0));
            camera.setPosition(new BABYLON.Vector3(0, 60, -320));
        }

        // --- Moving Terrain ---
        ground = BABYLON.MeshBuilder.CreateGround("g", { width: 3000, height: 3000, subdivisions: 256, updatable: true }, scene);
        const mat = new BABYLON.StandardMaterial("m", scene);
        mat.wireframe = true;
        mat.emissiveColor.copyFrom(_primaryColor);
        ground.material = mat;

        if (!scene.glowLayer) new BABYLON.GlowLayer("glow", scene);
    },

    getFFT(fft, idx) {
        if (!fft || fft.length === 0) return 0;
        const i = Math.min(Math.floor(idx), fft.length - 1);
        return fft[i] || 0;
    },

    render(fft, config) {
        if (!fft) fft = new Uint8Array(256).fill(0);
        t += 0.005;
        PLANE.render(fft, config);

        let bass = 0;
        const bassEnd = Math.min(fft.length, 10);
        for (let i = 0; i < bassEnd; i++) bass += fft[i];
        bass = (bass / bassEnd) / 255;

        let treble = 0;
        const tStart = Math.max(0, fft.length - 20);
        for (let i = tStart; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20) / 255;

        if (config.dynamicColors) {
            const baseHue = (t * 0.1) % 1; 
            const pRGB = this.hslToRgb(baseHue, 0.8, 0.5 + bass * 0.2);
            const aRGB = this.hslToRgb((baseHue + 0.4) % 1, 0.9, 0.4 + treble * 0.3);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (digitalAurora) {
            _tempColor4.set(_accentColor.r, _accentColor.g, _accentColor.b, 0.4);
            for (let p = 0; p < digitalAurora.nbParticles; p++) {
                const part = digitalAurora.particles[p];
                part.position.x = Math.sin(t * 2 + part.props.offset) * 200;
                part.rotation.z = Math.cos(t + part.props.offset) * 0.2;
                part.scaling.y = 1 + bass * 8;
                part.color.copyFrom(_tempColor4);
            }
            digitalAurora.setParticles();
        }

        if (sunMat) {
            sun.scaling.setAll(1.0 + bass * 0.4);
            sunMat.emissiveColor.set(_primaryColor.r * (0.8 + bass * 0.2), _primaryColor.g * (0.2 + bass * 0.8), _primaryColor.b * 0.2);
        }

        if (currentCamera) {
            currentCamera.setTarget(new BABYLON.Vector3(0, 0, 0));
            
            if (config.options && config.options.camera && config.options.camera.move) {
                const orbitRadius = 15 * bass;
                const orbitSpeed = t * 0.2;
                currentCamera.position.x = Math.cos(orbitSpeed) * orbitRadius;
                currentCamera.position.y = 60 + Math.sin(orbitSpeed) * orbitRadius;
            } else {
                currentCamera.position.x = 0;
                currentCamera.position.y = 60;
            }
        }

        const positions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        if (positions) {
            for (let i = 0; i < positions.length; i += 3) {
                const xVal = positions[i];
                const zVal = positions[i + 2];
                const zMod = (zVal + t * 400) % 3000 - 1500;
                
                let fftIndex = 0;
                let waveFreq = 0.02;
                let waveSpeed = 2;
                let baseAmp = 40;

                if (xVal < -400) {
                    fftIndex = Math.floor(Math.abs(xVal / 100)) % 15; 
                    waveFreq = 0.012; waveSpeed = 1.2; baseAmp = 55;
                } else if (xVal > 400) {
                    fftIndex = 80 + (Math.floor(Math.abs(xVal / 20)) % 40);
                    waveFreq = 0.06; waveSpeed = 4; baseAmp = 25;
                } else {
                    fftIndex = 20 + (Math.floor(Math.abs(xVal / 40)) % 50);
                    waveFreq = 0.03; waveSpeed = 2.5; baseAmp = 38;
                }
                
                const amplitude = this.getFFT(fft, fftIndex) / 255;
                let y = Math.sin(xVal * waveFreq + t * waveSpeed) * Math.cos(zMod * waveFreq) * amplitude * baseAmp;
                y += bass * 15;
                y = Math.min(y, 45);
                positions[i + 1] = y;
            }
            ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        }
        ground.material.emissiveColor.set(_primaryColor.r * (0.5+bass), _primaryColor.g * (0.5+bass), _primaryColor.b * (0.5+bass));
    },

    hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) { r = g = b = l; } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1; if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
        }
        return { r, g, b };
    },

    dispose() {
        currentCamera = null;
    }
};

export default template;

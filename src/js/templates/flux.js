import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let fluidMesh;
let fluidMat;
let drips;
let currentTemplateConfig = {};

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const _tempVec3 = new BABYLON.Vector3();

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;

        const templateData = config.templates.find(td => td.name === 'flux');
        currentTemplateConfig = templateData ? templateData.currentConfig : {};

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 40, -280);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.radius = 280;
            camera.alpha = -Math.PI / 2;
            camera.beta = Math.PI / 2.4;
        }

        scene.clearColor = new BABYLON.Color4(0.01, 0.01, 0.03, 1);
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.002;
        scene.fogColor = new BABYLON.Color3(0.02, 0.02, 0.05);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        PLANE.setScale(80, 80);
        PLANE.setCoordinates(0, -10, 0);
        PLANE.init(scene, config);

        fluidMat = new BABYLON.StandardMaterial("fluidMat", scene);
        fluidMat.emissiveColor = _primaryColor.clone();
        fluidMat.specularColor = _accentColor.clone();
        fluidMat.specularPower = 64;
        fluidMat.disableLighting = true;

        fluidMesh = BABYLON.MeshBuilder.CreateDisc("fluid", {
            radius: 160,
            tessellation: 96,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE,
            updatable: true
        }, scene);
        fluidMesh.rotation.x = -Math.PI / 2;
        fluidMesh.material = fluidMat;

        const dripBox = BABYLON.MeshBuilder.CreateBox("d", { size: 1 }, scene);
        drips = new BABYLON.SolidParticleSystem("drips", scene, { updatable: true });
        drips.addShape(dripBox, 150);
        dripBox.dispose();
        const dripMesh = drips.buildMesh();
        dripMesh.material = new BABYLON.StandardMaterial("dripMat", scene);
        dripMesh.material.emissiveColor = _accentColor.clone();
        dripMesh.material.disableLighting = true;

        drips.initParticles = () => {
            for (let p = 0; p < drips.nbParticles; p++) {
                const part = drips.particles[p];
                this.resetDrip(part);
            }
        };
        drips.initParticles();
        drips.setParticles();

        if (!scene.glowLayer) {
            new BABYLON.GlowLayer("glow", scene).intensity = 1.8;
        }
    },

    resetDrip(part) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * 140;
        part.position.set(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
        );
        part.props = {
            speed: 0.5 + Math.random() * 2,
            angle: angle,
            radius: radius,
            offset: Math.random() * 100
        };
        part.scaling.setAll(1 + Math.random() * 2);
    },

    render(fft, config) {
        if (!fft || !fft.length) fft = new Uint8Array(256).fill(0);
        t += 0.01;
        PLANE.render(fft, config);

        const boost = config.sensitivity ? config.sensitivity.bassBoost : 1.0;
        let bass = 0;
        for (let i = 0; i < 10; i++) bass += fft[i];
        bass = (bass / 10 / 255) * boost;
        const pBass = Math.pow(bass, 1.5);

        let treble = 0;
        for (let i = fft.length - 25; i < fft.length; i++) treble += fft[i];
        treble = (treble / 25 / 255) * boost;

        if (config.dynamicColors) {
            const hue = (t * 0.06) % 1;
            const pRGB = hslToRgb(hue, 0.6, 0.5 + bass * 0.3);
            const aRGB = hslToRgb((hue + 0.4) % 1, 0.7, 0.6 + treble * 0.3);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (fluidMesh) {
            const positions = fluidMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            if (positions) {
                const waveAmp = 8 + pBass * 20;
                for (let i = 0; i < positions.length; i += 3) {
                    const x = positions[i];
                    const z = positions[i + 2];
                    const dist = Math.sqrt(x * x + z * z);
                    const angle = Math.atan2(z, x);
                    const wave = Math.sin(dist * 0.04 - t * 3 + angle * 2) * 0.5 +
                                 Math.sin(dist * 0.08 + t * 2 + angle * 4) * 0.3 +
                                 Math.sin(dist * 0.012 + t * 1.5) * 0.2;
                    positions[i + 1] = wave * waveAmp;
                }
                fluidMesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
                fluidMesh.refreshBoundingInfo();
            }

            const hueShift = 0.5 + Math.sin(t * 0.5) * 0.1;
            fluidMat.emissiveColor.set(
                _primaryColor.r * (0.3 + pBass * 1.5),
                _primaryColor.g * (0.3 + pBass * 1.2),
                _primaryColor.b * (0.3 + pBass * 1.5)
            );
            fluidMat.specularColor.set(
                _accentColor.r * (0.5 + pBass * 2),
                _accentColor.g * (0.5 + pBass * 2),
                _accentColor.b * (0.5 + pBass * 2)
            );
            const scale = 1 + pBass * 0.15;
            fluidMesh.scaling.set(scale, scale, scale);
        }

        if (drips) {
            for (let p = 0; p < drips.nbParticles; p++) {
                const part = drips.particles[p];
                part.position.y -= part.props.speed * (1 + bass * 3);
                part.props.angle += 0.01;
                part.position.x = Math.cos(part.props.angle) * part.props.radius;
                part.position.z = Math.sin(part.props.angle) * part.props.radius;
                part.color.set(
                    _accentColor.r,
                    _accentColor.g,
                    _accentColor.b,
                    Math.max(0, (part.position.y + 100) / 120)
                );
                if (part.position.y < -100) {
                    this.resetDrip(part);
                }
            }
            drips.setParticles();
        }

        if (currentCamera) {
            currentCamera.radius = 280 - pBass * 80;
            currentCamera.beta = Math.PI / 2.4 + Math.sin(t * 0.3) * 0.1;
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
    }
};

function hslToRgb(h, s, l) {
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
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r, g, b };
}

export default template;

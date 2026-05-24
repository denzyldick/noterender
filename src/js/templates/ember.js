import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let embers;
let emberMat;
let currentTemplateConfig = {};

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const _tempVec3 = new BABYLON.Vector3();

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;

        const templateData = config.templates.find(td => td.name === 'ember');
        currentTemplateConfig = templateData ? templateData.currentConfig : {};

        CAMERA_PHYSICS.lock();
        if (camera) {
            camera.detachControl();
            camera.position.set(0, 0, -350);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.radius = 350;
        }

        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        PLANE.setScale(100, 100);
        PLANE.setCoordinates(0, 0, 0);
        PLANE.init(scene, config);

        const box = BABYLON.MeshBuilder.CreateBox("e", { size: 1 }, scene);
        embers = new BABYLON.SolidParticleSystem("embers", scene, { updatable: true });
        embers.addShape(box, 2000);
        box.dispose();
        const mesh = embers.buildMesh();
        emberMat = new BABYLON.StandardMaterial("emberMat", scene);
        emberMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        emberMat.disableLighting = true;
        mesh.material = emberMat;

        embers.initParticles = () => {
            for (let p = 0; p < embers.nbParticles; p++) {
                const part = embers.particles[p];
                this.resetEmber(part);
                part.position.y = (Math.random() - 0.5) * 400;
            }
        };
        embers.initParticles();
        embers.setParticles();

        if (!scene.glowLayer) {
            new BABYLON.GlowLayer("glow", scene).intensity = 2.5;
        }
    },

    resetEmber(part, isBurst) {
        const radius = isBurst ? Math.random() * 80 : Math.random() * 200;
        const angle = Math.random() * Math.PI * 2;
        part.position.set(
            Math.cos(angle) * radius,
            -150 - Math.random() * 100,
            Math.sin(angle) * radius
        );
        part.props = {
            vx: (Math.random() - 0.5) * (isBurst ? 8 : 1),
            vy: 1 + Math.random() * (isBurst ? 8 : 3),
            vz: (Math.random() - 0.5) * (isBurst ? 8 : 1),
            life: Math.random(),
            maxLife: 0.5 + Math.random() * 0.5,
            size: 2 + Math.random() * 8
        };
        part.scaling.setAll(part.props.size);
    },

    render(fft, config) {
        if (!fft || !fft.length) fft = new Uint8Array(256).fill(0);
        t += 0.005;
        PLANE.render(fft, config);

        const boost = config.sensitivity ? config.sensitivity.bassBoost : 1.0;
        let bass = 0;
        for (let i = 0; i < 8; i++) bass += fft[i];
        bass = (bass / 8 / 255) * boost;
        const pBass = Math.pow(bass, 1.6);

        let treble = 0;
        for (let i = fft.length - 30; i < fft.length; i++) treble += fft[i];
        treble = (treble / 30 / 255) * boost;

        const bassHit = bass > 0.6 && bass > (this._lastBass || 0);

        if (config.dynamicColors) {
            const hue = (t * 0.03) % 1;
            const pRGB = hslToRgb(hue, 0.9, 0.5 + bass * 0.3);
            const aRGB = hslToRgb((hue + 0.15) % 1, 1.0, 0.6 + treble * 0.2);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (embers) {
            for (let p = 0; p < embers.nbParticles; p++) {
                const part = embers.particles[p];
                part.props.vy += 0.02;
                part.position.x += part.props.vx * (1 + treble * 5);
                part.position.y += part.props.vy * (1 + treble * 3);
                part.position.z += part.props.vz * (1 + treble * 5);

                part.props.vx *= 0.98;
                part.props.vz *= 0.98;

                part.props.life += 0.005 * (1 + treble * 3);

                const lifeRatio = part.props.life / part.props.maxLife;
                const fade = 1 - lifeRatio;
                const heat = Math.max(0, 1 - lifeRatio * 2);

                part.color.set(
                    _accentColor.r * heat + _primaryColor.r * (1 - heat),
                    _primaryColor.g * heat * 0.6,
                    _primaryColor.b * heat * 0.2,
                    fade
                );

                const s = part.props.size * (0.5 + heat * 0.5);
                part.scaling.setAll(s);

                if (lifeRatio > 1) {
                    this.resetEmber(part, false);
                }
            }

            if (bassHit) {
                const burstCount = Math.min(50, Math.floor(bass * 100));
                for (let i = 0; i < burstCount && i < embers.nbParticles; i++) {
                    this.resetEmber(embers.particles[i], true);
                }
            }

            embers.setParticles();
        }

        this._lastBass = bass;

        if (currentCamera) {
            currentCamera.radius = 350 - pBass * 100;
            currentCamera.fov = 1.0 + pBass * 0.2;
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

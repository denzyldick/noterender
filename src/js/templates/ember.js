import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let sceneRef;
let currentCamera;
let t = 0;
let stars;
let currentTemplateConfig = {};

const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const STAR_COUNT = 600;

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
            camera.position.set(0, 0, -300);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.radius = 300;
            camera.alpha = 0;
            camera.beta = 0;
            camera.fov = 1.0;
        }

        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        PLANE.setScale(80, 80);
        PLANE.setCoordinates(0, 0, 0);
        PLANE.init(scene, config);

        const bgMat = new BABYLON.StandardMaterial("bgMat", scene);
        bgMat.emissiveColor = new BABYLON.Color3(0.02, 0.01, 0.03);
        bgMat.disableLighting = true;
        const bgPlane = BABYLON.MeshBuilder.CreatePlane("bg", {
            width: 6000,
            height: 4000,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        }, scene);
        bgPlane.position.z = 3000;
        bgPlane.material = bgMat;
        sceneRef._bgMat = bgMat;

        const box = BABYLON.MeshBuilder.CreateBox("s", { size: 1 }, scene);
        stars = new BABYLON.SolidParticleSystem("stars", scene, { updatable: true });
        stars.addShape(box, STAR_COUNT);
        box.dispose();
        const mesh = stars.buildMesh();
        mesh.material = new BABYLON.StandardMaterial("starMat", scene);
        mesh.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        mesh.material.disableLighting = true;

        stars.initParticles = () => {
            for (let p = 0; p < stars.nbParticles; p++) {
                const part = stars.particles[p];
                this.resetStar(part);
            }
        };
        stars.initParticles();
        stars.setParticles();
    },

    resetStar(part) {
        const angle = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 2000;
        part.position.set(
            Math.cos(angle) * Math.sin(angle2) * dist,
            Math.sin(angle) * Math.sin(angle2) * dist,
            500 + Math.random() * 2000
        );
        part.props = {
            speed: 3 + Math.random() * 8,
            size: 1 + Math.random() * 4
        };
        part.scaling.setAll(part.props.size);
    },

    render(fft, config) {
        if (!fft || !fft.length) fft = new Uint8Array(256).fill(0);
        t += 0.005;
        PLANE.render(fft, config);

        const boost = config.sensitivity ? config.sensitivity.bassBoost : 1.0;
        let bass = 0;
        for (let i = 0; i < 6; i++) bass += fft[i];
        bass = (bass / 6 / 255) * boost;
        const pBass = Math.pow(bass, 1.3);

        if (config.dynamicColors) {
            const hue = (t * 0.02) % 1;
            const pRGB = hslToRgb(hue, 0.9, 0.6 + bass * 0.3);
            const aRGB = hslToRgb((hue + 0.3) % 1, 0.8, 0.7);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (stars) {
            const speedMult = 1 + pBass * 5;
            for (let p = 0; p < stars.nbParticles; p++) {
                const part = stars.particles[p];
                part.position.z -= part.props.speed * speedMult;

                const fade = Math.min(1, 1 - part.position.z / 2500);
                part.color.set(
                    _accentColor.r * fade,
                    _accentColor.g * fade,
                    _accentColor.b * fade,
                    fade
                );
                part.scaling.setAll(part.props.size * (0.3 + fade * 0.7));

                if (part.position.z < -100) {
                    this.resetStar(part);
                }
            }
            stars.setParticles();
        }

        if (sceneRef && sceneRef._bgMat) {
            sceneRef._bgMat.emissiveColor.set(
                _primaryColor.r * (0.02 + pBass * 0.08),
                _primaryColor.g * (0.01 + pBass * 0.06),
                _primaryColor.b * (0.03 + pBass * 0.1)
            );
        }

        if (currentCamera) {
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

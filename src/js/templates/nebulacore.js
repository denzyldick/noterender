import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let t = 0;
let rings = [];
let vortex;
let coreLight;
let sceneRef;
let currentCamera;
let currentTemplateConfig = {};

// Pre-allocated objects for performance
const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();
const _tempVec3 = new BABYLON.Vector3();

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;

        const templateData = config.templates.find(td => td.name === 'nebulacore');
        currentTemplateConfig = templateData ? templateData.currentConfig : {};
        const c = currentTemplateConfig;
        
        // Claim the camera exclusively
        CAMERA_PHYSICS.lock();

        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        
        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Central Volumetric Glow ---
        coreLight = new BABYLON.PointLight("coreLight", new BABYLON.Vector3(0, 0, 0), scene);
        coreLight.intensity = 3.0;
        coreLight.diffuse.copyFrom(_accentColor);

        // --- Logo ---
        PLANE.setScale(200, 200);
        PLANE.setCoordinates(0, 0, 0);
        PLANE.init(scene, config);
        const logoPlane = PLANE.getPlane();
        if (logoPlane) logoPlane.renderingGroupId = 1;

        // --- Camera ---
        if (camera) {
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.setPosition(new BABYLON.Vector3(0, 50, -400));
        }

        // --- Reactive Rings ---
        rings = [];
        const ringMat = new BABYLON.StandardMaterial("ringMat", scene);
        ringMat.emissiveColor.copyFrom(_primaryColor);
        ringMat.wireframe = true;
        ringMat.disableLighting = true;

        const ringCount = Math.max(1, c.rings || 10);
        for (let i = 0; i < ringCount; i++) {
            const ring = BABYLON.MeshBuilder.CreateTorus(`ring${i}`, {
                diameter: 200 + i * (400 / ringCount), thickness: 2, tessellation: 64
            }, scene);
            ring.material = ringMat;
            ring.rotation.x = Math.PI / 2;
            ring.renderingGroupId = 1;
            rings.push({ mesh: ring, rotSpeed: 0.01 + i * 0.003 });
        }

        // --- Vortex Particles ---
        vortex = new BABYLON.SolidParticleSystem("vortexSps", scene);
        const poly = BABYLON.MeshBuilder.CreateBox("p", { size: 2 }, scene);
        vortex.addShape(poly, 2000);
        poly.dispose();
        const mesh = vortex.buildMesh();
        mesh.material = new BABYLON.StandardMaterial("vm", scene);
        mesh.material.emissiveColor.set(1, 1, 1);
        mesh.material.disableLighting = true;
        
        mesh.position.z = 200;
        mesh.renderingGroupId = 0;

        vortex.initParticles = () => {
            for (let p = 0; p < vortex.nbParticles; p++) {
                const part = vortex.particles[p];
                this.resetVortexParticle(part, _accentColor);
            }
        };
        vortex.initParticles();
        vortex.setParticles();

        if (!scene.glowLayer) new BABYLON.GlowLayer("glow", scene);
    },

    resetVortexParticle(part, accent) {
        const r = 180 + Math.random() * 300;
        const a = Math.random() * Math.PI * 2;
        part.position.set(r * Math.cos(a), (Math.random() - 0.5) * 400, r * Math.sin(a));
        part.props = { 
            radius: r, 
            angle: a, 
            speed: 0.02 + Math.random() * 0.03, 
            vSpeed: (Math.random() - 0.5) * 2 
        };
        part.color = new BABYLON.Color4(accent.r, accent.g, accent.b, 0.8);
    },

    render(fft, config) {
        if (!fft) fft = new Uint8Array(256).fill(0);
        t += 0.01;
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
            _primaryColor.set(bass, 0.2, 1 - bass);
            _accentColor.set(treble, 1 - treble, 0.8);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (coreLight) {
            coreLight.intensity = 2.0 + bass * 15.0;
            coreLight.diffuse.set(_accentColor.r * (0.5+bass), _accentColor.g, _accentColor.b * (1.0 - bass * 0.5));
        }

        rings.forEach((r, i) => {
            r.mesh.rotation.x += r.rotSpeed * (1 + bass * 5);
            r.mesh.rotation.z += r.rotSpeed * (1 + bass * 3);
            const scale = 1.0 + bass * (0.4 - i * 0.2);
            r.mesh.scaling.set(scale, scale, scale);
            r.mesh.material.emissiveColor.set(_primaryColor.r * (0.8+bass), _primaryColor.g * (0.8+bass), _primaryColor.b * (0.8+bass));
        });

        if (currentCamera) {
            currentCamera.setTarget(BABYLON.Vector3.Zero());
            
            if (config.options && config.options.camera && config.options.camera.move) {
                const orbitRadius = 15 * bass;
                const orbitSpeed = t * 0.4;
                _tempVec3.set(Math.cos(orbitSpeed) * orbitRadius, 50 + Math.sin(orbitSpeed) * orbitRadius, -400);
                currentCamera.setPosition(_tempVec3);
            } else {
                _tempVec3.set(0, 50, -400);
                currentCamera.setPosition(_tempVec3);
            }
        }

        if (vortex) {
            for (let p = 0; p < vortex.nbParticles; p++) {
                const part = vortex.particles[p];
                part.props.angle += part.props.speed * (1 + bass * 10);
                part.props.radius -= (1.0 + bass * 5);
                
                part.position.x = part.props.radius * Math.cos(part.props.angle);
                part.position.z = part.props.radius * Math.sin(part.props.angle);
                part.position.y += part.props.vSpeed * (1 + bass * 2);
                
                const pScale = 1 + bass * 2;
                part.scaling.set(pScale, pScale, pScale);
                part.color.set(_accentColor.r, _accentColor.g, _accentColor.b, 0.8);

                if (part.props.radius < 30 || part.props.radius > 600) {
                    this.resetVortexParticle(part, _accentColor);
                }
            }
            vortex.setParticles();
        }
    },

    dispose() {
        currentCamera = null;
        sceneRef = null;
        rings = [];
    }
};

export default template;

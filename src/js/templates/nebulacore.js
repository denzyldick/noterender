import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA from "./components/camera";

let t = 0;
let rings = [];
let vortex;
let coreLight;
let sceneRef;

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        sceneRef = scene;
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        
        const primary = new BABYLON.Color3(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        const accent = new BABYLON.Color3(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Central Volumetric Glow ---
        coreLight = new BABYLON.PointLight("coreLight", new BABYLON.Vector3(0, 0, 0), scene);
        coreLight.intensity = 3.0;
        coreLight.diffuse = accent;

        // --- Logo ---
        PLANE.setScale(200, 200);
        PLANE.setCoordinates(0, 0, 0);
        PLANE.init(scene, config);
        const logoPlane = PLANE.getPlane();
        if (logoPlane) logoPlane.renderingGroupId = 1;

        // --- Camera ---
        camera.setPosition(new BABYLON.Vector3(0, 50, -600));
        camera.setTarget(BABYLON.Vector3.Zero());
        CAMERA.init(camera, config);

        // --- Reactive Rings ---
        rings = [];
        const ringMat = new BABYLON.StandardMaterial("ringMat", scene);
        ringMat.emissiveColor = primary;
        ringMat.wireframe = true;
        ringMat.disableLighting = true;

        for (let i = 0; i < 2; i++) {
            const ring = BABYLON.MeshBuilder.CreateTorus(`ring${i}`, {
                diameter: 300 + i * 100, thickness: 2, tessellation: 128
            }, scene);
            ring.material = ringMat;
            ring.rotation.x = Math.PI / 2;
            ring.renderingGroupId = 1;
            rings.push({ mesh: ring, rotSpeed: 0.01 + i * 0.005 });
        }

        // --- Vortex Particles ---
        vortex = new BABYLON.SolidParticleSystem("vortexSps", scene);
        const poly = BABYLON.MeshBuilder.CreateBox("p", { size: 2 }, scene);
        vortex.addShape(poly, 2000);
        poly.dispose();
        const mesh = vortex.buildMesh();
        mesh.material = new BABYLON.StandardMaterial("vm", scene);
        mesh.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        mesh.material.disableLighting = true;
        
        mesh.position.z = 200;
        mesh.renderingGroupId = 0;

        vortex.initParticles = () => {
            for (let p = 0; p < vortex.nbParticles; p++) {
                const part = vortex.particles[p];
                this.resetVortexParticle(part, accent);
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
        t += 0.01;
        PLANE.render(fft);
        CAMERA.render(fft[0]);

        let bass = 0;
        for (let i = 0; i < 10; i++) bass += fft[i];
        bass = (bass / 10) / 255;

        let treble = 0;
        for (let i = fft.length - 20; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20) / 255;

        let primary, accent;
        if (config.dynamicColors) {
            primary = new BABYLON.Color3(bass, 0.2, 1 - bass);
            accent = new BABYLON.Color3(treble, 1 - treble, 0.8);
        } else {
            primary = new BABYLON.Color3(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            accent = new BABYLON.Color3(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (coreLight) {
            coreLight.intensity = 2.0 + bass * 15.0;
            coreLight.diffuse.set(accent.r * (0.5+bass), accent.g, accent.b * (1.0 - bass * 0.5));
        }

        rings.forEach((r, i) => {
            r.mesh.rotation.x += r.rotSpeed * (1 + bass * 5);
            r.mesh.rotation.z += r.rotSpeed * (1 + bass * 3);
            const scale = 1.0 + bass * (0.4 - i * 0.2);
            r.mesh.scaling.set(scale, scale, scale);
            r.mesh.material.emissiveColor.set(primary.r * (0.8+bass), primary.g * (0.8+bass), primary.b * (0.8+bass));
        });

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
                part.color.set(accent.r, accent.g, accent.b, 0.8);

                if (part.props.radius < 30 || part.props.radius > 600) {
                    this.resetVortexParticle(part, accent);
                }
            }
            vortex.setParticles();
        }
    }
};

export default template;

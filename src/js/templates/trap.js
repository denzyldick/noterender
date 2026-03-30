import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let t = 0;
let bars = [];
let barsInner = [];
let particles;
let sceneRef;
let glowLayer;
let flare;
let blueSquare;
let hyperSpace;

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        sceneRef = scene;
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        const primary = new BABYLON.Color3(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        const accent = new BABYLON.Color3(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Camera Setup ---
        camera.setPosition(new BABYLON.Vector3(0, 0, -550));
        camera.setTarget(BABYLON.Vector3.Zero());
        if (config.options.camera) config.options.camera.move = false;

        // --- Logo ---
        PLANE.setScale(210, 210);
        PLANE.setCoordinates(0, 0, 0);
        PLANE.init(scene, config);

        // --- Blue Square Border (Trap Nation Style) ---
        blueSquare = BABYLON.MeshBuilder.CreatePlane("blueSquare", { size: 1 }, scene);
        const squareMat = new BABYLON.StandardMaterial("squareMat", scene);
        squareMat.emissiveColor = primary;
        squareMat.disableLighting = true;
        // Create a simple square texture with a border
        const dt = new BABYLON.DynamicTexture("squareTex", { width: 512, height: 512 }, scene);
        const ctx = dt.getContext();
        ctx.strokeStyle = `rgb(${config.colors.r}, ${config.colors.g}, ${config.colors.b})`;
        ctx.lineWidth = 40;
        ctx.strokeRect(0, 0, 512, 512);
        dt.update();
        squareMat.opacityTexture = dt;
        blueSquare.material = squareMat;
        blueSquare.position.z = 5;
        blueSquare.scaling.set(240, 240, 1);

        // --- Hyper-Space Background (Math Driven) ---
        hyperSpace = new BABYLON.SolidParticleSystem("hyperSpace", scene);
        const lineShape = BABYLON.MeshBuilder.CreateBox("l", { width: 0.2, height: 0.2, depth: 50 }, scene);
        hyperSpace.addShape(lineShape, 800);
        lineShape.dispose();
        const hyperMesh = hyperSpace.buildMesh();
        hyperMesh.material = new BABYLON.StandardMaterial("hyperMat", scene);
        hyperMesh.material.emissiveColor = accent;
        hyperMesh.material.disableLighting = true;

        hyperSpace.initParticles = () => {
            for (let p = 0; p < hyperSpace.nbParticles; p++) {
                const particle = hyperSpace.particles[p];
                this.resetHyperParticle(particle);
            }
        };
        hyperSpace.initParticles();
        hyperSpace.setParticles();

        // --- High-Density Spectrum ---
        bars = [];
        barsInner = [];
        const barCount = 256; 
        const radius = 225;
        
        const barMat = new BABYLON.StandardMaterial("barMat", scene);
        barMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        barMat.disableLighting = true;

        const baseBar = BABYLON.MeshBuilder.CreatePlane("baseBar", { width: 1.5, height: 1 }, scene);
        baseBar.material = barMat;
        baseBar.isVisible = false;

        for (let i = 0; i < barCount; i++) {
            const angle = (i / barCount) * Math.PI * 2;
            const outer = baseBar.createInstance("bar_o" + i);
            outer.position.x = Math.cos(angle) * radius;
            outer.position.y = Math.sin(angle) * radius;
            outer.rotation.z = angle + Math.PI / 2;
            outer.setPivotPoint(new BABYLON.Vector3(0, -0.5, 0));
            bars.push(outer);

            const inner = baseBar.createInstance("bar_i" + i);
            inner.position.x = Math.cos(angle) * (radius - 5);
            inner.position.y = Math.sin(angle) * (radius - 5);
            inner.rotation.z = angle - Math.PI / 2;
            inner.setPivotPoint(new BABYLON.Vector3(0, -0.5, 0));
            barsInner.push(inner);
        }

        // --- Dust Particles ---
        particles = new BABYLON.SolidParticleSystem("trapStars", scene);
        const poly = BABYLON.MeshBuilder.CreateBox("p", { size: 1.2 }, scene);
        particles.addShape(poly, 1000);
        poly.dispose();
        const partMesh = particles.buildMesh();
        partMesh.material = new BABYLON.StandardMaterial("partMat", scene);
        partMesh.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        partMesh.material.disableLighting = true;

        particles.initParticles = () => {
            for (let p = 0; p < particles.nbParticles; p++) {
                const particle = particles.particles[p];
                this.resetDustParticle(particle, true);
            }
        };
        particles.initParticles();
        particles.setParticles();

        if (!scene.glowLayer) {
            glowLayer = new BABYLON.GlowLayer("glow", scene);
            glowLayer.blurKernelSize = 48;
        }
    },

    resetHyperParticle(particle) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 300 + Math.random() * 1000;
        particle.position.x = Math.cos(angle) * radius;
        particle.position.y = Math.sin(angle) * radius;
        particle.position.z = 1000 + Math.random() * 2000;
        particle.velocity = 20 + Math.random() * 50;
    },

    resetDustParticle(particle, randomZ = false) {
        particle.position.x = (Math.random() - 0.5) * 1500;
        particle.position.y = (Math.random() - 0.5) * 1500;
        particle.position.z = randomZ ? Math.random() * 1000 : 900;
        particle.velocity = 2 + Math.random() * 6;
    },

    render(fft, config) {
        t += 0.01;
        let bass = 0;
        for (let i = 0; i < 6; i++) bass += fft[i];
        bass = (bass / 6) / 255;

        let treble = 0;
        for (let i = fft.length - 20; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20) / 255;

        PLANE.render(fft, config);

        let primary, accent;
        if (config.dynamicColors) {
            const baseHue = (t * 0.15) % 1; 
            const pRGB = this.hslToRgb(baseHue, 0.85, 0.4 + bass * 0.3);
            const aRGB = this.hslToRgb((baseHue + 0.3) % 1, 0.9, 0.5 + treble * 0.3);
            primary = new BABYLON.Color3(pRGB.r, pRGB.g, pRGB.b);
            accent = new BABYLON.Color3(aRGB.r, aRGB.g, aRGB.b);
        } else {
            primary = new BABYLON.Color3(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            accent = new BABYLON.Color3(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        // --- Blue Square Pulse ---
        if (blueSquare) {
            const squareScale = 240 + bass * 120;
            blueSquare.scaling.set(squareScale, squareScale, 1);
            blueSquare.rotation.z += 0.01 + bass * 0.05;
            blueSquare.material.emissiveColor = primary;
        }

        // --- Update Hyper-Space ---
        if (hyperSpace) {
            for (let p = 0; p < hyperSpace.nbParticles; p++) {
                const particle = hyperSpace.particles[p];
                particle.position.z -= particle.velocity * (1 + bass * 5);
                if (particle.position.z < -500) this.resetHyperParticle(particle);
            }
            hyperSpace.setParticles();
            hyperSpace.mesh.material.emissiveColor = accent;
        }

        // --- Symmetrical Spectrum ---
        const half = bars.length / 2;
        for (let i = 0; i < bars.length; i++) {
            const index = i < half ? i : bars.length - i;
            const fftVal = fft[Math.floor((index / half) * 120)] || 0;
            const targetScale = 2 + (fftVal / 255) * 300;
            bars[i].scaling.y += (targetScale - bars[i].scaling.y) * 0.5;
            
            const innerVal = fft[index + 20] || 0;
            barsInner[i].scaling.y += (1 + (innerVal / 255) * 50 - barsInner[i].scaling.y) * 0.3;
        }

        // --- Camera & Effects ---
        const cam = sceneRef.activeCamera;
        if (cam) {
            const targetRadius = 550 - bass * 150;
            cam.radius += (targetRadius - cam.radius) * 0.4;
            if (bass > 0.8) {
                cam.position.x += (Math.random() - 0.5) * 20;
                cam.position.y += (Math.random() - 0.5) * 20;
            } else {
                cam.position.x *= 0.85; cam.position.y *= 0.85;
            }
        }

        // --- Update Dust ---
        if (particles) {
            for (let p = 0; p < particles.nbParticles; p++) {
                const particle = particles.particles[p];
                particle.position.z -= particle.velocity * (1 + bass * 10);
                if (particle.position.z < -200) this.resetDustParticle(particle);
            }
            particles.setParticles();
        }

        if (glowLayer) glowLayer.intensity = 0.8 + bass * 2.0;
    },

    hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
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
};

export default template;

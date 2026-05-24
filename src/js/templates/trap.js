import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let t = 0;
let bars = [];
let barsInner = [];
let particles;
let sceneRef;
let glowLayer;
let blueSquare;
let hyperSpace;
let currentCamera;
let currentTemplateConfig = {};

const template = {
    init(camera, renderer, nb, scene, width, height, depth, config) {
        sceneRef = scene;
        currentCamera = camera;
        t = 0;
        
        const templateData = config.templates.find(t => t.name === 'trap');
        currentTemplateConfig = templateData ? templateData.currentConfig : {};
        const c = currentTemplateConfig;

        // Claim the camera exclusively
        CAMERA_PHYSICS.lock();

        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Camera Setup ---
        if (camera) {
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.setPosition(new BABYLON.Vector3(0, 0, -320));
        }

        // --- Logo ---
        PLANE.setScale(210, 210);
        PLANE.setCoordinates(0, 0, 0);
        PLANE.init(scene, config);

        // --- Blue Square Border ---
        blueSquare = BABYLON.MeshBuilder.CreatePlane("blueSquare", { size: 1 }, scene);
        const squareMat = new BABYLON.StandardMaterial("squareMat", scene);
        squareMat.emissiveColor.copyFrom(_primaryColor);
        squareMat.disableLighting = true;
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

        // --- Hyper-Space Background ---
        hyperSpace = new BABYLON.SolidParticleSystem("hyperSpace", scene);
        const lineShape = BABYLON.MeshBuilder.CreateBox("l", { width: 0.2, height: 0.2, depth: 50 }, scene);
        hyperSpace.addShape(lineShape, c.hyperspace || 800);
        lineShape.dispose();
        const hyperMesh = hyperSpace.buildMesh();
        hyperMesh.material = new BABYLON.StandardMaterial("hyperMat", scene);
        hyperMesh.material.emissiveColor.copyFrom(_accentColor);
        hyperMesh.material.disableLighting = true;

        hyperSpace.initParticles = () => {
            for (let p = 0; p < hyperSpace.nbParticles; p++) {
                const particle = hyperSpace.particles[p];
                this.resetHyperParticle(particle);
            }
        };
        hyperSpace.initParticles();
        hyperSpace.setParticles();

        // --- Spectrum Bars ---
        bars = [];
        barsInner = [];
        const barCount = c.bars || 256; 
        const radius = c.radius || 225;
        const barWidth = c.barWidth || 1.5;
        const barMat = new BABYLON.StandardMaterial("barMat", scene);
        barMat.emissiveColor.set(1, 1, 1);
        barMat.disableLighting = true;
        const baseBar = BABYLON.MeshBuilder.CreatePlane("baseBar", { width: barWidth, height: 1 }, scene);
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
        partMesh.material.emissiveColor.set(1, 1, 1);
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
        }
        glowLayer.blurKernelSize = c.glow || 48;
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
        if (!fft) fft = new Uint8Array(256).fill(0);
        const c = currentTemplateConfig;
        t += 0.01;

        let bass = 0;
        const bassEnd = Math.min(fft.length, 6);
        for (let i = 0; i < bassEnd; i++) bass += fft[i];
        bass = (bass / bassEnd) / 255;
        
        // Artist Hack: Boost bass reactivity exponentially for "punch"
        const punchBass = Math.pow(bass, 1.5);

        let treble = 0;
        const trebleStart = Math.max(0, fft.length - 20);
        for (let i = trebleStart; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20) / 255;

        PLANE.render(fft, config);

        if (config.dynamicColors) {
            const baseHue = (t * 0.15) % 1; 
            const pRGB = this.hslToRgb(baseHue, 0.85, 0.4 + punchBass * 0.3);
            const aRGB = this.hslToRgb((baseHue + 0.3) % 1, 0.9, 0.5 + treble * 0.3);
            _primaryColor.set(pRGB.r, pRGB.g, pRGB.b);
            _accentColor.set(aRGB.r, aRGB.g, aRGB.b);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        if (blueSquare) {
            const squareScale = (c.radius || 240) * 1.1 + punchBass * 120;
            blueSquare.scaling.set(squareScale, squareScale, 1);
            blueSquare.rotation.z += 0.01 + punchBass * 0.05;
            blueSquare.material.emissiveColor.copyFrom(_primaryColor);
        }

        if (hyperSpace) {
            const boost = 1 + punchBass * 5;
            for (let p = 0; p < hyperSpace.nbParticles; p++) {
                const particle = hyperSpace.particles[p];
                particle.position.z -= particle.velocity * boost;
                if (particle.position.z < -500) this.resetHyperParticle(particle);
            }
            hyperSpace.setParticles();
            hyperSpace.mesh.material.emissiveColor.copyFrom(_accentColor);
        }

        const barLen = bars.length;
        const half = barLen / 2;
        
        // Artist Algorithm: Kaleidoscopic Symmetry
        // Instead of linear mapping, we fold the spectrum to create complex patterns
        for (let i = 0; i < barLen; i++) {
            // Symmetry fold (try 4-fold symmetry)
            const fold = 4;
            const segment = barLen / fold;
            const subIdx = i % segment;
            const mirroredIdx = subIdx < segment/2 ? subIdx : segment - subIdx;
            
            const fftIdx = Math.floor((mirroredIdx / (segment/2)) * 120);
            const fftVal = fft[fftIdx] || 0;
            
            const targetScale = 2 + (fftVal / 255) * 350 * (1 + punchBass * 0.5);
            bars[i].scaling.y += (targetScale - bars[i].scaling.y) * 0.6;
            
            const innerVal = fft[mirroredIdx + 10] || 0;
            barsInner[i].scaling.y += (1 + (innerVal / 255) * 80 - barsInner[i].scaling.y) * 0.4;
        }

        if (currentCamera) {
            currentCamera.setTarget(BABYLON.Vector3.Zero());
            
            if (config.options && config.options.camera && config.options.camera.move) {
                const orbitRadius = 25 * punchBass;
                const orbitSpeed = t * 0.2;
                currentCamera.position.x = Math.cos(orbitSpeed) * orbitRadius;
                currentCamera.position.y = Math.sin(orbitSpeed) * orbitRadius;
                
                if (punchBass > 0.85) {
                    currentCamera.position.addInPlace(new BABYLON.Vector3((Math.random()-0.5)*15, (Math.random()-0.5)*15, 0));
                }
            } else {
                currentCamera.position.x = 0;
                currentCamera.position.y = 0;
            }
        }

        if (particles) {
            const boost = 1 + punchBass * 10;
            for (let p = 0; p < particles.nbParticles; p++) {
                const particle = particles.particles[p];
                particle.position.z -= particle.velocity * boost;
                if (particle.position.z < -200) this.resetDustParticle(particle);
            }
            particles.setParticles();
        }

        if (glowLayer) glowLayer.intensity = 0.5 + punchBass * 2.5;
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
        sceneRef = null;
        bars = [];
        barsInner = [];
    }
};

export default template;

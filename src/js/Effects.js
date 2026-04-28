import * as BABYLON from "babylonjs";

class EffectsManager {
    constructor() {
        this.scene = null;
        this.activeEffects = new Set();
        this.systems = {};
        this._tempColor = new BABYLON.Color3(0, 0, 0);
        this._tempColor4 = new BABYLON.Color4(0, 0, 0, 0);
        this._primaryColor = new BABYLON.Color3(0, 0, 0);
        this._accentColor = new BABYLON.Color3(0, 0, 0);
        this.t = 0;
    }

    init(scene) {
        this.scene = scene;
        this.systems = {
            smoke: this.initSmoke(),
            thunder: this.initThunder(),
            birds: this.initBirds(),
            glitch: this.initGlitch(),
            grid: this.initGrid(),
            fireflies: this.initFireflies(),
            rain: this.initRain(),
            shockwave: this.initShockwave(),
            lasers: this.initLasers(),
            dust: this.initDust(),
            crystals: this.initCrystals(),
            vignette: this.initVignette(),
            bloom: this.initBloom()
        };
    }

    update(activeEffectNames) {
        this.activeEffects = new Set(activeEffectNames);
        
        Object.keys(this.systems).forEach(name => {
            const system = this.systems[name];
            if (this.activeEffects.has(name)) {
                if (system.start) system.start();
                if (system.mesh) system.mesh.isVisible = true;
                if (system.isVisible !== undefined) system.isVisible = true;
            } else {
                if (system.stop) system.stop();
                if (system.mesh) system.mesh.isVisible = false;
                if (system.isVisible !== undefined) system.isVisible = false;
            }
        });
    }

    render(fft, config) {
        this.t += 0.01;
        if (this.activeEffects.size === 0) return;

        let bass = 0;
        const bassEnd = Math.min(fft.length, 10);
        for (let i = 0; i < bassEnd; i++) bass += fft[i];
        bass = (bass / bassEnd) / 255;
        const pBass = Math.pow(bass, 1.5);

        let treble = 0;
        const trebleStart = Math.max(0, fft.length - 20);
        for (let i = trebleStart; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20) / 255;

        this.activeEffects.forEach(name => {
            const method = `render${name.charAt(0).toUpperCase() + name.slice(1)}`;
            if (this[method]) this[method](pBass, treble, config);
        });
    }

    // --- SMOKE ---
    initSmoke() {
        const smokeSystem = new BABYLON.ParticleSystem("smoke", 1500, this.scene);
        smokeSystem.particleTexture = new BABYLON.Texture("/img/templates/Smoke30Frames.png", this.scene);
        smokeSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
        smokeSystem.isAnimationSheetEnabled = true;
        smokeSystem.startSpriteCellID = 0;
        smokeSystem.endSpriteCellID = 29;
        smokeSystem.spriteCellWidth = 128;
        smokeSystem.spriteCellHeight = 128;
        smokeSystem.spriteCellChangeSpeed = 0.8;
        smokeSystem.emitter = new BABYLON.Vector3(0, -200, 0);
        smokeSystem.minEmitBox = new BABYLON.Vector3(-1000, 0, -800);
        smokeSystem.maxEmitBox = new BABYLON.Vector3(1000, 0, 800);
        smokeSystem.addSizeGradient(0, 150, 200);
        smokeSystem.addSizeGradient(1.0, 400, 600);
        smokeSystem.minLifeTime = 5;
        smokeSystem.maxLifeTime = 10;
        smokeSystem.color1 = new BABYLON.Color4(1, 1, 1, 0);
        smokeSystem.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
        smokeSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
        return smokeSystem;
    }
    renderSmoke(bass, treble, config) {
        const sys = this.systems.smoke;
        sys.emitRate = 60 + bass * 200;
        const color = config.colors;
        sys.color1.set(color.r/255, color.g/255, color.b/255, 0);
        sys.color2.set(color.r/255, color.g/255, color.b/255, 0.1 + bass * 0.3);
    }

    // --- THUNDER ---
    initThunder() {
        const light = new BABYLON.HemisphericLight("thunderLight", new BABYLON.Vector3(0, 1, 0), this.scene);
        light.intensity = 0;
        return { light, lastFlash: 0, flashDuration: 0, start: () => {}, stop: () => { light.intensity = 0; } };
    }
    renderThunder(bass, treble) {
        const sys = this.systems.thunder;
        const now = Date.now();
        if (bass > 0.88 && now - sys.lastFlash > 2000) {
            sys.lastFlash = now;
            sys.flashDuration = 50 + Math.random() * 150;
        }
        sys.light.intensity = (now - sys.lastFlash < sys.flashDuration) ? Math.random() * 10 : 0;
    }

    // --- BIRDS ---
    initBirds() {
        const sps = new BABYLON.SolidParticleSystem("birds", this.scene);
        const triangle = BABYLON.MeshBuilder.CreateCylinder("t", { tessellation: 3, diameter: 5, height: 10 }, this.scene);
        triangle.rotation.x = Math.PI / 2;
        sps.addShape(triangle, 40);
        triangle.dispose();
        const mesh = sps.buildMesh();
        mesh.material = new BABYLON.StandardMaterial("birdMat", this.scene);
        mesh.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        mesh.material.disableLighting = true;
        return { sps, mesh };
    }
    renderBirds(bass, treble, config) {
        const sys = this.systems.birds;
        const color = config.light;
        sys.mesh.material.emissiveColor.set(color.r/255, color.g/255, color.b/255);
        for (let p = 0; p < sys.sps.nbParticles; p++) {
            const part = sys.sps.particles[p];
            if (!part.vel) part.vel = new BABYLON.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).scale(5);
            part.position.addInPlace(part.vel.scale(1 + bass * 3));
            if (part.position.length() > 1000) part.position.scaleInPlace(0.5);
            part.scaling.x = 1 + Math.sin(this.t * 10 + p) * 0.5 * (1 + treble * 5);
        }
        sys.sps.setParticles();
    }

    // --- GLITCH ---
    initGlitch() {
        return { active: false, intensity: 0 };
    }
    renderGlitch(bass) {
        if (bass > 0.85) {
            this.scene.activeCamera.position.addInPlace(new BABYLON.Vector3((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10));
        }
    }

    // --- NEON GRID ---
    initGrid() {
        const grid = BABYLON.MeshBuilder.CreateGround("effectGrid", { width: 5000, height: 5000, subdivisions: 50 }, this.scene);
        const mat = new BABYLON.StandardMaterial("gridMat", this.scene);
        mat.wireframe = true;
        mat.emissiveColor = new BABYLON.Color3(0, 1, 1);
        mat.disableLighting = true;
        grid.material = mat;
        grid.position.y = -400;
        return { mesh: grid, mat };
    }
    renderGrid(bass, treble, config) {
        const sys = this.systems.grid;
        const color = config.colors;
        sys.mat.emissiveColor.set(color.r/255, color.g/255, color.b/255);
        sys.mat.alpha = 0.1 + bass * 0.5;
        sys.mesh.position.z = (this.t * 500) % 100 - 50;
    }

    // --- FIREFLIES ---
    initFireflies() {
        const ps = new BABYLON.ParticleSystem("fireflies", 200, this.scene);
        ps.particleTexture = new BABYLON.Texture("/img/templates/Smoke30Frames.png", this.scene);
        ps.emitter = new BABYLON.Vector3(0, 0, 0);
        ps.minEmitBox = new BABYLON.Vector3(-600, -300, -600);
        ps.maxEmitBox = new BABYLON.Vector3(600, 300, 600);
        ps.minSize = 2; ps.maxSize = 8;
        ps.updateSpeed = 0.01;
        ps.addVelocityGradient(0, 1, 2);
        return ps;
    }
    renderFireflies(bass, treble, config) {
        const sys = this.systems.fireflies;
        const color = config.light;
        sys.color1.set(color.r/255, color.g/255, color.b/255, 0.8);
        sys.color2.set(color.r/255, color.g/255, color.b/255, 0.5);
    }

    // --- MATRIX RAIN ---
    initRain() {
        const sps = new BABYLON.SolidParticleSystem("rain", this.scene);
        const bar = BABYLON.MeshBuilder.CreateBox("rb", { width: 1, height: 40, depth: 1 }, this.scene);
        sps.addShape(bar, 200);
        bar.dispose();
        const mesh = sps.buildMesh();
        mesh.material = new BABYLON.StandardMaterial("rainMat", this.scene);
        mesh.material.emissiveColor = new BABYLON.Color3(0, 1, 0);
        mesh.material.disableLighting = true;
        return { sps, mesh };
    }
    renderRain(bass, treble, config) {
        const sys = this.systems.rain;
        const color = config.colors;
        sys.mesh.material.emissiveColor.set(color.r/255, color.g/255, color.b/255);
        for (let p = 0; p < sys.sps.nbParticles; p++) {
            const part = sys.sps.particles[p];
            if (!part.speed) {
                part.position.set(Math.random()*2000-1000, 1000, Math.random()*2000-1000);
                part.speed = 10 + Math.random() * 30;
            }
            part.position.y -= part.speed * (1 + treble * 5);
            if (part.position.y < -1000) part.position.y = 1000;
        }
        sys.sps.setParticles();
    }

    // --- SHOCKWAVE ---
    initShockwave() {
        const mesh = BABYLON.MeshBuilder.CreateTorus("shock", { diameter: 1, thickness: 2, tessellation: 64 }, this.scene);
        const mat = new BABYLON.StandardMaterial("shockMat", this.scene);
        mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        mat.disableLighting = true;
        mesh.material = mat;
        mesh.rotation.x = Math.PI / 2;
        mesh.isVisible = false;
        return { mesh, mat, scale: 1, active: false };
    }
    renderShockwave(bass, treble, config) {
        const sys = this.systems.shockwave;
        const color = config.colors;
        if (bass > 0.92 && !sys.active) {
            sys.active = true;
            sys.scale = 1;
            sys.mesh.isVisible = true;
        }
        if (sys.active) {
            sys.scale += 20;
            sys.mesh.scaling.set(sys.scale, sys.scale, sys.scale);
            sys.mat.alpha = 1 - (sys.scale / 1500);
            sys.mat.emissiveColor.set(color.r/255, color.g/255, color.b/255);
            if (sys.scale > 1500) {
                sys.active = false;
                sys.mesh.isVisible = false;
            }
        }
    }

    // --- LASERS ---
    initLasers() {
        const container = new BABYLON.TransformNode("laserRoot", this.scene);
        const lasers = [];
        for (let i = 0; i < 8; i++) {
            const l = BABYLON.MeshBuilder.CreateBox("l"+i, { width: 1, height: 1, depth: 2000 }, this.scene);
            const mat = new BABYLON.StandardMaterial("lm"+i, this.scene);
            mat.emissiveColor = new BABYLON.Color3(1, 0, 0);
            mat.disableLighting = true;
            l.material = mat;
            l.parent = container;
            lasers.push({ mesh: l, mat, offset: i * Math.PI / 4 });
        }
        return { container, lasers, isVisible: false };
    }
    renderLasers(bass, treble, config) {
        const sys = this.systems.lasers;
        const color = config.light;
        sys.container.setEnabled(sys.isVisible);
        sys.lasers.forEach((l, i) => {
            l.mesh.rotation.y = Math.sin(this.t * 0.5 + l.offset) * 1.5;
            l.mesh.rotation.x = Math.cos(this.t * 0.3 + l.offset) * 0.5;
            l.mat.emissiveColor.set(color.r/255, color.g/255, color.b/255);
            l.mat.alpha = 0.2 + bass * 0.8;
            l.mesh.scaling.x = 1 + treble * 10;
        });
    }

    // --- DUST ---
    initDust() {
        const ps = new BABYLON.ParticleSystem("dust", 1000, this.scene);
        ps.particleTexture = new BABYLON.Texture("/img/templates/Smoke30Frames.png", this.scene);
        ps.minEmitBox = new BABYLON.Vector3(-1500, -1000, -1500);
        ps.maxEmitBox = new BABYLON.Vector3(1500, 1000, 1500);
        ps.minSize = 1; ps.maxSize = 3;
        ps.updateSpeed = 0.005;
        ps.color1 = new BABYLON.Color4(1, 1, 1, 0.4);
        ps.color2 = new BABYLON.Color4(1, 1, 1, 0.1);
        return ps;
    }
    renderDust(bass) {
        this.systems.dust.updateSpeed = 0.005 + bass * 0.05;
    }

    // --- CRYSTALS ---
    initCrystals() {
        const sps = new BABYLON.SolidParticleSystem("crystals", this.scene);
        const crystal = BABYLON.MeshBuilder.CreatePolyhedron("c", { type: 4, size: 10 }, this.scene);
        sps.addShape(crystal, 30);
        crystal.dispose();
        const mesh = sps.buildMesh();
        const mat = new BABYLON.StandardMaterial("cMat", this.scene);
        mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        mat.alpha = 0.6;
        mat.disableLighting = true;
        mesh.material = mat;
        return { sps, mesh, mat };
    }
    renderCrystals(bass, treble, config) {
        const sys = this.systems.crystals;
        const color = config.light;
        sys.mat.emissiveColor.set(color.r/255, color.g/255, color.b/255);
        for (let p = 0; p < sys.sps.nbParticles; p++) {
            const part = sys.sps.particles[p];
            if (!part.rotVel) part.rotVel = new BABYLON.Vector3(Math.random()*0.05, Math.random()*0.05, Math.random()*0.05);
            part.rotation.addInPlace(part.rotVel.scale(1 + treble * 10));
            part.scaling.setAll(1 + bass * 2);
        }
        sys.sps.setParticles();
    }

    // --- VIGNETTE ---
    initVignette() {
        const mesh = BABYLON.MeshBuilder.CreatePlane("vignette", { size: 1 }, this.scene);
        mesh.scaling.set(2000, 2000, 1);
        mesh.position.z = -100;
        mesh.parent = this.scene.activeCamera;
        const mat = new BABYLON.StandardMaterial("vMat", this.scene);
        const dt = new BABYLON.DynamicTexture("vTex", 512, this.scene);
        const ctx = dt.getContext();
        const grad = ctx.createRadialGradient(256, 256, 100, 256, 256, 300);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, "black");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);
        dt.update();
        mat.opacityTexture = dt;
        mat.diffuseColor = new BABYLON.Color3(0, 0, 0);
        mat.disableLighting = true;
        mesh.material = mat;
        return { mesh, mat };
    }
    renderVignette(bass) {
        this.systems.vignette.mat.alpha = 0.5 + bass * 0.5;
    }

    // --- BLOOM ---
    initBloom() {
        return { intensity: 1 };
    }
    renderBloom(bass) {
        if (this.scene.glowLayer) {
            this.scene.glowLayer.intensity = 1.0 + bass * 4.0;
        }
    }
}

export default new EffectsManager();

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
    }

    init(scene) {
        this.scene = scene;
        this.systems = {
            smoke: this.initSmoke(),
            thunder: this.initThunder(),
            birds: this.initBirds()
        };
    }

    update(activeEffectNames) {
        this.activeEffects = new Set(activeEffectNames);
        
        Object.keys(this.systems).forEach(name => {
            const system = this.systems[name];
            if (this.activeEffects.has(name)) {
                if (system.start) system.start();
                if (system.mesh) system.mesh.isVisible = true;
            } else {
                if (system.stop) system.stop();
                if (system.mesh) system.mesh.isVisible = false;
            }
        });
    }

    render(fft, config) {
        if (this.activeEffects.size === 0) return;

        let bass = 0;
        const bassEnd = Math.min(fft.length, 10);
        for (let i = 0; i < bassEnd; i++) bass += fft[i];
        bass = (bass / bassEnd) / 255;

        let treble = 0;
        const trebleStart = Math.max(0, fft.length - 20);
        for (let i = trebleStart; i < fft.length; i++) treble += fft[i];
        treble = (treble / 20) / 255;

        if (this.activeEffects.has('smoke')) this.renderSmoke(bass, treble, config);
        if (this.activeEffects.has('thunder')) this.renderThunder(bass, treble, config);
        if (this.activeEffects.has('birds')) this.renderBirds(bass, treble, config);
    }

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
        smokeSystem.addSizeGradient(0.5, 350, 500);
        smokeSystem.addSizeGradient(1.0, 400, 600);

        smokeSystem.addVelocityGradient(0, 0.8, 1.2);
        smokeSystem.addVelocityGradient(1, 0.2, 0.4);

        smokeSystem.minAngularSpeed = -0.3;
        smokeSystem.maxAngularSpeed = 0.3;
        smokeSystem.minInitialRotation = 0;
        smokeSystem.maxInitialRotation = Math.PI * 2;

        smokeSystem.minLifeTime = 5;
        smokeSystem.maxLifeTime = 10;
        smokeSystem.emitRate = 80; 
        
        smokeSystem.gravity = new BABYLON.Vector3(0, 3, 0);
        smokeSystem.direction1 = new BABYLON.Vector3(-0.2, 1, -0.2);
        smokeSystem.direction2 = new BABYLON.Vector3(0.2, 1, 0.2);
        
        smokeSystem.minEmitPower = 0.3;
        smokeSystem.maxEmitPower = 1.0;
        smokeSystem.updateSpeed = 0.008;

        // Initialize colors to avoid gradient calls in render if possible
        smokeSystem.color1 = new BABYLON.Color4(1, 1, 1, 0);
        smokeSystem.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
        smokeSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);

        return smokeSystem;
    }

    renderSmoke(bass, treble, config) {
        const system = this.systems.smoke;
        system.emitRate = 60 + bass * 200;
        
        const color = config.colors;
        const peakOpacity = 0.12 + bass * 0.25;
        
        // Only update colors if needed, using pre-allocated Color4
        // To avoid expensive gradient updates, we update color1/color2 directly
        // which works well for standard particle systems.
        system.color1.set(color.r/255, color.g/255, color.b/255, 0);
        system.color2.set(color.r/255, color.g/255, color.b/255, peakOpacity);
    }

    initThunder() {
        const light = new BABYLON.HemisphericLight("thunderLight", new BABYLON.Vector3(0, 1, 0), this.scene);
        light.intensity = 0;
        return { 
            light, 
            lastFlash: 0,
            flashDuration: 0,
            start: () => {}, 
            stop: () => { light.intensity = 0; } 
        };
    }

    renderThunder(bass, treble, config) {
        const system = this.systems.thunder;
        const now = Date.now();
        
        if (bass > 0.85 && now - system.lastFlash > 1000) {
            system.lastFlash = now;
            system.flashDuration = 100 + Math.random() * 200;
        }

        if (now - system.lastFlash < system.flashDuration) {
            system.light.intensity = Math.random() * 5;
            system.light.diffuse.set(1, 1, 1);
        } else {
            system.light.intensity = 0;
        }
    }

    initBirds() {
        const sps = new BABYLON.SolidParticleSystem("birds", this.scene);
        const triangle = BABYLON.MeshBuilder.CreateCylinder("t", { tessellation: 3, diameter: 5, height: 10 }, this.scene);
        triangle.rotation.x = Math.PI / 2;
        sps.addShape(triangle, 50);
        triangle.dispose();
        const mesh = sps.buildMesh();
        mesh.material = new BABYLON.StandardMaterial("birdMat", this.scene);
        mesh.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        mesh.material.disableLighting = true;

        sps.initParticles = () => {
            for (let p = 0; p < sps.nbParticles; p++) {
                const part = sps.particles[p];
                part.position.set(Math.random()*1000-500, Math.random()*500-250, Math.random()*1000-500);
                part.velocity = new BABYLON.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).scale(5);
                part.rotation.set(Math.random(), Math.random(), Math.random());
            }
        };
        sps.initParticles();
        sps.setParticles();

        return { 
            sps, 
            mesh,
            start: () => { mesh.isVisible = true; },
            stop: () => { mesh.isVisible = false; }
        };
    }

    renderBirds(bass, treble, config) {
        const system = this.systems.birds;
        const sps = system.sps;
        const color = config.light;
        
        system.mesh.material.emissiveColor.set(color.r/255, color.g/255, color.b/255);

        const now = Date.now();
        const speedBoost = 1 + bass * 5;
        const flapIntensity = 1 + treble * 5;

        for (let p = 0; p < sps.nbParticles; p++) {
            const part = sps.particles[p];
            
            part.position.x += part.velocity.x * speedBoost;
            part.position.y += part.velocity.y * speedBoost;
            part.position.z += part.velocity.z * speedBoost;
            
            // Boundary check
            if (Math.abs(part.position.x) > 1000) part.position.x *= -0.9;
            if (Math.abs(part.position.y) > 600) part.position.y *= -0.9;
            if (Math.abs(part.position.z) > 1000) part.position.z *= -0.9;

            // Flapping effect (scaling)
            const flap = 1 + Math.sin(now * 0.01 + p) * 0.5 * flapIntensity;
            part.scaling.set(flap, 1, 1);
            
            part.rotation.y += 0.01;
        }
        sps.setParticles();
    }
}

export default new EffectsManager();

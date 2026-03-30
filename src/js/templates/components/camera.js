import * as BABYLON from "babylonjs";

let camera;
let config;
let targetRadius = 320;
let currentRadius = 320;
let alphaVelocity = 0.001;
let t = 0;
let initialTarget = new BABYLON.Vector3(0, 0, 0);
let isLocked = false;

export default {
  init(c, configuration) {
    camera = c;
    config = configuration;
    isLocked = false; // Reset lock on init
    
    if (camera) {
      this.initialRadius = Number(camera.radius) || 320;
      this.initialBeta = Number(camera.beta) || Math.PI / 4;
      this.initialAlpha = Number(camera.alpha) || 0;
      
      if (camera.target) {
        initialTarget.copyFrom(camera.target);
      } else {
        initialTarget.set(0, 0, 0);
      }
      
      targetRadius = this.initialRadius;
      currentRadius = this.initialRadius;
      alphaVelocity = 0.001;
      t = 0;
    }
  },

  lock() {
    isLocked = true;
  },

  unlock() {
    isLocked = false;
  },

  render(fft) {
    if (!camera || !config || !camera.position || isLocked) return;

    // Calculate Bass intensity safely
    let bass = 0;
    if (fft && fft.length > 0) {
      const bassBins = Math.min(fft.length, 10);
      for (let i = 0; i < bassBins; i++) bass += fft[i];
      bass = (bass / bassBins) / 255;
    }
    
    if (isNaN(bass)) bass = 0;

    const isMoving = config.options && config.options.camera && config.options.camera.move;
    const sensitivity = (config.sensitivity && config.sensitivity.bassBoost) ? config.sensitivity.bassBoost : 1.0;
    const smoothBass = bass * sensitivity;

    try {
      if (isMoving) {
        t += 0.005;

        // 1. Dynamic Rotation Speed (EXTREMELY SLOW)
        const targetAlphaVel = 0.0002 + (smoothBass * 0.004);
        alphaVelocity += (targetAlphaVel - alphaVelocity) * 0.05;
        camera.alpha = (camera.alpha || 0) + (alphaVelocity || 0.0002);

        // 2. Vertical "Wobble" (Beta)
        const targetBeta = (this.initialBeta || Math.PI/4) + Math.sin(t * 0.5) * 0.1 + (smoothBass * 0.05);
        camera.beta += (targetBeta - camera.beta) * 0.05;

        // 3. Reactive Zoom (Radius)
        const baseRadius = this.initialRadius || 320;
        const zoomTarget = baseRadius - (smoothBass * 70);
        camera.radius += (zoomTarget - camera.radius) * 0.1;
        
      } else {
        alphaVelocity *= 0.95;
        camera.alpha += (alphaVelocity || 0);
        const baseRadius = this.initialRadius || 320;
        camera.radius += (baseRadius - camera.radius) * 0.05;
      }

      // 4. Subtle Screen Shake
      if (camera.target) {
        if (smoothBass > 0.8) {
          camera.target.x = initialTarget.x + (Math.random() - 0.5) * (smoothBass * 10);
          camera.target.y = initialTarget.y + (Math.random() - 0.5) * (smoothBass * 10);
          camera.target.z = initialTarget.z + (Math.random() - 0.5) * (smoothBass * 10);
        } else {
          camera.target.x += (initialTarget.x - camera.target.x) * 0.1;
          camera.target.y += (initialTarget.y - camera.target.y) * 0.1;
          camera.target.z += (initialTarget.z - camera.target.z) * 0.1;
          
          if (BABYLON.Vector3.Distance(camera.target, initialTarget) < 0.01) {
            camera.target.copyFrom(initialTarget);
          }
        }
      }

      // Final Safety
      if (isNaN(camera.alpha)) camera.alpha = this.initialAlpha || 0;
      if (isNaN(camera.beta)) camera.beta = this.initialBeta || Math.PI/4;
      if (isNaN(camera.radius)) camera.radius = this.initialRadius || 320;

    } catch (e) {
      console.warn("Camera render safety triggered:", e.message);
    }
  }
};

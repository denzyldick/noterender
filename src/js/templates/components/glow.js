import * as BABYLON from "babylonjs";
import { getGlowOptions } from "@/js/perf";

export function ensureGlow(scene, intensity) {
  let glow = scene.glowLayer;
  if (!glow) {
    glow = new BABYLON.GlowLayer("glow", scene, getGlowOptions());
  }
  if (typeof intensity === "number") glow.intensity = intensity;
  return glow;
}
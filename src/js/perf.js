let cached = null;

function detect() {
  const dpr = typeof window !== "undefined" && window.devicePixelRatio
    ? window.devicePixelRatio
    : 1;
  const cores = typeof navigator !== "undefined" && navigator.hardwareConcurrency
    ? navigator.hardwareConcurrency
    : 0;
  const mem = typeof navigator !== "undefined" && navigator.deviceMemory
    ? navigator.deviceMemory
    : 4;
  const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  let score = (cores * 10 + mem * 4) / (dpr * dpr);
  if (isMobile) score *= 0.35;

  let tier = "high";
  if (score <= 12) tier = "low";
  else if (score <= 32) tier = "medium";

  return { dpr, cores, mem, isMobile, tier };
}

const TIERS = {
  low: {
    glowKernel: 12,
    glowRatio: 0.2,
    maxRender: 1280,
    particleScale: 0.4
  },
  medium: {
    glowKernel: 16,
    glowRatio: 0.3,
    maxRender: 1600,
    particleScale: 0.7
  },
  high: {
    glowKernel: 24,
    glowRatio: 0.4,
    maxRender: 1920,
    particleScale: 1.0
  }
};

export function getPerf() {
  if (!cached) {
    const d = detect();
    cached = Object.assign({}, d, TIERS[d.tier]);
  }
  return cached;
}

export function getGlowOptions() {
  const p = getPerf();
  return { blurKernelSize: p.glowKernel, mainTextureRatio: p.glowRatio };
}

export function capKernel(size) {
  const p = getPerf();
  return Math.min(size || p.glowKernel, p.glowKernel);
}

export function scaled(count) {
  const p = getPerf();
  return Math.max(4, Math.round((count || 0) * p.particleScale));
}

export function computeRenderScale(canvas, cap) {
  const p = getPerf();
  const maxSide = cap || p.maxRender;
  const w = canvas
    ? canvas.clientWidth || canvas.width || window.innerWidth
    : window.innerWidth || 1280;
  const h = canvas
    ? canvas.clientHeight || canvas.height || window.innerHeight
    : window.innerHeight || 720;
  const longest = Math.max(w, h);
  if (!longest) return 1;
  return Math.max(Math.min(1, maxSide / longest), 0.25);
}
import * as GUI from "babylonjs-gui";
import * as BABYLON from "babylonjs";
import QRCode from "qrcode";

let advancedTexture;
let text1;
let text2;
let qrContainer;
let qrImage;

let qrPanel;
let qrRing;
let scanLine;
let qrLabel;
let liveChip;
let liveDot;
let metaText;
let feedRows = [];

let announcementText;
let announcementTimer = null;

let shoutoutText;
let shoutoutQueue = [];
let shoutoutIdx = 0;
let shoutoutTimer = null;

let currentScale = 1;
let screenWidth = 1920;
let screenHeight = 1080;

let liveState = false;
let liveStartedAt = 0;
let engagementCount = 0;

const ACCENT = "#00E5FF";
const PANEL_MARGIN = 28;

const lerp = (a, b, t) => a + (b - a) * t;

const getCornerPos = (idx, w, h, size) => {
  const margin = 40 * currentScale;
  if (idx === 0) return { x: w - size - margin, y: h - size - margin };
  if (idx === 1) return { x: w - size - margin, y: margin };
  if (idx === 2) return { x: margin, y: margin };
  return { x: w - size - margin, y: h - size - margin };
};

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function fmtUptime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function animateRow(row, birth) {
  const age = performance.now() - birth;
  const IN = 420;
  const OUT = 900;
  const LIFE = 7000;
  const j = row.index;
  const baseY = row.baseTop;

  let offset = 0;
  let alpha = 1;

  if (age < IN) {
    const t = easeOut(age / IN);
    alpha = t;
    offset = lerp(26, 0, t);
  } else if (age > LIFE - OUT) {
    const t = (age - (LIFE - OUT)) / OUT;
    alpha = 1 - t;
  }

  row.holder.alpha = alpha;
  row.holder.topInPixels = (baseY + offset);
  if (age >= LIFE) row.holder.isVisible = false;
}

function layout() {
  if (!qrPanel) return;

  const qrSize = 190 * currentScale;
  const panelW = 264 * currentScale;
  const padding = 18 * currentScale;
  const labelH = 22 * currentScale;
  const chipH = 26 * currentScale;
  const rowH = 56 * currentScale;
  const gap = 10 * currentScale;

  const feedVisible = feedRows.some((r) => r.holder.isVisible);
  const panelH = padding
    + qrSize
    + gap
    + labelH
    + (liveChip.isVisible ? chipH + gap : 0)
    + (feedVisible ? feedRows.filter((r) => r.holder.isVisible).length * (rowH + gap) : 0)
    + padding;

  qrPanel.width = panelW + "px";
  qrPanel.height = panelH + "px";
  qrPanel.leftInPixels = PANEL_MARGIN * currentScale;
  qrPanel.topInPixels = PANEL_MARGIN * currentScale;

  qrContainer.width = qrSize + "px";
  qrContainer.height = qrSize + "px";
  qrContainer.topInPixels = padding;
  qrContainer.leftInPixels = (panelW - qrSize) / 2;

  qrRing.width = (qrSize + 24 * currentScale) + "px";
  qrRing.height = (qrSize + 24 * currentScale) + "px";
  qrRing.leftInPixels = (panelW - (qrSize + 24 * currentScale)) / 2;
  qrRing.topInPixels = padding - 12 * currentScale;

  scanLine.width = qrSize + "px";
  scanLine.leftInPixels = (panelW - qrSize) / 2;

  qrLabel.topInPixels = padding + qrSize + gap;
  qrLabel.fontSize = Math.max(10, 14 * currentScale);

  liveChip.topInPixels = padding + qrSize + gap + labelH + gap * 0.5;
  liveDot.width = (8 * currentScale) + "px";
  liveDot.height = (8 * currentScale) + "px";
  liveDot.leftInPixels = padding - 4 * currentScale;

  metaText.topInPixels = padding + qrSize + gap + labelH + (liveChip.isVisible ? chipH + gap : gap);

  let feedY = metaText.topInPixels + 18 * currentScale;
  feedRows.forEach((row) => {
    row.baseTop = feedY;
    row.holder.width = (panelW - padding * 2) + "px";
    row.holder.height = rowH + "px";
    row.holder.leftInPixels = padding;
    row.name.block.fontSize = Math.max(9, 13 * currentScale);
    row.msg.block.fontSize = Math.max(8, 11 * currentScale);
    row.name.block.topInPixels = 6 * currentScale;
    row.msg.block.topInPixels = 26 * currentScale;
    feedY += rowH + gap;
  });
}

export default {
  async init(scene, title, subtitle, width, height) {
    if (advancedTexture) {
      advancedTexture.dispose();
    }

    screenWidth = width || 1920;
    screenHeight = height || 1080;
    advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);

    const baseScale = Math.min(screenWidth / 1920, screenHeight / 1080);
    currentScale = (isNaN(baseScale) || baseScale <= 0) ? 1 : baseScale * 1.2;

    // Title
    text1 = new GUI.TextBlock();
    text1.text = title || "";
    text1.color = "white";
    text1.fontSize = Math.max(24, 80 * currentScale);
    text1.fontFamily = "Roboto, Arial";
    text1.fontWeight = "bold";
    text1.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    text1.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    text1.paddingBottom = (80 * currentScale) + "px";
    text1.paddingLeft = (60 * currentScale) + "px";
    text1.outlineColor = "black";
    text1.outlineWidth = 4;

    // Subtitle
    text2 = new GUI.TextBlock();
    text2.text = subtitle || "";
    text2.color = "rgba(255,255,255,0.8)";
    text2.fontSize = Math.max(12, 30 * currentScale);
    text2.fontFamily = "Roboto, Arial";
    text2.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    text2.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    text2.paddingBottom = (45 * currentScale) + "px";
    text2.paddingLeft = (60 * currentScale) + "px";
    text2.outlineColor = "black";
    text2.outlineWidth = 2;

    // ---------- Live Engagement panel (glass card, top-left) ----------
    qrPanel = new GUI.Rectangle("qrPanel");
    qrPanel.background = "rgba(10, 14, 22, 0.62)";
    qrPanel.thickness = 1;
    qrPanel.borderColor = "rgba(0, 229, 255, 0.35)";
    qrPanel.cornerRadius = 20;
    qrPanel.shadowColor = "rgba(0, 229, 255, 0.25)";
    qrPanel.shadowBlur = 30;
    qrPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    qrPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    advancedTexture.addControl(qrPanel);

    // Pulsing ring behind the QR tile
    qrRing = new GUI.Rectangle("qrRing");
    qrRing.background = "transparent";
    qrRing.thickness = 2;
    qrRing.borderColor = ACCENT;
    qrRing.cornerRadius = 22;
    qrRing.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    qrRing.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    qrPanel.addControl(qrRing);

    // Scanning shimmer line
    scanLine = new GUI.Rectangle("qrScan");
    scanLine.height = (4 * currentScale) + "px";
    scanLine.background = "rgba(0, 229, 255, 0.55)";
    scanLine.thickness = 0;
    scanLine.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    scanLine.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    qrPanel.addControl(scanLine);

    // QR tile
    const qrSize = 190 * currentScale;
    qrContainer = new GUI.Rectangle("qrRect");
    qrContainer.background = "white";
    qrContainer.thickness = 0;
    qrContainer.cornerRadius = 14;
    qrContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    qrContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    qrPanel.addControl(qrContainer);

    const qrDataUrl = await QRCode.toDataURL("https://noterender.denzyl.io?utm_source=watermark&utm_medium=qr&utm_campaign=video_watermark", {
      margin: 1, width: 280, color: { dark: "#0A0E16", light: "#ffffff" }
    });

    qrImage = new GUI.Image("qr", qrDataUrl);
    qrImage.stretch = GUI.Image.STRETCH_UNIFORM;
    qrImage.paddingTop = "6px";
    qrImage.paddingBottom = "6px";
    qrImage.paddingLeft = "6px";
    qrImage.paddingRight = "6px";
    qrContainer.addControl(qrImage);

    // "SCAN TO JOIN" label
    qrLabel = new GUI.TextBlock();
    qrLabel.text = "SCAN TO JOIN";
    qrLabel.color = ACCENT;
    qrLabel.fontFamily = "Roboto, Arial";
    qrLabel.fontWeight = "bold";
    qrLabel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    qrLabel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    qrLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    qrPanel.addControl(qrLabel);

    // LIVE chip
    liveChip = new GUI.Rectangle("qrLiveChip");
    liveChip.background = "rgba(255, 38, 38, 0.22)";
    liveChip.thickness = 1;
    liveChip.borderColor = "rgba(255, 38, 38, 0.8)";
    liveChip.cornerRadius = 13;
    liveChip.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    liveChip.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    liveChip.isVisible = false;
    qrPanel.addControl(liveChip);

    liveDot = new GUI.Rectangle("qrLiveDot");
    liveDot.background = "#FF2626";
    liveDot.thickness = 0;
    liveDot.cornerRadius = 4;
    liveDot.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    liveDot.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    liveChip.addControl(liveDot);

    const liveLabel = new GUI.TextBlock();
    liveLabel.text = "LIVE";
    liveLabel.color = "#FF2626";
    liveLabel.fontFamily = "Roboto, Arial";
    liveLabel.fontWeight = "bold";
    liveLabel.fontSize = Math.max(9, 12 * currentScale);
    liveLabel.leftInPixels = 14 * currentScale;
    liveLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    liveLabel.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    liveChip.addControl(liveLabel);

    // Meta line: shoutout count + uptime
    metaText = new GUI.TextBlock();
    metaText.text = "";
    metaText.color = "rgba(255,255,255,0.75)";
    metaText.fontFamily = "Roboto, Arial";
    metaText.fontSize = Math.max(10, 13 * currentScale);
    metaText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    metaText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    metaText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    qrPanel.addControl(metaText);

    // Live activity feed (recent shoutout rows)
    feedRows = [];
    for (let i = 0; i < 3; i++) {
      const pill = new GUI.Rectangle("feedRow" + i);
      pill.background = "rgba(0,0,0,0.45)";
      pill.thickness = 1;
      pill.borderColor = "rgba(255,255,255,0.12)";
      pill.cornerRadius = 10;
      pill.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      pill.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      pill.isVisible = false;
      qrPanel.addControl(pill);

      const name = new GUI.TextBlock();
      name.color = ACCENT;
      name.fontFamily = "Roboto, Arial";
      name.fontWeight = "bold";
      name.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      name.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
      name.paddingLeft = (12 * currentScale) + "px";
      name.clipChildren = true;
      name.clipContent = true;
      pill.addControl(name);

      const msg = new GUI.TextBlock();
      msg.color = "rgba(255,255,255,0.88)";
      msg.fontFamily = "Roboto, Arial";
      msg.textWrapping = true;
      msg.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      msg.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
      msg.paddingLeft = (12 * currentScale) + "px";
      msg.clipChildren = true;
      msg.clipContent = true;
      pill.addControl(msg);

      feedRows.push({ holder: pill, name, msg, active: false, birth: 0, baseTop: 0, index: i });
    }

    // Announcement overlay (big centered text)
    announcementText = new GUI.TextBlock();
    announcementText.text = "";
    announcementText.color = "white";
    announcementText.fontSize = Math.max(32, 120 * currentScale);
    announcementText.fontFamily = "Roboto, Arial";
    announcementText.fontWeight = "bold";
    announcementText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    announcementText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    announcementText.outlineColor = "black";
    announcementText.outlineWidth = 8;
    announcementText.shadowColor = "rgba(0,0,0,0.8)";
    announcementText.shadowBlur = 30;
    announcementText.isVisible = false;

    // Shoutout ticker (bottom center)
    shoutoutText = new GUI.TextBlock();
    shoutoutText.text = "";
    shoutoutText.color = "rgba(255,255,255,0.9)";
    shoutoutText.fontSize = Math.max(18, 40 * currentScale);
    shoutoutText.fontFamily = "Roboto, Arial";
    shoutoutText.fontWeight = "600";
    shoutoutText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    shoutoutText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    shoutoutText.paddingBottom = (20 * currentScale) + "px";
    shoutoutText.outlineColor = "black";
    shoutoutText.outlineWidth = 3;
    shoutoutText.isVisible = false;

    advancedTexture.addControl(text1);
    advancedTexture.addControl(text2);
    advancedTexture.addControl(announcementText);
    advancedTexture.addControl(shoutoutText);

    metaText.text = "0 in";
    layout();
  },

  resize(width, height) {
    if (!text1 || !text2 || !qrContainer) return;
    screenWidth = width;
    screenHeight = height;
    currentScale = Math.min(screenWidth / 1920, screenHeight / 1080) * 1.2 || 1;

    text1.fontSize = Math.max(24, 80 * currentScale);
    text1.paddingBottom = (80 * currentScale) + "px";
    text1.paddingLeft = (60 * currentScale) + "px";

    text2.fontSize = Math.max(12, 30 * currentScale);
    text2.paddingBottom = (45 * currentScale) + "px";
    text2.paddingLeft = (60 * currentScale) + "px";

    if (announcementText) announcementText.fontSize = Math.max(32, 120 * currentScale);
    if (shoutoutText) shoutoutText.fontSize = Math.max(18, 40 * currentScale);

    layout();
  },

  render() {
    if (!qrPanel) return;

    const now = performance.now();
    const t = now / 1000;

    // Slow spin + breathing glow + pulsing scan on the QR ring
    qrRing.rotation = t * 0.35;
    qrRing.shadowBlur = 24 + Math.sin(t * 2.4) * 12;
    qrRing.alpha = 0.85 + Math.sin(t * 2.4) * 0.15;

    // Scanning shimmer sweeps the QR
    const scanTop = 18 * currentScale + ((now / 1400) % 1) * (18 * currentScale + 44 * currentScale);
    scanLine.topInPixels = scanTop;
    scanLine.alpha = 0.35 + Math.sin(t * 6) * 0.25;

    // LIVE dot heartbeat
    if (liveChip.isVisible) {
      liveDot.alpha = 0.35 + Math.abs(Math.sin(t * 3)) * 0.65;
      if (liveStartedAt > 0) {
        metaText.text = `${engagementCount} in · ${fmtUptime(now - liveStartedAt)}`;
      } else {
        metaText.text = `${engagementCount} in`;
      }
    }

    feedRows.forEach((row) => {
      if (row.active && row.holder.isVisible) animateRow(row, row.birth);
    });

    qrPanel.leftInPixels = PANEL_MARGIN * currentScale;
    qrPanel.topInPixels = PANEL_MARGIN * currentScale;
  },

  update(title, subtitle, showWatermark = true) {
    if (text1) text1.text = title || "";
    if (text2) text2.text = subtitle || "";
    if (qrPanel) {
      qrPanel.isVisible = showWatermark;
      if (!showWatermark) {
        feedRows.forEach((row) => { row.holder.isVisible = false; });
      }
    }
  },

  setLiveState(live) {
    liveState = !!live;
    if (liveChip) liveChip.isVisible = liveState;
    if (liveState) {
      liveStartedAt = performance.now();
    }
    layout();
  },

  showAnnouncement(text, duration = 5) {
    if (!announcementText) return;
    if (announcementTimer) clearTimeout(announcementTimer);

    announcementText.text = text;
    announcementText.isVisible = true;

    announcementTimer = setTimeout(() => {
      announcementText.isVisible = false;
      announcementText.text = "";
    }, duration * 1000);
  },

  setQrUrl(url) {
    QRCode.toDataURL(url, { margin: 1, width: 280, color: { dark: "#0A0E16", light: "#ffffff" } })
      .then(dataUrl => {
        if (qrImage) qrImage.source = dataUrl;
      });
  },

  pushShoutouts(shoutouts) {
    shoutoutQueue = shoutouts;
    shoutoutIdx = 0;
    if (shoutoutQueue.length > 0) this.showNextShoutout();

    shoutouts.forEach((s, i) => {
      const slot = feedRows[i % feedRows.length];
      slot.active = true;
      slot.holder.isVisible = true;
      slot.birth = performance.now() - i * 300;
      slot.name.text = String(s.name || "Someone").slice(0, 28);
      slot.msg.text = String(s.message || "").slice(0, 64);
      engagementCount += 1;
    });

    if (liveState) {
      metaText.text = `${engagementCount} in · ${fmtUptime(performance.now() - liveStartedAt)}`;
    } else {
      metaText.text = `${engagementCount} in`;
    }
    layout();
  },

  showNextShoutout() {
    if (!shoutoutText || shoutoutQueue.length === 0) return;

    if (shoutoutTimer) clearTimeout(shoutoutTimer);

    const s = shoutoutQueue[shoutoutIdx];
    shoutoutText.text = `${s.name}: "${s.message}"`;
    shoutoutText.isVisible = true;

    shoutoutIdx = (shoutoutIdx + 1) % shoutoutQueue.length;

    shoutoutTimer = setTimeout(() => this.showNextShoutout(), 4000);
  },

  clearShoutouts() {
    shoutoutQueue = [];
    if (shoutoutText) shoutoutText.isVisible = false;
    if (shoutoutTimer) clearTimeout(shoutoutTimer);
    feedRows.forEach((row) => {
      row.active = false;
      row.holder.isVisible = false;
    });
    layout();
  }
};
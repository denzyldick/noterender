import * as GUI from "babylonjs-gui";
import * as BABYLON from "babylonjs";
import QRCode from "qrcode";

let advancedTexture;
let text1;
let text2;
let qrContainer;
let qrImage;

let announcementText;
let announcementTimer = null;

let shoutoutText;
let shoutoutQueue = [];
let shoutoutIdx = 0;
let shoutoutTimer = null;

let currentScale = 1;
let screenWidth = 1920;
let screenHeight = 1080;

const getCornerPos = (idx, w, h, size) => {
  const margin = 40 * currentScale;
  if (idx === 0) return { x: w - size - margin, y: h - size - margin };
  if (idx === 1) return { x: w - size - margin, y: margin };
  if (idx === 2) return { x: margin, y: margin };
  return { x: w - size - margin, y: h - size - margin };
};

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

    // QR Code
    const qrSize = 180 * currentScale;
    qrContainer = new GUI.Rectangle("qrRect");
    qrContainer.width = qrSize + "px";
    qrContainer.height = qrSize + "px";
    qrContainer.thickness = 0;
    qrContainer.background = "white";
    qrContainer.cornerRadius = 16;
    qrContainer.shadowColor = "black";
    qrContainer.shadowBlur = 20;
    qrContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    qrContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

    const qrDataUrl = await QRCode.toDataURL("https://noterender.denzyl.io?utm_source=watermark", {
      margin: 1, width: 250, color: { dark: "#000000", light: "#ffffff" }
    });

    qrImage = new GUI.Image("qr", qrDataUrl);
    qrImage.stretch = GUI.Image.STRETCH_UNIFORM;
    qrContainer.addControl(qrImage);

    const startPos = getCornerPos(0, screenWidth, screenHeight, qrSize);
    qrContainer.leftInPixels = startPos.x;
    qrContainer.topInPixels = startPos.y;

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
    advancedTexture.addControl(qrContainer);
    advancedTexture.addControl(announcementText);
    advancedTexture.addControl(shoutoutText);
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

    const qrSize = 180 * currentScale;
    qrContainer.width = qrSize + "px";
    qrContainer.height = qrSize + "px";

    const pos = getCornerPos(0, screenWidth, screenHeight, qrSize);
    qrContainer.leftInPixels = pos.x;
    qrContainer.topInPixels = pos.y;
  },

  render() {
    if (!qrContainer) return;
    const qrSize = 180 * currentScale;
    const target = getCornerPos(0, screenWidth, screenHeight, qrSize);
    qrContainer.leftInPixels = target.x;
    qrContainer.topInPixels = target.y;
  },

  update(title, subtitle, showWatermark = true) {
    if (text1) text1.text = title || "";
    if (text2) text2.text = subtitle || "";
    if (qrContainer) qrContainer.isVisible = showWatermark;
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
    QRCode.toDataURL(url, { margin: 1, width: 250, color: { dark: "#000000", light: "#ffffff" } })
      .then(dataUrl => {
        if (qrImage) qrImage.source = dataUrl;
      });
  },

  pushShoutouts(shoutouts) {
    shoutoutQueue = shoutouts;
    shoutoutIdx = 0;
    if (shoutoutQueue.length > 0) this.showNextShoutout();
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
  }
};

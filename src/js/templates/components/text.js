import * as GUI from "babylonjs-gui";
import * as BABYLON from "babylonjs";
import QRCode from "qrcode";

let advancedTexture;
let text1;
let text2;
let qrContainer;
let qrImage;

let currentScale = 1;
let screenWidth = 1920;
let screenHeight = 1080;

let moveTimer = 0;
let currentTargetIdx = 1; 
let posX = 0;
let posY = 0;

// corners: 0: BR, 1: TR, 2: TL
const getCornerPos = (idx, w, h, size) => {
    const margin = 40 * currentScale;
    if (idx === 0) return { x: w - size - margin, y: h - size - margin }; // BR
    if (idx === 1) return { x: w - size - margin, y: margin }; // TR
    if (idx === 2) return { x: margin, y: margin }; // TL
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
    currentScale = screenWidth / 1920;

    // --- Title & Subtitle ---
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

    // --- BIG QR Code Only ---
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
        margin: 1,
        width: 250,
        color: { dark: "#000000", light: "#ffffff" }
    });

    qrImage = new GUI.Image("qr", qrDataUrl);
    qrImage.stretch = GUI.Image.STRETCH_UNIFORM;
    qrContainer.addControl(qrImage);

    // Initial Position
    const startPos = getCornerPos(0, screenWidth, screenHeight, qrSize);
    posX = startPos.x;
    posY = startPos.y;
    qrContainer.leftInPixels = posX;
    qrContainer.topInPixels = posY;

    advancedTexture.addControl(text1);
    advancedTexture.addControl(text2);
    advancedTexture.addControl(qrContainer);
  },

  resize(width, height) {
    if (!text1 || !text2 || !qrContainer) return;
    screenWidth = width;
    screenHeight = height;
    currentScale = screenWidth / 1920;

    text1.fontSize = Math.max(24, 80 * currentScale);
    text1.paddingBottom = (80 * currentScale) + "px";
    text1.paddingLeft = (60 * currentScale) + "px";

    text2.fontSize = Math.max(12, 30 * currentScale);
    text2.paddingBottom = (45 * currentScale) + "px";
    text2.paddingLeft = (60 * currentScale) + "px";

    const qrSize = 180 * currentScale;
    qrContainer.width = qrSize + "px";
    qrContainer.height = qrSize + "px";

    const pos = getCornerPos(currentTargetIdx, screenWidth, screenHeight, qrSize);
    posX = pos.x; posY = pos.y;
    qrContainer.leftInPixels = posX;
    qrContainer.topInPixels = posY;
  },

  render() {
    if (!qrContainer) return;
    
    moveTimer += 0.016; 
    if (moveTimer > 8) {
        moveTimer = 0;
        currentTargetIdx = (currentTargetIdx + 1) % 3;
    }

    const qrSize = 180 * currentScale;
    const target = getCornerPos(currentTargetIdx, screenWidth, screenHeight, qrSize);
    
    posX += (target.x - posX) * 0.015;
    posY += (target.y - posY) * 0.015;

    qrContainer.leftInPixels = posX;
    qrContainer.topInPixels = posY;
  },

  update(title, subtitle, showWatermark = true) {
    if (text1) text1.text = title || "";
    if (text2) text2.text = subtitle || "";
    if (qrContainer) qrContainer.isVisible = showWatermark;
  }
};

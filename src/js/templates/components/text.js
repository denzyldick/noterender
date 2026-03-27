import * as GUI from "babylonjs-gui";
import * as BABYLON from "babylonjs";

let advancedTexture;
let text1;
let text2;

export default {
  init(scene, title, subtitle) {
    // Dispose previous UI if exists
    if (advancedTexture) {
        advancedTexture.dispose();
    }

    advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);

    text1 = new GUI.TextBlock();
    text1.text = title || "";
    text1.color = "white";
    text1.fontSize = 80;
    text1.fontFamily = "Roboto, Arial";
    text1.fontWeight = "bold";
    text1.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    text1.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    text1.paddingBottom = "80px";
    text1.paddingLeft = "60px";
    text1.outlineColor = "black";
    text1.outlineWidth = 4;
    text1.shadowColor = "rgba(0,0,0,0.5)";
    text1.shadowBlur = 10;

    text2 = new GUI.TextBlock();
    text2.text = subtitle || "";
    text2.color = "rgba(255,255,255,0.8)";
    text2.fontSize = 30;
    text2.fontFamily = "Roboto, Arial";
    text2.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    text2.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    text2.paddingBottom = "45px";
    text2.paddingLeft = "60px";
    text2.outlineColor = "black";
    text2.outlineWidth = 2;

    advancedTexture.addControl(text1);
    advancedTexture.addControl(text2);
  },

  update(title, subtitle) {
    if (text1) text1.text = title || "";
    if (text2) text2.text = subtitle || "";
  }
};

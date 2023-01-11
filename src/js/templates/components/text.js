import * as GUI from "babylonjs-gui";
import * as BABYLON from "babylonjs";

let SCENE;

export default {
  /**
   *
   * @param {BABYLON.Scene} scene
   * @param title
   * @param subtitle
   */
  init(scene, title, subtitle) {
    this.title = title;
    this.subtitle = subtitle;
    let advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    let text1 = new GUI.TextBlock();
    text1.text = title;
    text1.color = "white";
    text1.fontSize = 80;
    text1.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    text1.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    text1.paddingBottom = 60;
    text1.paddingLeft = 60;
    text1.outlineColor = "black";
    text1.outlineWidth = 3;

    let text2 = new GUI.TextBlock();
    text2.text = subtitle;
    text2.color = "white";
    text2.fontSize = 40;
    text2.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    text2.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    text2.paddingBottom = 30;
    text2.paddingLeft = 60;
    text2.outlineColor = "black";
    text2.outlineWidth = 3;

    advancedTexture.addControl(text2);
    advancedTexture.addControl(text1);
  },
  render() {},
};

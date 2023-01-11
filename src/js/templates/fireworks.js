import BABYLON from "babylonjs";

let fireworks = function () {
  const light = new BABYLON.DirectionalLight(
    "DirectionalLight",
    new BABYLON.Vector3(0, -1, 1),
    this.scene
  );
  const light2 = new BABYLON.HemisphericLight(
    "HemiLight",
    new BABYLON.Vector3(0, 1, 0),
    this.scene
  );
  light2.intensity = 0.5;

  BABYLON.Effect.ShadersStore["customVertexShader"] =
    "\r\n" +
    "precision highp float;\r\n" +
    "// Attributes\r\n" +
    "attribute vec3 position;\r\n" +
    "attribute vec3 normal;\r\n" +
    "// Uniforms\r\n" +
    "uniform mat4 worldViewProjection;\r\n" +
    "uniform float time;\r\n" +
    "void main(void) {\r\n" +
    "    vec3 p = position;\r\n" +
    "    vec3 j = vec3(0., -1.0, 0.);\r\n" +
    "    p = p + normal * log2(1. + time) * 25.0;\r\n" +
    "    gl_Position = worldViewProjection * vec4(p, 1.0);\r\n" +
    "}\r\n";

  BABYLON.Effect.ShadersStore["customFragmentShader"] =
    "\r\n" +
    "precision highp float;\r\n" +
    "uniform float time;\r\n" +
    "void main(void) {\r\n" +
    "    gl_FragColor = vec4(1. - log2(1. + time)/100., 1. * log2(1. + time), 0., 1. - log2(1. + time/2.)/log2(1. + 3.95));\r\n" +
    "}\r\n";

  const shaderMaterial = new BABYLON.ShaderMaterial(
    "shader",
    this.scene,
    {
      vertex: "custom",
      fragment: "custom",
    },
    {
      attributes: ["position", "normal", "uv"],
      uniforms: [
        "world",
        "worldView",
        "worldViewProjection",
        "view",
        "projection",
      ],
      needAlphaBlending: true,
    }
  );

  shaderMaterial.backFaceCulling = false;

  this.fireWorkSphere = BABYLON.MeshBuilder.CreateSphere(
    "sphere",
    { diameter: 10 },
    this.scene
  );
  this.fireWorkSphere.convertToFlatShadedMesh();

  this.fireWorkSphere.material = shaderMaterial;

  const t = 0;
  let time = 0;
  this.scene.registerBeforeRender(() => {
    if (this.multiplierValue < 0.2 && time !== 0) {
      this.fireWorkSphere.dispose();
    } else if (
      time < 8 &&
      this.fireWorkSphere !== null &&
      this.multiplierValue > 0.2
    ) {
      this.fireWorkSphere.material.setFloat("time", time);
      time += 0.1;
    }
  });
};

export default fireworks;

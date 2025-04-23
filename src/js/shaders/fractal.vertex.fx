precision highp float;

// Attributes
attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

// Uniforms
uniform mat4 world;
uniform mat4 worldView;
uniform mat4 worldViewProjection;

// Varying
varying vec2 vUV;
varying vec3 vPosition;

void main(void) {
    vUV = uv;
    vPosition = position;
    gl_Position = worldViewProjection * vec4(position, 1.0);
} 
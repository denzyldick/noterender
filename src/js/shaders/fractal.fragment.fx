precision highp float;

// Varying
varying vec2 vUV;
varying vec3 vPosition;

// Uniforms
uniform float time;
uniform float audioIntensity;
uniform float zoom;
uniform float iterations;
uniform float colorSpeed;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main(void) {
    // Center the coordinates
    vec2 uv = vUV * 2.0 - 1.0;
    uv *= zoom;
    
    // Add some movement based on audio
    uv += vec2(sin(time * 0.5) * audioIntensity * 0.1, 
               cos(time * 0.3) * audioIntensity * 0.1);
    
    // Initialize variables for the fractal
    vec2 z = vec2(0.0);
    vec2 c = uv;
    float i;
    
    // Mandelbrot iteration
    for(i = 0.0; i < iterations; i++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        if(dot(z, z) > 4.0) break;
    }
    
    // Color calculation
    float smoothVal = i - log2(log2(dot(z, z))) + 4.0;
    vec3 color = hsv2rgb(vec3(
        mod(smoothVal * colorSpeed + time * 0.1, 1.0),
        0.8,
        0.9
    ));
    
    // Add audio-reactive glow
    color += vec3(audioIntensity * 0.2);
    
    gl_FragColor = vec4(color, 1.0);
} 
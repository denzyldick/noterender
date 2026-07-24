#import bevy_sprite::mesh2d_vertex_output::VertexOutput

@group(1) @binding(0)
var<uniform> strength: f32;

@fragment
fn fragment(input: VertexOutput) -> @location(0) vec4<f32> {
    let uv = input.uv;
    let center = vec2<f32>(0.5, 0.5);
    let dist = distance(uv, center);
    let vignette = smoothstep(0.4, 0.9, dist);
    let alpha = vignette * strength;
    return vec4<f32>(0.0, 0.0, 0.0, alpha);
}

/* Spec alias: point sprite fragment (see particle.frag.glsl). */
uniform vec3 uColor;
varying float vAlpha;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float soft = smoothstep(0.5, 0.1, d);
  gl_FragColor = vec4(uColor, vAlpha * soft);
}

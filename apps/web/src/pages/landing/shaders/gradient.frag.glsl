precision mediump float;

uniform float uTime;
uniform vec2 uMouse;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 m = uMouse * 0.06;
  float wave = sin(uv.x * 6.0 + uTime * 0.85 + m.x * 3.0) * 0.035;
  wave += sin(uv.y * 4.2 + uTime * 0.55 + m.y * 2.2) * 0.025;
  uv += wave;

  vec3 cOrange = vec3(1.0, 0.42, 0.0);
  vec3 cPurple = vec3(0.32, 0.12, 0.55);
  vec3 cBlack = vec3(0.035, 0.043, 0.055);

  float t = uv.y + sin(uv.x * 3.0 + uTime * 0.35) * 0.12;
  vec3 col = mix(cBlack, cPurple, smoothstep(0.0, 0.58, t));
  col = mix(col, cOrange, smoothstep(0.32, 1.0, t + length(uv - 0.5 - m) * 0.28));

  gl_FragColor = vec4(col, 1.0);
}

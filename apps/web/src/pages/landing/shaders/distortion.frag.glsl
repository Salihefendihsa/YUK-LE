// Full-screen UV ripple — consumed as fragment for ShaderMaterial overlays
uniform float uTime;
uniform vec2 uMouse;
uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 d = (uMouse - uv) * 2.0;
  float len = length(d) + 0.001;
  vec2 dir = d / len;
  float ripple = sin(len * 18.0 - uTime * 3.0) * 0.012;
  uv += dir * ripple;
  gl_FragColor = texture2D(uTexture, uv);
}
